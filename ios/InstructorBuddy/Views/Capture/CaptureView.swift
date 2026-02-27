import SwiftUI
import AVFoundation

// MARK: - CaptureView
// AVCaptureSession live preview + record button + session config panel.

struct CaptureView: View {

    @StateObject private var captureVM = CaptureViewModel()
    @EnvironmentObject private var sessionVM: SessionViewModel
    @EnvironmentObject private var studentsVM: StudentsViewModel

    @State private var showConfig    = false
    @State private var navigateToAnalysis = false
    @State private var newSessionId: String?

    var body: some View {
        NavigationStack {
            ZStack {
                // ── Camera preview ──
                CameraPreviewView(session: captureVM.captureSession)
                    .ignoresSafeArea()
                    .onAppear {
                        Task { await captureVM.setupSession() }
                        Task { await studentsVM.loadStudents() }
                    }
                    .onDisappear { captureVM.stopSession() }

                // ── UI controls ──
                VStack {
                    // Top bar
                    HStack {
                        Button {
                            showConfig.toggle()
                        } label: {
                            Image(systemName: "slider.horizontal.3")
                                .font(.system(size: 20, weight: .medium))
                                .foregroundColor(.white)
                                .padding(10)
                                .background(Color.black.opacity(0.5))
                                .clipShape(Circle())
                        }
                        Spacer()

                        // Duration indicator
                        if captureVM.isRecording {
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(AppColors.error)
                                    .frame(width: 8, height: 8)
                                Text(durationString)
                                    .font(.system(size: 14, weight: .semibold, design: .monospaced))
                                    .foregroundColor(.white)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.black.opacity(0.6))
                            .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 16)

                    Spacer()

                    // Config summary (focus + level)
                    HStack(spacing: 8) {
                        Label(captureVM.focusArea.label, systemImage: "scope")
                            .font(.caption)
                            .foregroundColor(AppColors.textSecondary)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.black.opacity(0.5))
                            .cornerRadius(10)

                        Label(captureVM.skillLevel.label, systemImage: "chart.bar")
                            .font(.caption)
                            .foregroundColor(AppColors.textSecondary)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.black.opacity(0.5))
                            .cornerRadius(10)
                    }
                    .padding(.bottom, 24)

                    // Record button
                    RecordButton(isRecording: captureVM.isRecording) {
                        handleRecordTap()
                    }
                    .padding(.bottom, 40)
                }

                // Error banner
                if let err = captureVM.errorMessage {
                    VStack {
                        Text(err)
                            .font(.footnote)
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)
                            .padding()
                            .background(AppColors.error)
                            .cornerRadius(12)
                            .padding()
                        Spacer()
                    }
                }
            }
            .sheet(isPresented: $showConfig) {
                SessionConfigSheet(
                    focusArea:  $captureVM.focusArea,
                    skillLevel: $captureVM.skillLevel,
                    studentId:  $captureVM.selectedStudentId,
                    students:   studentsVM.students
                )
                .presentationDetents([.medium])
            }
            .navigationDestination(isPresented: $navigateToAnalysis) {
                if let id = newSessionId {
                    AnalysisView(sessionId: id)
                        .environmentObject(sessionVM)
                }
            }
            .navigationBarHidden(true)
        }
    }

    // MARK: - Record tap

    private func handleRecordTap() {
        if captureVM.isRecording {
            guard let videoURL = captureVM.stopRecording() else { return }
            Task {
                do {
                    let session = try await sessionVM.createSession(
                        focusArea:  captureVM.focusArea,
                        skillLevel: captureVM.skillLevel,
                        studentId:  captureVM.selectedStudentId
                    )
                    // Store local video URL on the session
                    var s = session
                    s.localVideoUrl = videoURL.absoluteString
                    sessionVM.currentSession = s
                    newSessionId = session.id
                    navigateToAnalysis = true
                } catch {
                    captureVM.errorMessage = error.localizedDescription
                }
            }
        } else {
            captureVM.startRecording()
        }
    }

    private var durationString: String {
        let d = Int(captureVM.recordingDuration)
        return String(format: "%02d:%02d", d / 60, d % 60)
    }
}

// MARK: - RecordButton

private struct RecordButton: View {
    let isRecording: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.6), lineWidth: 3)
                    .frame(width: 76, height: 76)
                RoundedRectangle(cornerRadius: isRecording ? 8 : 36)
                    .fill(isRecording ? AppColors.error : AppColors.error)
                    .frame(width: isRecording ? 32 : 60, height: isRecording ? 32 : 60)
                    .animation(.easeInOut(duration: 0.25), value: isRecording)
            }
        }
        .shadow(color: .black.opacity(0.5), radius: 8)
    }
}

// MARK: - CameraPreviewView

struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> PreviewUIView {
        let v = PreviewUIView()
        v.previewLayer.session      = session
        v.previewLayer.videoGravity = .resizeAspectFill
        return v
    }
    func updateUIView(_ uiView: PreviewUIView, context: Context) {}
}

final class PreviewUIView: UIView {
    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
    var previewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
    override func layoutSubviews() {
        super.layoutSubviews()
        previewLayer.frame = bounds
    }
}

// MARK: - SessionConfigSheet

struct SessionConfigSheet: View {
    @Binding var focusArea: FocusArea
    @Binding var skillLevel: SkillLevel
    @Binding var studentId: String?
    let students: [Student]

    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {

                    Group {
                        Text("Focus Area")
                            .font(.caption)
                            .foregroundColor(AppColors.textMuted)
                            .padding(.horizontal, 16)
                        ChipRow(
                            items: FocusArea.allCases,
                            selection: $focusArea,
                            labelFor: \.label
                        )
                    }

                    Group {
                        Text("Skill Level")
                            .font(.caption)
                            .foregroundColor(AppColors.textMuted)
                            .padding(.horizontal, 16)
                        ChipRow(
                            items: SkillLevel.allCases,
                            selection: $skillLevel,
                            labelFor: \.label
                        )
                    }

                    if !students.isEmpty {
                        Group {
                            Text("Student (optional)")
                                .font(.caption)
                                .foregroundColor(AppColors.textMuted)
                                .padding(.horizontal, 16)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ChipToggle(title: "None", isSelected: studentId == nil) {
                                        studentId = nil
                                    }
                                    ForEach(students) { s in
                                        ChipToggle(
                                            title: s.name,
                                            isSelected: studentId == s.id
                                        ) {
                                            studentId = s.id
                                        }
                                    }
                                }
                                .padding(.horizontal, 16)
                            }
                        }
                    }
                }
                .padding(.vertical, 20)
            }
            .background(AppColors.bg.ignoresSafeArea())
            .navigationTitle("Session Setup")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .foregroundColor(AppColors.primary)
                }
            }
        }
    }
}
