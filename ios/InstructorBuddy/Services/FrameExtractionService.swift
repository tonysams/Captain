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

final class FrameExtractionService: @unchecked Sendable {

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

    // MARK: - Private: AVAssetImageGenerator (sequential, no @Sendable closures)

    private func extractRawFrames(url: URL, fps: Double) async throws -> [ExtractedFrame] {
        let asset    = AVURLAsset(url: url)
        let duration = try await asset.load(.duration)
        let seconds  = CMTimeGetSeconds(duration)
        guard seconds > 0 else { return [] }

        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.requestedTimeToleranceBefore   = CMTime(seconds: 0.1, preferredTimescale: 600)
        generator.requestedTimeToleranceAfter    = CMTime(seconds: 0.1, preferredTimescale: 600)

        // Build timestamp list
        let interval = 1.0 / fps
        var timestamps: [Double] = []
        var t = 0.0
        while t < seconds {
            timestamps.append(t)
            t += interval
        }

        // Extract frames one-by-one — avoids @Sendable / Sendable conformance issues
        // that arise with generateCGImagesAsynchronously's concurrent callback.
        var frames: [ExtractedFrame] = []
        for (index, ts) in timestamps.enumerated() {
            let cmTime = CMTime(seconds: ts, preferredTimescale: 600)
            do {
                let cgImage = try generator.copyCGImage(at: cmTime, actualTime: nil)
                frames.append(ExtractedFrame(index: index, timestamp: ts, image: cgImage))
            } catch {
                // Unreadable frame — skip and continue
                print("[FrameExtraction] skipping frame at \(String(format: "%.2f", ts))s: \(error.localizedDescription)")
            }
        }
        return frames
    }
}
