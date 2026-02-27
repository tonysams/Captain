import Foundation
import Security

// MARK: - AuthService
// Handles Supabase email/password auth and stores the JWT in the Keychain.

@MainActor
final class AuthService: ObservableObject {

    static let shared = AuthService()

    @Published var isAuthenticated = false
    @Published var currentUser: UserInfo?
    @Published var isLoading = false

    /// Set to true by AppViewModel.continueAsGuest() — skips all Supabase calls.
    var isGuestMode: Bool = false

    private let keychainKey = "com.instructorbuddy.access_token"
    private let refreshKey  = "com.instructorbuddy.refresh_token"

    struct UserInfo {
        let id: String
        let email: String
    }

    // MARK: - Stored token

    var accessToken: String? {
        get { keychainGet(key: keychainKey) }
        set {
            if let v = newValue { keychainSet(key: keychainKey, value: v) }
            else                { keychainDelete(key: keychainKey) }
        }
    }

    private var refreshToken: String? {
        get { keychainGet(key: refreshKey) }
        set {
            if let v = newValue { keychainSet(key: refreshKey, value: v) }
            else                { keychainDelete(key: refreshKey) }
        }
    }

    // MARK: - Init (restore session on launch)

    private init() {
        if let token = accessToken {
            Task { await validateToken(token) }
        }
    }

    // MARK: - Public API

    func signIn(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }

        let url = URL(string: "\(AppConfig.supabaseURL)/auth/v1/token?grant_type=password")!
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.httpBody = try JSONEncoder().encode(["email": email, "password": password])

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            let msg = (try? JSONDecoder().decode(SupabaseError.self, from: data))?.message ?? "Sign-in failed"
            throw AuthError.serverError(msg)
        }

        let result = try JSONDecoder().decode(SupabaseTokenResponse.self, from: data)
        accessToken  = result.accessToken
        refreshToken = result.refreshToken
        currentUser  = UserInfo(id: result.user.id, email: result.user.email)
        isAuthenticated = true
    }

    func signUp(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }

        let url = URL(string: "\(AppConfig.supabaseURL)/auth/v1/signup")!
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.httpBody = try JSONEncoder().encode(["email": email, "password": password])

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            let msg = (try? JSONDecoder().decode(SupabaseError.self, from: data))?.message ?? "Sign-up failed"
            throw AuthError.serverError(msg)
        }

        let result = try JSONDecoder().decode(SupabaseTokenResponse.self, from: data)
        accessToken  = result.accessToken
        refreshToken = result.refreshToken
        currentUser  = UserInfo(id: result.user.id, email: result.user.email)
        isAuthenticated = true
    }

    func signOut() {
        accessToken  = nil
        refreshToken = nil
        currentUser  = nil
        isAuthenticated = false
    }

    // MARK: - Token refresh

    func refreshIfNeeded() async throws -> String {
        if isGuestMode { return "" }   // guest mode — no token needed
        guard let token = accessToken else { throw AuthError.notAuthenticated }
        // Attempt to decode expiry from JWT payload
        if !isExpired(jwt: token) { return token }

        guard let rToken = refreshToken else {
            signOut()
            throw AuthError.notAuthenticated
        }

        let url = URL(string: "\(AppConfig.supabaseURL)/auth/v1/token?grant_type=refresh_token")!
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.httpBody = try JSONEncoder().encode(["refresh_token": rToken])

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            signOut()
            throw AuthError.notAuthenticated
        }

        let result = try JSONDecoder().decode(SupabaseTokenResponse.self, from: data)
        accessToken  = result.accessToken
        refreshToken = result.refreshToken
        return result.accessToken
    }

    // MARK: - Private helpers

    private func validateToken(_ token: String) async {
        if !isExpired(jwt: token) {
            // Decode user from JWT
            if let payload = jwtPayload(token),
               let sub   = payload["sub"]   as? String,
               let email = payload["email"] as? String {
                currentUser     = UserInfo(id: sub, email: email)
                isAuthenticated = true
            }
        } else {
            // Try refresh
            do { _ = try await refreshIfNeeded(); isAuthenticated = true }
            catch { signOut() }
        }
    }

    private func isExpired(jwt: String) -> Bool {
        guard let payload = jwtPayload(jwt),
              let exp = payload["exp"] as? TimeInterval else { return true }
        return Date(timeIntervalSince1970: exp) < Date().addingTimeInterval(60)
    }

    private func jwtPayload(_ jwt: String) -> [String: Any]? {
        let parts = jwt.components(separatedBy: ".")
        guard parts.count == 3 else { return nil }
        var base64 = parts[1]
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        let rem = base64.count % 4
        if rem > 0 { base64 += String(repeating: "=", count: 4 - rem) }
        guard let data = Data(base64Encoded: base64) else { return nil }
        return try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    }

    // MARK: - Keychain wrappers

    private func keychainSet(key: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }
        keychainDelete(key: key)
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrAccount: key,
            kSecValueData:   data
        ]
        SecItemAdd(query as CFDictionary, nil)
    }

    private func keychainGet(key: String) -> String? {
        let query: [CFString: Any] = [
            kSecClass:            kSecClassGenericPassword,
            kSecAttrAccount:      key,
            kSecReturnData:       true,
            kSecMatchLimit:       kSecMatchLimitOne
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func keychainDelete(key: String) {
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrAccount: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Supporting types

private struct SupabaseTokenResponse: Decodable {
    let accessToken:  String
    let refreshToken: String
    let user: SupabaseUser

    enum CodingKeys: String, CodingKey {
        case accessToken  = "access_token"
        case refreshToken = "refresh_token"
        case user
    }
}

private struct SupabaseUser: Decodable {
    let id: String
    let email: String
}

private struct SupabaseError: Decodable {
    let message: String
}

enum AuthError: LocalizedError {
    case notAuthenticated
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:    return "You are not signed in."
        case .serverError(let m):  return m
        }
    }
}
