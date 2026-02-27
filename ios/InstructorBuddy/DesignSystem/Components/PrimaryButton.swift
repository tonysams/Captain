import SwiftUI

// MARK: - PrimaryButton

struct PrimaryButton: View {
    let title: String
    var icon: String? = nil
    var isLoading: Bool = false
    var isDestructive: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                        .scaleEffect(0.85)
                } else if let icon {
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .semibold))
                }
                Text(title)
                    .font(.system(size: 16, weight: .bold))
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(isDestructive ? AppColors.error : AppColors.primary)
            .cornerRadius(14)
        }
        .disabled(isLoading)
        .opacity(isLoading ? 0.7 : 1)
    }
}

// MARK: - SecondaryButton

struct SecondaryButton: View {
    let title: String
    var icon: String? = nil
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon {
                    Image(systemName: icon)
                        .font(.system(size: 15, weight: .semibold))
                }
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
            }
            .foregroundColor(AppColors.textPrimary)
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(AppColors.bgCard)
            .cornerRadius(14)
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(AppColors.border, lineWidth: 1)
            )
        }
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 12) {
        PrimaryButton(title: "New Session", icon: "video.fill") {}
        PrimaryButton(title: "Analysing…", isLoading: true) {}
        SecondaryButton(title: "Export PDF", icon: "doc.fill") {}
    }
    .padding()
    .background(AppColors.bg)
}
