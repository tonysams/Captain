import SwiftUI

struct SessionCard: View {

    let session: Session

    var body: some View {
        HStack(spacing: 14) {
            // Status badge
            ZStack {
                Circle()
                    .fill(session.status.color.opacity(0.15))
                    .frame(width: 44, height: 44)
                Circle()
                    .fill(session.status.color)
                    .frame(width: 10, height: 10)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(session.focusArea.label)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(AppColors.textPrimary)
                    Spacer()
                    Text(relativeDate(session.createdAt))
                        .font(.caption)
                        .foregroundColor(AppColors.textMuted)
                }
                HStack(spacing: 6) {
                    Text(session.skillLevel.label)
                        .font(.caption)
                        .foregroundColor(AppColors.textMuted)
                    Text("·")
                        .foregroundColor(AppColors.textMuted)
                    Text("\(session.frameCount) frames")
                        .font(.caption)
                        .foregroundColor(AppColors.textMuted)
                    Spacer()
                    Text(session.status.label)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(session.status.color)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(session.status.color.opacity(0.12))
                        .cornerRadius(6)
                }
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(AppColors.textMuted)
        }
        .padding(14)
        .background(AppColors.bgCard)
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(AppColors.border, lineWidth: 1)
        )
    }

    private func relativeDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}
