import SwiftUI

// MARK: - AnalysisView
// 3-stage animated pipeline progress: extract → pose → analyse.
// Navigates to PlaybackView when all frames are processed.

struct AnalysisView: View {

    let sessionId: String
    @EnvironmentObject private var sessionVM: SessionViewModel
    @State private var stage: Stage = .extracting
    @State private var progress: Double = 0        // 0…1 within current stage
    @State private var totalFrames: Int = 0
    @State private var processedFrames: Int = 0
    @State private var errorMessage: String?
    @State private var navigateToPlayback = false
    @State private var isPulsing = false

    enum Stage: Int, CaseIterable {
        case extracting = 0
        case posing     = 1
        case analysing  = 2
        case done       = 3

        var label: String {
            switch self {
            case .extracting: return "Extracting frames"
            case .posing:     return "Detecting pose"
            case .analysing:  return "AI analysis"
            case .done:       return "Complete"
            }
        }

        var icon: String {
            switch self {
            case .extracting: return "film.stack"
            case .posing:     return "figure.skiing.downhill"
            case .analysing:  return "brain"
            case .done:       return "checkmark.circle.fill"
            }
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.bg.ignoresSafeArea()

                VStack(spacing: 32) {
                    Spacer()

                    // Animated icon
                    ZStack {
                        Circle()
                            .fill(AppColors.primary.opacity(0.12))
                            .frame(width: 120, height: 120)
                        Image(systemName: stage.icon)
                            .font(.system(size: 48, weight: .medium))
                            .foregroundColor(AppColors.primary)
                            .scaleEffect(isPulsing ? 1.12 : 1.0)
                            .opacity(isPulsing ? 1.0 : 0.6)
                            .animation(
                                stage != .done
                                    ? .easeInOut(duration: 0.8).repeatForever(autoreverses: true)
                                    : .default,
                                value: isPulsing
                            )
                    }
                    .onAppear { isPulsing = true }
                    .onChange(of: stage) { newStage in
                        isPulsing = newStage != .done
                    }

                    // Stage label
                    VStack(spacing: 8) {
                        Text(stage.label)
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(AppColors.textPrimary)

                        if totalFrames > 0 {
                            Text("\(processedFrames) of \(totalFrames) frames")
                                .font(.subheadline)
                                .foregroundColor(AppColors.textMuted)
                        }
                    }

                    // Progress pipeline
                    HStack(spacing: 12) {
                        ForEach(Stage.allCases.dropLast(), id: \.rawValue) { s in
                            HStack(spacing: 4) {
                                Circle()
                                    .fill(s.rawValue <= stage.rawValue
                                          ? AppColors.primary
                                          : AppColors.border)
                                    .frame(width: 8, height: 8)
                                if s != .analysing {
                                    Rectangle()
                                        .fill(s.rawValue < stage.rawValue
                                              ? AppColors.primary
                                              : AppColors.border)
                                        .frame(height: 2)
                                        .frame(maxWidth: 40)
                                }
                            }
                        }
                    }

                    // Progress bar
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(AppColors.border)
                                .frame(height: 4)
                            Capsule()
                                .fill(AppColors.primary)
                                .frame(width: geo.size.width * progress, height: 4)
                                .animation(.easeInOut(duration: 0.3), value: progress)
                        }
                    }
                    .frame(height: 4)
                    .padding(.horizontal, 48)

                    Spacer()

                    if let err = errorMessage {
                        Text(err)
                            .font(.footnote)
                            .foregroundColor(AppColors.error)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }
                }
            }
            .navigationTitle("Analysing Session")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden(true)
            .navigationDestination(isPresented: $navigateToPlayback) {
                PlaybackView(sessionId: sessionId)
                    .environmentObject(sessionVM)
            }
            .onAppear { runPipeline() }
        }
    }

    // MARK: - Pipeline

    private func runPipeline() {
        Task {
            guard let localVideoURI = sessionVM.currentSession?.localVideoUrl,
                  let videoURL = URL(string: localVideoURI) else {
                errorMessage = "No video available to analyse."
                return
            }

            // Stage 1 — extract frames
            stage    = .extracting
            progress = 0
            let extractor = FrameExtractionService()
            var extractedFrames: [ExtractedFrame]
            do {
                extractedFrames = try await extractor.extract(from: videoURL) { done, total in
                    Task { @MainActor in
                        totalFrames     = total
                        processedFrames = done
                        progress        = Double(done) / Double(total)
                    }
                }
            } catch {
                errorMessage = "Frame extraction failed: \(error.localizedDescription)"
                return
            }
            totalFrames = extractedFrames.count

            // Stage 2 — pose already done inside FrameExtractionService
            // (pose is run per-frame inside extract). We animate this stage quickly.
            stage    = .posing
            progress = 1.0
            try? await Task.sleep(nanoseconds: 400_000_000)

            // Stage 3 — upload frames to backend (AI analysis)
            stage    = .analysing
            progress = 0
            processedFrames = 0

            for (i, extracted) in extractedFrames.enumerated() {
                // Build AnalyzedFrame stub
                let frameId  = "\(sessionId)_frame_\(i)"
                let stub     = AnalyzedFrame(
                    id:            frameId,
                    sessionId:     sessionId,
                    frameIndex:    extracted.index,
                    timestamp:     extracted.timestamp,
                    imageUrl:      nil,
                    poseKeypoints: extracted.keypoints,
                    coaching:      nil,
                    overlays:      [],
                    createdAt:     Date()
                )
                sessionVM.addFrame(stub)

                // Compress image and upload
                if let base64 = ImageCompressor.compress(extracted.image) {
                    let req = UploadFrameRequest(
                        frameIndex:    extracted.index,
                        timestamp:     extracted.timestamp,
                        imageBase64:   base64,
                        poseKeypoints: extracted.keypoints,
                        context:       FrameContext(
                            focusArea:   sessionVM.currentSession?.focusArea.rawValue ?? "overall",
                            skillLevel:  sessionVM.currentSession?.skillLevel.rawValue ?? "intermediate",
                            totalFrames: extractedFrames.count
                        )
                    )

                    do {
                        let response = try await APIService.shared.uploadFrame(req, sessionId: sessionId)
                        sessionVM.updateFrameCoaching(
                            frameId:  frameId,
                            coaching: response.analysisResult,
                            overlays: response.overlays
                        )
                    } catch {
                        // Queue offline, keep going
                        OfflineQueueService.shared.enqueue(sessionId: sessionId, request: req)
                    }
                }

                processedFrames = i + 1
                progress = Double(i + 1) / Double(extractedFrames.count)
            }

            stage            = .done
            progress         = 1.0
            try? await Task.sleep(nanoseconds: 600_000_000)
            navigateToPlayback = true
        }
    }
}
