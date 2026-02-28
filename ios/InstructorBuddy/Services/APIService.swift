import Foundation

// MARK: - APIService
// URLSession wrapper for all Instructor Buddy backend routes.
// Automatically injects Authorization header from AuthService.

final class APIService {

    static let shared = APIService()
    private init() {}

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    // MARK: - Sessions

    func createSession(_ body: CreateSessionRequest) async throws -> Session {
        try await post("/sessions", body: body)
    }

    func getSession(id: String) async throws -> Session {
        try await get("/sessions/\(id)")
    }

    func listSessions() async throws -> SessionsResponse {
        try await get("/sessions")
    }

    func addNote(sessionId: String, content: String) async throws -> SessionNote {
        struct Body: Encodable { let content: String }
        return try await post("/sessions/\(sessionId)/notes", body: Body(content: content))
    }

    func getReport(sessionId: String) async throws -> SessionReportResponse {
        try await get("/sessions/\(sessionId)/report")
    }

    // MARK: - Frames

    func uploadFrame(_ body: UploadFrameRequest, sessionId: String) async throws -> UploadFrameResponse {
        try await post("/sessions/\(sessionId)/frames", body: body)
    }

    // MARK: - Students

    func listStudents() async throws -> StudentsResponse {
        try await get("/students")
    }

    func getStudent(id: String) async throws -> Student {
        try await get("/students/\(id)")
    }

    func createStudent(_ body: CreateStudentRequest) async throws -> Student {
        try await post("/students", body: body)
    }

    func getStudentSessions(studentId: String) async throws -> SessionsResponse {
        try await get("/students/\(studentId)/sessions")
    }

    // MARK: - Analytics

    func getCostAnalytics() async throws -> CostAnalytics {
        try await get("/analytics/costs")
    }

    // MARK: - Generic HTTP helpers

    private func get<T: Decodable>(_ path: String) async throws -> T {
        let req = try await buildRequest(path: path, method: "GET", body: nil as EmptyBody?)
        return try await perform(req)
    }

    private func post<B: Encodable, T: Decodable>(_ path: String, body: B) async throws -> T {
        let req = try await buildRequest(path: path, method: "POST", body: body)
        return try await perform(req)
    }

    private func buildRequest<B: Encodable>(
        path: String,
        method: String,
        body: B?
    ) async throws -> URLRequest {
        let token = try await AuthService.shared.refreshIfNeeded()
        guard let url = URL(string: AppConfig.apiURL + path) else {
            throw APIError.invalidURL
        }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        req.timeoutInterval = 60

        if let b = body {
            req.httpBody = try encoder.encode(b)
        }
        return req
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        if http.statusCode == 401 {
            // If the request carried no Authorization header we're in guest mode —
            // don't sign out, just surface the error. Avoids touching @MainActor state.
            let hasAuth = request.value(forHTTPHeaderField: "Authorization") != nil
            if hasAuth {
                await MainActor.run { AuthService.shared.signOut() }
            }
            throw APIError.unauthorized
        }

        guard (200...299).contains(http.statusCode) else {
            let msg = (try? JSONDecoder().decode(APIErrorBody.self, from: data))?.error
                ?? HTTPURLResponse.localizedString(forStatusCode: http.statusCode)
            throw APIError.serverError(http.statusCode, msg)
        }

        return try decoder.decode(T.self, from: data)
    }
}

// MARK: - Supporting types

private struct EmptyBody: Encodable {}

private struct APIErrorBody: Decodable {
    let error: String?
    let message: String?
}

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case serverError(Int, String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:               return "Invalid API URL."
        case .invalidResponse:          return "Received an invalid response."
        case .unauthorized:             return "Session expired. Please sign in again."
        case .serverError(let c, let m): return "Server error \(c): \(m)"
        }
    }
}
