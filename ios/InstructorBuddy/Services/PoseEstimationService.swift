import Foundation
import Vision
import UIKit
import CoreGraphics

// MARK: - PoseEstimationService
// Runs Apple Vision's VNDetectHumanBodyPoseRequest on a single CGImage
// and converts the result to the 33-point MediaPipe format used by the backend.

enum PoseEstimationService {

    /// Estimate body pose for one frame.
    /// Returns an array of 33 PoseKeypoints (indices 0-32).
    /// Keypoints without a Vision equivalent have visibility = 0.
    static func estimate(image: CGImage) async throws -> [PoseKeypoint] {
        return try await withCheckedThrowingContinuation { continuation in
            let request = VNDetectHumanBodyPoseRequest { request, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let observations = request.results as? [VNHumanBodyPoseObservation],
                      let observation  = observations.first else {
                    // No person detected — return all-zero keypoints
                    let empty = (0...32).map { PoseKeypoint(id: $0, x: 0, y: 0, z: 0, visibility: 0) }
                    continuation.resume(returning: empty)
                    return
                }
                let keypoints = PoseKeypoint.fromVisionObservation(observation)
                continuation.resume(returning: keypoints)
            }

            let handler = VNImageRequestHandler(cgImage: image, options: [:])
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }

    /// Estimate pose for every CGImage in the array.
    /// Returns a parallel array of keypoint lists.
    static func estimateAll(images: [CGImage]) async throws -> [[PoseKeypoint]] {
        var results: [[PoseKeypoint]] = []
        for image in images {
            let kps = try await estimate(image: image)
            results.append(kps)
        }
        return results
    }
}
