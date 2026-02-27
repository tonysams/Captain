import Foundation

// MARK: - Student

struct Student: Codable, Identifiable {
    let id: String
    var name: String
    var email: String?
    var skillLevel: SkillLevel
    var notes: String?
    var sessionCount: Int
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case email
        case skillLevel  = "skill_level"
        case notes
        case sessionCount = "session_count"
        case createdAt   = "created_at"
    }
}

// MARK: - InstructorProfile

struct InstructorProfile: Codable, Identifiable {
    let id: String
    var email: String
    var fullName: String?
    var psiaLevel: PSIALevel
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case fullName  = "full_name"
        case psiaLevel = "psia_level"
        case createdAt = "created_at"
    }
}

enum PSIALevel: String, Codable, CaseIterable {
    case level1   = "level_1"
    case level2   = "level_2"
    case level3   = "level_3"
    case examiner = "examiner"

    var label: String {
        switch self {
        case .level1:   return "PSIA Level I"
        case .level2:   return "PSIA Level II"
        case .level3:   return "PSIA Level III"
        case .examiner: return "PSIA Examiner"
        }
    }
}

// MARK: - Create/Update requests

struct CreateStudentRequest: Codable {
    let name: String
    let email: String?
    let skillLevel: SkillLevel
    let notes: String?

    enum CodingKeys: String, CodingKey {
        case name
        case email
        case skillLevel = "skill_level"
        case notes
    }
}

// MARK: - API list responses

struct StudentsResponse: Codable {
    let students: [Student]
}

struct SessionsResponse: Codable {
    let sessions: [Session]
}
