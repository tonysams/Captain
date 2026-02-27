import Foundation

// MARK: - CoachingObservation

struct CoachingObservation: Codable {
    let text: String
    let confidence: Double
    let bodyRegion: String?

    enum CodingKeys: String, CodingKey {
        case text
        case confidence
        case bodyRegion = "body_region"
    }
}

// MARK: - CoachingResult
//
// Stored on an AnalyzedFrame after the backend processes the frame.
// Mirrors the JSON returned by POST /sessions/:id/frames → analysis_result.

struct CoachingResult: Codable {
    let primaryObservation: CoachingObservation
    let secondaryObservation: CoachingObservation?
    let cue: String                   // ≤12 words, actionable coaching cue
    let overlays: [Overlay]

    enum CodingKeys: String, CodingKey {
        case primaryObservation   = "primary_observation"
        case secondaryObservation = "secondary_observation"
        case cue
        case overlays
    }
}

// MARK: - UploadFrameRequest

struct UploadFrameRequest: Codable {
    let frameIndex: Int
    let timestamp: Double
    let imageBase64: String
    let poseKeypoints: [PoseKeypoint]
    let context: FrameContext?

    enum CodingKeys: String, CodingKey {
        case frameIndex   = "frame_index"
        case timestamp
        case imageBase64  = "image_base64"
        case poseKeypoints = "pose_keypoints"
        case context
    }
}

struct FrameContext: Codable {
    let focusArea: String
    let skillLevel: String
    let totalFrames: Int

    enum CodingKeys: String, CodingKey {
        case focusArea   = "focus_area"
        case skillLevel  = "skill_level"
        case totalFrames = "total_frames"
    }
}

// MARK: - UploadFrameResponse

struct UploadFrameResponse: Codable {
    let frameId: String
    let analysisResult: CoachingResult
    let overlays: [Overlay]
    let tokensUsed: Int
    let estimatedCost: Double

    enum CodingKeys: String, CodingKey {
        case frameId       = "frame_id"
        case analysisResult = "analysis_result"
        case overlays
        case tokensUsed    = "tokens_used"
        case estimatedCost = "estimated_cost"
    }
}

// MARK: - CostAnalytics

struct CostAnalytics: Codable {
    let period: String
    let totalCost: Double
    let totalSessions: Int
    let totalFramesAnalyzed: Int
    let averageCostPerSession: Double
    let breakdown: [CostBreakdownItem]

    enum CodingKeys: String, CodingKey {
        case period
        case totalCost             = "total_cost"
        case totalSessions         = "total_sessions"
        case totalFramesAnalyzed   = "total_frames_analyzed"
        case averageCostPerSession = "average_cost_per_session"
        case breakdown
    }
}

struct CostBreakdownItem: Codable, Identifiable {
    var id: String { date }
    let date: String
    let cost: Double
    let sessions: Int
    let frames: Int
}
