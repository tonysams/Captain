import Foundation

// MARK: - Enums

enum FocusArea: String, Codable, CaseIterable {
    case overall = "overall"
    case edging = "edging"
    case weightTransfer = "weight_transfer"
    case upperBody = "upper_body"
    case timing = "timing"
    case balance = "balance"

    var label: String {
        switch self {
        case .overall:        return "Overall Technique"
        case .edging:         return "Edging"
        case .weightTransfer: return "Weight Transfer"
        case .upperBody:      return "Upper Body"
        case .timing:         return "Timing"
        case .balance:        return "Balance"
        }
    }
}

enum SkillLevel: String, Codable, CaseIterable {
    case beginner     = "beginner"
    case intermediate = "intermediate"
    case advanced     = "advanced"
    case expert       = "expert"

    var label: String {
        switch self {
        case .beginner:     return "Beginner"
        case .intermediate: return "Intermediate"
        case .advanced:     return "Advanced"
        case .expert:       return "Expert / Racer"
        }
    }
}

enum SessionStatus: String, Codable {
    case recording  = "recording"
    case processing = "processing"
    case completed  = "completed"
    case failed     = "failed"
}

// MARK: - Session

struct Session: Codable, Identifiable {
    let id: String
    let instructorId: String
    var studentId: String?
    var status: SessionStatus
    var focusArea: FocusArea
    var skillLevel: SkillLevel
    var videoUrl: String?
    var localVideoUrl: String?        // file:// URI on device
    var frameCount: Int
    var analyzedCount: Int
    var createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case instructorId  = "instructor_id"
        case studentId     = "student_id"
        case status
        case focusArea     = "focus_area"
        case skillLevel    = "skill_level"
        case videoUrl      = "video_url"
        case localVideoUrl
        case frameCount    = "frame_count"
        case analyzedCount = "analyzed_count"
        case createdAt     = "created_at"
        case updatedAt     = "updated_at"
    }
}

// MARK: - AnalyzedFrame

struct AnalyzedFrame: Codable, Identifiable {
    let id: String
    let sessionId: String
    var frameIndex: Int
    var timestamp: Double
    var imageUrl: String?
    var poseKeypoints: [PoseKeypoint]
    var coaching: CoachingResult?
    var overlays: [Overlay]
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case sessionId     = "session_id"
        case frameIndex    = "frame_index"
        case timestamp
        case imageUrl      = "image_url"
        case poseKeypoints = "pose_keypoints"
        case coaching
        case overlays
        case createdAt     = "created_at"
    }
}

// MARK: - SessionNote

struct SessionNote: Codable, Identifiable {
    let id: String
    let sessionId: String
    var content: String
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case sessionId = "session_id"
        case content
        case createdAt = "created_at"
    }
}

// MARK: - API request/response helpers

struct CreateSessionRequest: Codable {
    let focusArea: FocusArea
    let skillLevel: SkillLevel
    let studentId: String?

    enum CodingKeys: String, CodingKey {
        case focusArea  = "focus_area"
        case skillLevel = "skill_level"
        case studentId  = "student_id"
    }
}

struct SessionReportResponse: Codable {
    let reportId: String
    let sessionId: String
    let generatedAt: Date
    let focusArea: String
    let skillLevel: String
    let frameCount: Int
    let frames: [ReportFrame]
    let notes: [SessionNote]
    let shareUrl: String

    enum CodingKeys: String, CodingKey {
        case reportId    = "report_id"
        case sessionId   = "session_id"
        case generatedAt = "generated_at"
        case focusArea   = "focus_area"
        case skillLevel  = "skill_level"
        case frameCount  = "frame_count"
        case frames
        case notes
        case shareUrl    = "share_url"
    }
}

struct ReportFrame: Codable {
    let frameIndex: Int
    let timestamp: Double
    let analysisResults: [AnalysisResult]

    struct AnalysisResult: Codable {
        let primaryObservation: PrimaryObservation
        let cue: String
        let createdAt: Date

        struct PrimaryObservation: Codable {
            let text: String
            let confidence: Double
        }

        enum CodingKeys: String, CodingKey {
            case primaryObservation = "primary_observation"
            case cue
            case createdAt          = "created_at"
        }
    }

    enum CodingKeys: String, CodingKey {
        case frameIndex      = "frame_index"
        case timestamp
        case analysisResults = "analysis_results"
    }
}
