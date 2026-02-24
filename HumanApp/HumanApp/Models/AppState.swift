import SwiftUI

// MARK: — Screen enum drives all navigation
enum Screen: Equatable {
    case entry
    case thinking
    case response(ClaudeResponse)

    static func == (lhs: Screen, rhs: Screen) -> Bool {
        switch (lhs, rhs) {
        case (.entry, .entry):     return true
        case (.thinking, .thinking): return true
        case (.response(let a), .response(let b)): return a == b
        default: return false
        }
    }
}

// MARK: — Shared app state
@MainActor
class AppState: ObservableObject {
    @Published var currentScreen: Screen = .entry
    @Published var userInput: String = ""
    @Published var errorMessage: String? = nil

    // Current API task — stored so we can cancel if the user navigates back
    private var activeTask: Task<Void, Never>?

    func navigate(to screen: Screen) {
        withAnimation(.easeInOut(duration: 0.45)) {
            currentScreen = screen
        }
    }

    // Called by EntryView when the user taps submit
    func submit() {
        let query = userInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return }

        activeTask?.cancel()
        navigate(to: .thinking)
        errorMessage = nil

        activeTask = Task {
            do {
                let result = try await ClaudeAPIService.fetchExplanation(for: query)
                guard !Task.isCancelled else { return }
                navigate(to: .response(result))
            } catch {
                guard !Task.isCancelled else { return }
                errorMessage = "Something went wrong. Try again."
                navigate(to: .entry)
            }
        }
    }

    // Cancel any in-flight request (e.g. user taps back from thinking screen)
    func cancelActiveTask() {
        activeTask?.cancel()
        activeTask = nil
    }
}
