import SwiftUI

struct ReportView: View {

    let sessionId: String
    @EnvironmentObject private var sessionVM: SessionViewModel

    @State private var report: SessionReportResponse?
    @State private var isLoading = true
    @State private var isExporting = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView()
                    .tint(AppColors.primary)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 60)
            } else if let report {
                VStack(alignment: .leading, spacing: 20) {

                    // Header
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Session Report")
                            .font(.system(size: 28, weight: .black))
                            .foregroundColor(AppColors.textPrimary)
                        Text("\(FocusArea(rawValue: report.focusArea)?.label ?? report.focusArea) · \(SkillLevel(rawValue: report.skillLevel)?.label ?? report.skillLevel)")
                            .font(.subheadline)
                            .foregroundColor(AppColors.textSecondary)
                        Text(report.generatedAt, style: .date)
                            .font(.caption)
                            .foregroundColor(AppColors.textMuted)
                    }
                    .padding(.horizontal, 20)

                    // Stats row
                    HStack(spacing: 12) {
                        StatBox(label: "Frames",   value: "\(report.frameCount)")
                        StatBox(label: "Analysed", value: "\(analyzedCount(report))")
                        StatBox(label: "Cues",     value: "\(analyzedCount(report))")
                    }
                    .padding(.horizontal, 16)

                    // Coaching observations
                    VStack(alignment: .leading, spacing: 8) {
                        Text("COACHING OBSERVATIONS")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(AppColors.textMuted)
                            .tracking(1.5)
                            .padding(.horizontal, 20)

                        let analyzed = report.frames.filter { !$0.analysisResults.isEmpty }
                        if analyzed.isEmpty {
                            Text("No analysis results available.")
                                .font(.subheadline)
                                .foregroundColor(AppColors.textMuted)
                                .padding(.horizontal, 20)
                        } else {
                            ForEach(Array(analyzed.enumerated()), id: \.offset) { _, frame in
                                if let a = frame.analysisResults.first {
                                    ObservationCard(frame: frame, analysis: a)
                                        .padding(.horizontal, 16)
                                }
                            }
                        }
                    }

                    // Notes
                    if !report.notes.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("INSTRUCTOR NOTES")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(AppColors.textMuted)
                                .tracking(1.5)
                                .padding(.horizontal, 20)

                            ForEach(report.notes) { note in
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(note.content)
                                        .font(.body)
                                        .foregroundColor(AppColors.textSecondary)
                                    Text(note.createdAt, style: .date)
                                        .font(.caption)
                                        .foregroundColor(AppColors.textMuted)
                                }
                                .padding(14)
                                .background(AppColors.bgCard)
                                .cornerRadius(12)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppColors.border, lineWidth: 1))
                                .padding(.horizontal, 16)
                            }
                        }
                    }

                    // Actions
                    PrimaryButton(title: "Share Link", icon: "link") {
                        shareLink(report.shareUrl)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                    SecondaryButton(
                        title: isExporting ? "Generating PDF…" : "Export PDF",
                        icon:  "doc.fill"
                    ) {
                        exportPDF(report)
                    }
                    .padding(.horizontal, 16)
                    .disabled(isExporting)
                    .opacity(isExporting ? 0.6 : 1)
                }
                .padding(.bottom, 40)
            } else {
                Text(errorMessage ?? "Unable to load report.")
                    .foregroundColor(AppColors.textMuted)
                    .padding()
            }
        }
        .background(AppColors.bg.ignoresSafeArea())
        .navigationTitle("Report")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { loadReport() }
    }

    // MARK: - Load

    private func loadReport() {
        Task {
            isLoading = true
            do {
                report = try await APIService.shared.getReport(sessionId: sessionId)
            } catch {
                // Fallback: build from local frames
                report = buildLocalReport()
                if report == nil { errorMessage = error.localizedDescription }
            }
            isLoading = false
        }
    }

    private func buildLocalReport() -> SessionReportResponse? {
        guard let session = sessionVM.currentSession else { return nil }
        return SessionReportResponse(
            reportId:    sessionId,
            sessionId:   sessionId,
            generatedAt: Date(),
            focusArea:   session.focusArea.rawValue,
            skillLevel:  session.skillLevel.rawValue,
            frameCount:  sessionVM.frames.count,
            frames: sessionVM.frames.map { f in
                ReportFrame(
                    frameIndex: f.frameIndex,
                    timestamp:  f.timestamp,
                    analysisResults: f.coaching.map { c in
                        [ReportFrame.AnalysisResult(
                            primaryObservation: .init(
                                text:       c.primaryObservation.text,
                                confidence: c.primaryObservation.confidence
                            ),
                            cue:       c.cue,
                            createdAt: Date()
                        )]
                    } ?? []
                )
            },
            notes:    [],
            shareUrl: "https://instructorbuddy.app/report/\(sessionId)"
        )
    }

    private func analyzedCount(_ r: SessionReportResponse) -> Int {
        r.frames.filter { !$0.analysisResults.isEmpty }.count
    }

    // MARK: - Actions

    private func shareLink(_ url: String) {
        let av = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.windows.first?.rootViewController?
            .present(av, animated: true)
    }

    private func exportPDF(_ report: SessionReportResponse) {
        isExporting = true
        Task {
            let html    = buildHTMLReport(report)
            let printer = UIPrintInteractionController.shared
            let info    = UIPrintInfo(dictionary: nil)
            info.outputType = .general
            info.jobName    = "Instructor Buddy Report"
            printer.printInfo = info
            printer.printFormatter = UIMarkupTextPrintFormatter(markupText: html)
            await MainActor.run {
                printer.present(animated: true) { _, _, _ in
                    isExporting = false
                }
            }
        }
    }

    private func buildHTMLReport(_ r: SessionReportResponse) -> String {
        let analyzed = r.frames.filter { !$0.analysisResults.isEmpty }
        let rowsHTML = analyzed.map { f -> String in
            guard let a = f.analysisResults.first else { return "" }
            return """
            <div class="card">
              <div class="frame-label">Frame \(f.frameIndex + 1) · \(String(format: "%.1f", f.timestamp))s</div>
              <p>\(a.primaryObservation.text)</p>
              <div class="cue">\(a.cue)</div>
            </div>
            """
        }.joined()

        return """
        <!DOCTYPE html>
        <html>
        <head><style>
          body { font-family: -apple-system, sans-serif; color: #1a1a2e; padding: 32px; }
          h1 { font-size: 28px; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 16px; margin-bottom: 24px; }
          .card { background: #f5f7ff; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
          .cue { background: #e8f0ff; border-left: 4px solid #4A9EFF; padding: 8px 12px;
                 border-radius: 4px; font-weight: bold; margin-top: 8px; }
          .frame-label { font-size: 12px; color: #888; margin-bottom: 6px; }
        </style></head>
        <body>
          <h1>Session Report</h1>
          <p class="subtitle">\(FocusArea(rawValue: r.focusArea)?.label ?? r.focusArea) · \(SkillLevel(rawValue: r.skillLevel)?.label ?? r.skillLevel)</p>
          <p><strong>Frames analysed:</strong> \(analyzed.count) of \(r.frameCount)</p>
          <h2>Coaching Observations</h2>
          \(rowsHTML)
          <p style="color:#aaa;font-size:11px;margin-top:32px">Generated by Instructor Buddy</p>
        </body>
        </html>
        """
    }
}

