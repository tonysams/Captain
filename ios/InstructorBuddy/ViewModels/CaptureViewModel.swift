import Foundation
import AVFoundation
import SwiftUI
import Combine

// MARK: - CaptureViewModel
// Manages AVCaptureSession lifecycle and recording.

@MainActor
final class CaptureViewModel: ObservableObject {

    // MARK: - Published state

    @Published var isSessionRunning: Bool = false
    @Published var isRecording: Bool = false
    @Published var recordingDuration: Double = 0
    @Published var errorMessage: String?
    @Published var focusArea: FocusArea = .overall
    @Published var skillLevel: SkillLevel = .intermediate
    @Published var selectedStudentId: String? = nil

    // MARK: - AVFoundation

    let captureSession   = AVCaptureSession()
    private var videoOutput  = AVCaptureMovieFileOutput()
    private var recordingURL: URL?
    private var timer: Timer?

    // MARK: - Setup

    func setupSession() async {
        guard await requestPermissions() else {
            await MainActor.run { errorMessage = "Camera and microphone access are required." }
            return
        }

        captureSession.beginConfiguration()
        captureSession.sessionPreset = .high

        // Video input (back camera)
        if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
           let input = try? AVCaptureDeviceInput(device: device),
           captureSession.canAddInput(input) {
            captureSession.addInput(input)
        }

        // Audio input
        if let mic = AVCaptureDevice.default(for: .audio),
           let audioInput = try? AVCaptureDeviceInput(device: mic),
           captureSession.canAddInput(audioInput) {
            captureSession.addInput(audioInput)
        }

        // Movie file output
        if captureSession.canAddOutput(videoOutput) {
            captureSession.addOutput(videoOutput)
        }

        captureSession.commitConfiguration()

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession.startRunning()
            DispatchQueue.main.async { self?.isSessionRunning = true }
        }
    }

    func stopSession() {
        captureSession.stopRunning()
        isSessionRunning = false
    }

    // MARK: - Recording

    func startRecording() {
        guard !isRecording else { return }
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("session_\(UUID().uuidString).mov")
        recordingURL = url
        videoOutput.startRecording(to: url, recordingDelegate: RecordingDelegate { [weak self] result in
            Task { @MainActor in
                self?.handleRecordingFinished(result: result)
            }
        })
        isRecording = true
        recordingDuration = 0
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.recordingDuration += 0.1 }
        }
    }

    func stopRecording() -> URL? {
        guard isRecording else { return nil }
        videoOutput.stopRecording()
        timer?.invalidate()
        timer = nil
        isRecording = false
        return recordingURL
    }

    var recordedVideoURL: URL? { recordingURL }

    // MARK: - Private

    private func requestPermissions() async -> Bool {
        let video = await AVCaptureDevice.requestAccess(for: .video)
        let audio = await AVCaptureDevice.requestAccess(for: .audio)
        return video && audio
    }

    private func handleRecordingFinished(result: Result<URL, Error>) {
        switch result {
        case .failure(let err):
            errorMessage = "Recording failed: \(err.localizedDescription)"
        case .success:
            break
        }
    }
}

// MARK: - RecordingDelegate (bridges AVCaptureFileOutputRecordingDelegate)

private final class RecordingDelegate: NSObject, AVCaptureFileOutputRecordingDelegate {
    let completion: (Result<URL, Error>) -> Void
    init(completion: @escaping (Result<URL, Error>) -> Void) {
        self.completion = completion
    }
    func fileOutput(
        _ output: AVCaptureFileOutput,
        didFinishRecordingTo url: URL,
        from _: [AVCaptureConnection],
        error: Error?
    ) {
        if let err = error { completion(.failure(err)) }
        else                { completion(.success(url)) }
    }
}
