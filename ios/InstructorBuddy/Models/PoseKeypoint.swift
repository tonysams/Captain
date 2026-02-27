import Foundation
import Vision
import CoreGraphics

// MARK: - PoseKeypoint

/// A single body landmark in normalised coordinates (0…1, top-left origin).
struct PoseKeypoint: Codable, Identifiable {
    let id: Int           // MediaPipe landmark index (0-32)
    var x: Double         // normalised horizontal  (0 = left,   1 = right)
    var y: Double         // normalised vertical    (0 = top,    1 = bottom)
    var z: Double         // depth estimate (optional, 0 when unknown)
    var visibility: Double // 0…1 confidence

    /// Pixel position given a bounding rect.
    func cgPoint(in rect: CGRect) -> CGPoint {
        CGPoint(x: x * rect.width + rect.minX,
                y: y * rect.height + rect.minY)
    }
}

// MARK: - Angle computation

extension Array where Element == PoseKeypoint {

    /// Returns the angle at `mid` formed by the rays mid→a and mid→b (degrees).
    func angle(a aID: Int, mid midID: Int, b bID: Int) -> Double? {
        guard let a   = first(where: { $0.id == aID }),
              let mid = first(where: { $0.id == midID }),
              let b   = first(where: { $0.id == bID }),
              a.visibility > 0.3, mid.visibility > 0.3, b.visibility > 0.3
        else { return nil }

        let v1 = CGVector(dx: a.x - mid.x, dy: a.y - mid.y)
        let v2 = CGVector(dx: b.x - mid.x, dy: b.y - mid.y)
        let dot = v1.dx * v2.dx + v1.dy * v2.dy
        let mag = sqrt(v1.dx * v1.dx + v1.dy * v1.dy) *
                  sqrt(v2.dx * v2.dx + v2.dy * v2.dy)
        guard mag > 0 else { return nil }
        return acos(max(-1, min(1, dot / mag))) * 180 / .pi
    }
}

// MARK: - Vision → MediaPipe mapping

extension PoseKeypoint {

    // MARK: MediaPipe landmark IDs used by the backend
    //
    // 0  nose
    // 11 left shoulder   12 right shoulder
    // 13 left elbow      14 right elbow
    // 15 left wrist      16 right wrist
    // 23 left hip        24 right hip
    // 25 left knee       26 right knee
    // 27 left ankle      28 right ankle
    //
    // Apple Vision provides 19 joints mapped below.
    // Unmapped MediaPipe IDs (1-10, 17-22, 29-32) are emitted with visibility=0.

    static func fromVisionObservation(_ observation: VNHumanBodyPoseObservation) -> [PoseKeypoint] {
        // Build a quick lookup: VNHumanBodyPoseObservation.JointName → PoseKeypoint
        var result: [Int: PoseKeypoint] = [:]

        func add(_ joint: VNHumanBodyPoseObservation.JointName, mediaPipeID: Int) {
            guard let point = try? observation.recognizedPoint(joint),
                  point.confidence > 0.1 else { return }
            // Vision uses bottom-left origin → flip Y for top-left origin
            result[mediaPipeID] = PoseKeypoint(
                id:         mediaPipeID,
                x:          Double(point.location.x),
                y:          1.0 - Double(point.location.y),  // ← critical Y-flip
                z:          0,
                visibility: Double(point.confidence)
            )
        }

        add(.nose,           mediaPipeID: 0)
        add(.leftShoulder,   mediaPipeID: 11)
        add(.rightShoulder,  mediaPipeID: 12)
        add(.leftElbow,      mediaPipeID: 13)
        add(.rightElbow,     mediaPipeID: 14)
        add(.leftWrist,      mediaPipeID: 15)
        add(.rightWrist,     mediaPipeID: 16)
        add(.leftHip,        mediaPipeID: 23)
        add(.rightHip,       mediaPipeID: 24)
        add(.leftKnee,       mediaPipeID: 25)
        add(.rightKnee,      mediaPipeID: 26)
        add(.leftAnkle,      mediaPipeID: 27)
        add(.rightAnkle,     mediaPipeID: 28)

        // Fill unmapped MediaPipe IDs with zero-visibility placeholders so the
        // backend always receives a 33-element array (indices 0-32).
        let allIDs = Array(0...32)
        return allIDs.map { id in
            result[id] ?? PoseKeypoint(id: id, x: 0, y: 0, z: 0, visibility: 0)
        }
    }
}

// MARK: - Frame-scoring helpers (mirrors React Native useFrameExtraction logic)

extension Array where Element == PoseKeypoint {

    /// Minimum knee angle — lower = deeper flex = higher skiing score.
    func edgeAngleScore() -> Double {
        let leftKnee  = angle(a: 23, mid: 25, b: 27) ?? 180
        let rightKnee = angle(a: 24, mid: 26, b: 28) ?? 180
        let minAngle  = min(leftKnee, rightKnee)
        return max(0, (180 - minAngle) / 180)
    }

    /// Lateral hip-centre displacement for turn-initiation detection.
    /// Pass the previous frame's keypoints to compute acceleration.
    func turnInitiationScore(previous prev: [PoseKeypoint]?) -> Double {
        guard let prev else { return 0 }
        let lhCur  = first(where: { $0.id == 23 })
        let rhCur  = first(where: { $0.id == 24 })
        let lhPrev = prev.first(where: { $0.id == 23 })
        let rhPrev = prev.first(where: { $0.id == 24 })
        guard let lhc = lhCur, let rhc = rhCur,
              let lhp = lhPrev, let rhp = rhPrev else { return 0 }
        let curCentreX  = (lhc.x + rhc.x) / 2
        let prevCentreX = (lhp.x + rhp.x) / 2
        return min(1, abs(curCentreX - prevCentreX) * 10)
    }

    /// Pole-plant detection: wrist below hip line and highly visible.
    func polePlantScore() -> Double {
        let lw = first(where: { $0.id == 15 })
        let rw = first(where: { $0.id == 16 })
        let trigger = [lw, rw].compactMap { $0 }.first { $0.y > 0.75 && $0.visibility > 0.7 }
        return trigger != nil ? 1.0 : 0.0
    }

    /// Hip-shoulder separation angle.
    func hipShoulderSeparation() -> Double {
        guard let ls = first(where: { $0.id == 11 }),
              let rs = first(where: { $0.id == 12 }),
              let lh = first(where: { $0.id == 23 }),
              let rh = first(where: { $0.id == 24 }) else { return 0 }
        let shoulderAngle = atan2(rs.y - ls.y, rs.x - ls.x)
        let hipAngle      = atan2(rh.y - lh.y, rh.x - lh.x)
        return min(1, abs(shoulderAngle - hipAngle) / (.pi / 4))
    }

    /// Combined frame importance score (0…1).
    func frameScore(previous prev: [PoseKeypoint]? = nil) -> Double {
        let edge  = edgeAngleScore()         * 0.4
        let turn  = turnInitiationScore(previous: prev) * 0.3
        let pole  = polePlantScore()         * 0.15
        let sep   = hipShoulderSeparation()  * 0.15
        return edge + turn + pole + sep
    }
}