// MARK: - Sub-views

private struct StatBox: View {
    let label: String
    let value: String
    var body: some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 24, weight: .bold)).foregroundColor(AppColors.textPrimary)
            Text(label).font(.system(size: 11)).foregroundColor(AppColors.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(AppColors.bgCard)
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppColors.border, lineWidth: 1))
    }
}

private struct ObservationCard: View {
    let frame: ReportFrame
    let analysis: ReportFrame.AnalysisResult
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Frame \(frame.frameIndex + 1) · \(String(format: "%.1f", frame.timestamp))s")
                .font(.system(size: 11))
                .foregroundColor(AppColors.textMuted)
            Text(analysis.primaryObservation.text)
                .font(.system(size: 14))
                .foregroundColor(AppColors.textSecondary)
                .lineLimit(4)
            HStack(spacing: 6) {
                Text("CUE")
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(AppColors.primary)
                    .tracking(1.5)
                Text(analysis.cue)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(AppColors.textPrimary)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(AppColors.primary.opacity(0.1))
            .cornerRadius(8)
            // Confidence bar
            GeometryReader { geo in
                Capsule()
                    .fill(confidenceColor(analysis.primaryObservation.confidence))
                    .frame(width: geo.size.width * analysis.primaryObservation.confidence, height: 2)
            }
            .frame(height: 2)
        }
        .padding(14)
        .background(AppColors.bgCard)
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppColors.border, lineWidth: 1))
        .clipped()
    }

    private func confidenceColor(_ c: Double) -> Color {
        c > 0.8 ? AppColors.overlayGreen : c > 0.6 ? AppColors.overlayYellow : AppColors.overlayRed
    }
}
