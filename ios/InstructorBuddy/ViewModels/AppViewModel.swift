import Foundation
import SwiftUI

// MARK: - AppViewModel
// Global auth state + navigation root.

@MainActor
final class AppViewModel: ObservableObject {

    @Published var isAuthenticated: Bool = false
    @Published var hasCompletedOnboarding: Bool = false
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    private let onboardingKey = "has_completed_onboarding"
    private let auth = AuthService.shared

    init() {
        hasCompletedOnboarding = UserDefaults.standard.bool(forKey: onboardingKey)
        // Mirror auth service state
        isAuthenticated = auth.isAuthenticated
        // Keep in sync as auth state changes
        Task {
            for await _ in NotificationCenter.default.notifications(named: .authStateChanged) {
                self.isAuthenticated = auth.isAuthenticated
            }
        }
    }

    // MARK: - Auth

    func signIn(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        do {
            try await auth.signIn(email: email, password: password)
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func signUp(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        do {
            try await auth.signUp(email: email, password: password)
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func signOut() {
        auth.signOut()
        isAuthenticated = false
    }

    // MARK: - Onboarding

    func completeOnboarding() {
        UserDefaults.standard.set(true, forKey: onboardingKey)
        hasCompletedOnboarding = true
    }
}

extension Notification.Name {
    static let authStateChanged = Notification.Name("AuthStateChanged")
}
