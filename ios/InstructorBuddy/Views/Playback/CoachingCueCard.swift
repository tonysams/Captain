import SwiftUI

// MARK: - CoachingCueCard
// Slide-up card showing primary observation + cue.
// Mirrors the React Native CoachingCueCard component.

struct CoachingCueCard: View {

    let coaching: CoachingResult
    let visible:  Bool
    let onDismiss: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {

            // Drag handle
            Capsule()
                .fill(AppColors.border)
                .frame(width: 36, height: 4)
                .padding(.top, 10)
                .frame(maxWidth: .infinity)

            // Confidence dot + observation
            HStack(alignment: .top, spacing: 10) {
                Circle()
                    .fill(confidenceColor)
                    .frame(width: 8, height: 8)
                    .padding(.top, 5)

                VStack(alignment: .leading, spacing: 4) {
                    Text(coaching.primaryObservation.text)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(AppColors.textSecondary)
                        .lineLimit(3)
                        .fixedSize(horizontal: false, vertical: true)

                    if let sec = coaching.secondaryObservation {
                        Text(sec.text)
                            .font(.system(size: 12))
                            .foregroundColor(AppColors.textMuted)
                            .lineLimit(2)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)

            // Cue pill
            HStack(spacing: 6) {
                Text("CUE")
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(AppColors.primary)
                    .tracking(1.5)

                Text(coaching.cue)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(AppColors.textPrimary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(AppColors.primary.opacity(0.12))
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(AppColors.primary.opacity(0.3), lineWidth: 1)
            )
            .padding(.horizontal, 16)
            .padding(.top, 12)

            // Dismiss
            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(AppColors.textMuted)
                    .padding(8)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
            .padding(.horizontal, 12)
            .padding(.bottom, 8)
        }
        .background(AppColors.bgCard)
        .cornerRadius(20, corners: [.topLeft, .topRight])
        .shadow(color: .black.opacity(0.4), radius: 16, y: -4)
        .offset(y: visible ? 0 : 200)
        .animation(.spring(response: 0.35, dampingFraction: 0.75), value: visible)
    }

    private var confidenceColor: Color {
        let c = coaching.primaryObservation.confidence
        if c > 0.8 { return AppColors.overlayGreen }
        if c > 0.6 { return AppColors.overlayYellow }
        return AppColors.overlayRed
    }
}

// MARK: - Corner radius helper

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat
    var corners: UIRectCorner
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}
