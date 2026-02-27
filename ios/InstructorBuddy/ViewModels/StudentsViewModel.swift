import Foundation

@MainActor
final class StudentsViewModel: ObservableObject {

    @Published var students: [Student] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    // MARK: - Fetch

    func loadStudents() async {
        isLoading = true
        defer { isLoading = false }
        do {
            students = try await APIService.shared.listStudents().students
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Create

    func createStudent(name: String, email: String?, skillLevel: SkillLevel, notes: String?) async throws {
        let req = CreateStudentRequest(name: name, email: email, skillLevel: skillLevel, notes: notes)
        let student = try await APIService.shared.createStudent(req)
        students.insert(student, at: 0)
    }

    // MARK: - Sessions for a student

    func sessions(for studentId: String) async throws -> [Session] {
        return try await APIService.shared.getStudentSessions(studentId: studentId).sessions
    }
}
