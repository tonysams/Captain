import Foundation
import SwiftUI

// MARK: - SessionViewModel
// Manages current session, frame list, and frame selection.

@MainActor
final class SessionViewModel: ObservableObject {

    @Published var sessions: [Session] = []
    @Published var currentSession: Session?
    @Published var frames: [AnalyzedFrame] = []
    @Published var selectedFrameIndex: Int = 0
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    var selectedFrame: AnalyzedFrame? {
        guard selectedFrameIndex < frames.count else { return nil }
        return frames[selectedFrameIndex]
    }

    // MARK: - Session list

    func loadSessions() async {
        isLoading = true
        defer { isLoading = false }
        do {
            sessions = try await APIService.shared.listSessions().sessions
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Create / load single session

    func createSession(focusArea: FocusArea, skillLevel: SkillLevel, studentId: String? = nil) async throws -> Session {
        let req = CreateSessionRequest(focusArea: focusArea, skillLevel: skillLevel, studentId: studentId)
        let session = try await APIService.shared.createSession(req)
        currentSession = session
        frames = []
        selectedFrameIndex = 0
        return session
    }

    func loadSession(id: String) async {
        isLoading = true
        defer { isLoading = false }
        do {
            let session = try await APIService.shared.getSession(id: id)
            currentSession = session
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Frame management

    func addFrame(_ frame: AnalyzedFrame) {
        frames.append(frame)
    }

    func updateFrameCoaching(frameId: String, coaching: CoachingResult, overlays: [Overlay]) {
        guard let idx = frames.firstIndex(where: { $0.id == frameId }) else { return }
        frames[idx].coaching = coaching
        frames[idx].overlays = overlays
    }

    func selectFrame(at index: Int) {
        guard index >= 0, index < frames.count else { return }
        selectedFrameIndex = index
    }

    func selectNextFrame() {
        if selectedFrameIndex + 1 < frames.count {
            selectedFrameIndex += 1
        }
    }

    func selectPreviousFrame() {
        if selectedFrameIndex > 0 {
            selectedFrameIndex -= 1
        }
    }

    // MARK: - Notes

    func addNote(content: String) async throws {
        guard let session = currentSession else { return }
        _ = try await APIService.shared.addNote(sessionId: session.id, content: content)
    }

    // MARK: - Report

    func getReport() async throws -> SessionReportResponse {
        guard let session = currentSession else {
            throw APIError.invalidURL
        }
        return try await APIService.shared.getReport(sessionId: session.id)
    }
}
