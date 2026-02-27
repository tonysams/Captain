import Foundation
import AVFoundation
import SwiftUI
import Combine

// MARK: - PlaybackViewModel
// AVPlayer lifecycle + overlay visibility toggle.

@MainActor
final class PlaybackViewModel: ObservableObject {

    @Published var player: AVPlayer?
    @Published var isPaused: Bool = true
    @Published var totalDuration: Double = 30
    @Published var overlayVisibility = OverlayVisibility()
    @Published var showCueCard: Bool = true

    private var timeObserver: Any?
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Setup

    func load(url: URL) {
        let item = AVPlayerItem(url: url)
        player = AVPlayer(playerItem: item)

        // Observe duration
        item.publisher(for: \.status)
            .filter { $0 == .readyToPlay }
            .sink { [weak self, weak item] _ in
                guard let self, let item else { return }
                Task { @MainActor in
                    let d = try? await item.asset.load(.duration)
                    self.totalDuration = d.map { CMTimeGetSeconds($0) } ?? 30
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Playback controls

    func togglePlayPause() {
        guard let player else { return }
        if isPaused {
            player.play()
            isPaused = false
        } else {
            player.pause()
            isPaused = true
        }
    }

    func seek(to seconds: Double) {
        player?.seek(to: CMTime(seconds: seconds, preferredTimescale: 600))
        isPaused = true
        player?.pause()
    }

    func pause() {
        player?.pause()
        isPaused = true
    }

    // MARK: - Overlay visibility

    func toggleOverlay(_ type: OverlayType) {
        overlayVisibility[type].toggle()
    }

    // MARK: - Cleanup

    func teardown() {
        if let obs = timeObserver { player?.removeTimeObserver(obs) }
        player = nil
        cancellables.removeAll()
    }
}
