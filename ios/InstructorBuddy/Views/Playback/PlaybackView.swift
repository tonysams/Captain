import SwiftUI
import AVFoundation

// MARK: - PlaybackView
// Composite: video player + overlay canvas + coaching cue card + scrubber.

struct PlaybackView: View {

    @StateObject private var playbackVM = PlaybackViewModel()
    @EnvironmentObject private var sessionVM: SessionViewModel

    let sessionId: String

    private let screenWidth  = UIScreen.main.bounds.width
    private var videoHeight:  CGFloat { screenWidth / (16 / 9) }

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {

                // ── Video + overlays ──
                ZStack {
                    // Video player
                    if let player = playbackVM.player {
                        VideoPlayerView(player: player)
                            .frame(width: screenWidth, height: videoHeight)
                    } else {
                        Rectangle()
                            .fill(AppColors.bgCard)
                            .frame(width: screenWidth, height: videoHeight)
                            .overlay(
                                Text("Loading video…")
                                    .foregroundColor(AppColors.textMuted)
                                    .font(.subheadline)
                            )
                    }

                    // Overlay canvas
                    if let frame = sessionVM.selectedFrame {
                        OverlayCanvasView(
                            overlays:   frame.overlays.isEmpty
                                            ? (frame.coaching?.overlays ?? [])
                                            : frame.overlays,
                            keypoints:  frame.poseKeypoints,
                            visibility: playbackVM.overlayVisibility
                        )
                        .frame(width: screenWidth, height: videoHeight)
                    }

                    // Play/pause tap target
                    Color.clear
                        .contentShape(Rectangle())
                        .onTapGesture { playbackVM.togglePlayPause() }

                    // Report button (top-right)
                    VStack {
                        HStack {
                            Spacer()
                            NavigationLink(destination: ReportView(sessionId: sessionId)
                                .environmentObject(sessionVM)) {
                                Image(systemName: "list.clipboard")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundColor(.white)
                                    .padding(10)
                                    .background(Color.black.opacity(0.6))
                                    .clipShape(Circle())
                            }
                            .padding(.trailing, 12)
                            .padding(.top, 12)
                        }
                        Spacer()
                    }
                }
                .frame(height: videoHeight)

                // ── Scrubber ──
                VideoScrubberView(
                    frames:         sessionVM.frames,
                    selectedIndex:  sessionVM.selectedFrameIndex,
                    totalDuration:  playbackVM.totalDuration,
                    overlayVisibility: $playbackVM.overlayVisibility,
                    onFrameSelect: { idx in
                        sessionVM.selectFrame(at: idx)
                        if let ts = sessionVM.selectedFrame?.timestamp {
                            playbackVM.seek(to: ts)
                        }
                        playbackVM.showCueCard = true
                    },
                    onOverlayToggle: { type in
                        playbackVM.toggleOverlay(type)
                    }
                )

                Spacer()
            }

            // ── Coaching cue card ──
            if let coaching = sessionVM.selectedFrame?.coaching {
                CoachingCueCard(
                    coaching: coaching,
                    visible:  playbackVM.showCueCard && playbackVM.isPaused,
                    onDismiss: { playbackVM.showCueCard = false }
                )
                .padding(.bottom, 0)
            }
        }
        .navigationTitle("Playback")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { setup() }
        .onDisappear { playbackVM.teardown() }
    }

    private func setup() {
        Task {
            await sessionVM.loadSession(id: sessionId)
            if let uri = sessionVM.currentSession?.localVideoUrl.flatMap(URL.init(string:))
                         ?? sessionVM.currentSession?.videoUrl.flatMap(URL.init(string:)) {
                playbackVM.load(url: uri)
            }
        }
    }
}
