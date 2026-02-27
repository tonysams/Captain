import SwiftUI

// MARK: - VideoScrubberView
// Frame timeline strip + prev/next controls + overlay type toggles.
// Mirrors the React Native VideoScrubber component.

struct VideoScrubberView: View {

    let frames:         [AnalyzedFrame]
    let selectedIndex:  Int
    let totalDuration:  Double
    @Binding var overlayVisibility: OverlayVisibility
    let onFrameSelect:  (Int) -> Void
    let onOverlayToggle: (OverlayType) -> Void

    var body: some View {
        VStack(spacing: 0) {

            // Overlay toggle chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(OverlayType.allCases, id: \.self) { type in
                        Button {
                            onOverlayToggle(type)
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: type.icon)
                                    .font(.system(size: 11, weight: .medium))
                                Text(type.label)
                                    .font(.system(size: 11, weight: .medium))
                            }
                            .foregroundColor(overlayVisibility[type] ? .white : AppColors.textMuted)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(
                                overlayVisibility[type]
                                ? AppColors.primary.opacity(0.25)
                                : AppColors.bgCard
                            )
                            .cornerRadius(14)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(
                                        overlayVisibility[type] ? AppColors.primary : AppColors.border,
                                        lineWidth: 1
                                    )
                            )
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
            }

            Divider()
                .background(AppColors.border)

            // Frame timeline
            ScrollViewReader { proxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 4) {
                        ForEach(Array(frames.enumerated()), id: \.offset) { i, frame in
                            FrameThumb(
                                frame: frame,
                                isSelected: i == selectedIndex,
                                totalDuration: totalDuration
                            )
                            .id(i)
                            .onTapGesture { onFrameSelect(i) }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                }
                .onChange(of: selectedIndex) { newIdx in
                    withAnimation(.easeInOut(duration: 0.2)) {
                        proxy.scrollTo(newIdx, anchor: .center)
                    }
                }
            }

            Divider()
                .background(AppColors.border)

            // Prev / Next controls
            HStack(spacing: 32) {
                Button {
                    guard selectedIndex > 0 else { return }
                    onFrameSelect(selectedIndex - 1)
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(selectedIndex > 0 ? AppColors.textPrimary : AppColors.textMuted)
                }
                .disabled(selectedIndex == 0)

                Text("\(selectedIndex + 1) / \(frames.count)")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(AppColors.textMuted)

                Button {
                    guard selectedIndex + 1 < frames.count else { return }
                    onFrameSelect(selectedIndex + 1)
                } label: {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(selectedIndex + 1 < frames.count ? AppColors.textPrimary : AppColors.textMuted)
                }
                .disabled(selectedIndex + 1 >= frames.count)
            }
            .padding(.vertical, 12)
        }
        .background(Color(hex: "#0A0F1E")!)
    }
}

// MARK: - FrameThumb

private struct FrameThumb: View {
    let frame: AnalyzedFrame
    let isSelected: Bool
    let totalDuration: Double

    private var hasCoaching: Bool { frame.coaching != nil }

    var body: some View {
        VStack(spacing: 4) {
            // Timestamp bar
            ZStack {
                RoundedRectangle(cornerRadius: 6)
                    .fill(isSelected ? AppColors.primary : AppColors.bgCard)
                    .frame(width: 48, height: 48)
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(isSelected ? AppColors.primary : AppColors.border, lineWidth: 1)
                    )

                if hasCoaching {
                    Image(systemName: "figure.skiing.downhill")
                        .font(.system(size: 18))
                        .foregroundColor(isSelected ? .white : AppColors.primary)
                } else {
                    Image(systemName: "camera")
                        .font(.system(size: 16))
                        .foregroundColor(AppColors.textMuted)
                }
            }

            // Time label
            Text(String(format: "%.1fs", frame.timestamp))
                .font(.system(size: 9, weight: .medium))
                .foregroundColor(isSelected ? AppColors.primary : AppColors.textMuted)
        }
        .scaleEffect(isSelected ? 1.05 : 1)
        .animation(.easeInOut(duration: 0.15), value: isSelected)
    }
}
