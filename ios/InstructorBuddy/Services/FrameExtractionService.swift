import Foundation
import AVFoundation
import CoreGraphics
import UIKit

// MARK: - ExtractedFrame

struct ExtractedFrame {
    let index: Int
    let timestamp: Double        // seconds from start
    let image: CGImage
    var keypoints: [PoseKeypoint] = []
    var score: Double = 0
}

// MARK: - FrameExtractionService
// Extracts frames from a video URL at 4fps, estimates pose on each,
// scores them using the same algorithm as the React Native app,
// and returns the top N key frames sorted by timestamp.

final class FrameExtractionService {

    // MARK: - Public entry point

    /// Extract + rank key frames from a local video file.
    /// - Parameters:
    ///   - url:       file:// URL to the recorded video
    ///   - maxFrames: hard cap (default AppConfig.maxFramesPerSession = 15)
    ///   - onProgress: called with (completed, total) frame counts
    func extract(
        from url: URL,
        maxFrames: Int = AppConfig.maxFramesPerSession,
        onProgress: ((Int, Int) -> Void)? = nil
    ) async throws -> [ExtractedFrame] {

        // 1. Generate raw frames at 4fps
        let rawFrames = try await extractRawFrames(url: url, fps: 4)
        let total = rawFrames.count
        guard total > 0 else { return [] }

        // 2. Run Vision pose estimation on every frame
        var framesWithPose: [ExtractedFrame] = []
        for (i, frame) in rawFrames.enumerated() {
            let kps = (try? await PoseEstimationService.estimate(image: frame.image)) ?? []
            var f = frame
            f.keypoints = kps
            framesWithPose.append(f)
            onProgress?(i + 1, total)
        }

        // 3. Score each frame
        var scored = framesWithPose
        for i in scored.indices {
            let prev = i > 0 ? scored[i - 1].keypoints : nil
            scored[i].score = scored[i].keypoints.frameScore(previous: prev)
        }

        // 4. Sort by score descending, take top maxFrames, re-sort by timestamp
        let keyFrames = scored
            .sorted { $0.score > $1.score }
            .prefix(maxFrames)
            .sorted { $0.timestamp < $1.timestamp }

        return Array(keyFrames)
    }

    // MARK: - Private: AVAssetImageGenerator

    private func extractRawFrames(url: URL, fps: Double) async throws -> [ExtractedFrame] {
        let asset     = AVURLAsset(url: url)
        let duration  = try await asset.load(.duration)
        let seconds   = CMTimeGetSeconds(duration)
        guard seconds > 0 else { return [] }

        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.requestedTimeToleranceBefore   = CMTime(seconds: 0.1, preferredTimescale: 600)
        generator.requestedTimeToleranceAfter    = CMTime(seconds: 0.1, preferredTimescale: 600)

        // Build time array at `fps` intervals
        let interval   = 1.0 / fps
        var times: [NSValue] = []
        var t = 0.0
        while t < seconds {
            times.append(NSValue(time: CMTime(seconds: t, preferredTimescale: 600)))
            t += interval
        }

        // Batch generate
        var frames: [ExtractedFrame] = []
        return try await withCheckedThrowingContinuation { continuation in
            var completed = 0
            generator.generateCGImagesAsynchronously(forTimes: times) { requestedTime, cgImage, _, result, error in
                defer {
                    completed += 1
                    if completed == times.count {
                        let sorted = frames.sorted { $0.timestamp < $1.timestamp }
                        continuation.resume(returning: sorted)
                    }
                }
                if result == .succeeded, let img = cgImage {
                    let ts = CMTimeGetSeconds(requestedTime)
                    frames.append(ExtractedFrame(
                        index:     frames.count,
                        timestamp: ts,
                        image:     img
                    ))
                } else if let err = error {
                    // Log but don't fail — some frames may be unreadable
                    print("[FrameExtraction] frame at \(CMTimeGetSeconds(requestedTime))s error: \(err)")
                }
            }
        }
    }
}
