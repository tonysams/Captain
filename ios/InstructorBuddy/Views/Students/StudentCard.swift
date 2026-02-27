import SwiftUI

struct StudentCard: View {
    let student: Student

    var body: some View {
        HStack(spacing: 12) {
            // Avatar
            ZStack {
                Circle()
                    .fill(AppColors.primary.opacity(0.15))
                    .frame(width: 44, height: 44)
                Text(student.name.prefix(1).uppercased())
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(AppColors.primary)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(student.name)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(AppColors.textPrimary)
                HStack(spacing: 6) {
                    Text(student.skillLevel.label)
                        .font(.caption)
                        .foregroundColor(AppColors.textMuted)
                    if student.sessionCount > 0 {
                        Text("·")
                            .foregroundColor(AppColors.textMuted)
                        Text("\(student.sessionCount) session\(student.sessionCount == 1 ? "" : "s")")
                            .font(.caption)
                            .foregroundColor(AppColors.textMuted)
                    }
                }
            }
            Spacer()
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
}
