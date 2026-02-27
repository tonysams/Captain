import SwiftUI

// MARK: - ChipToggle
// A selectable pill button for choosing focus area, skill level, etc.

struct ChipToggle: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: isSelected ? .bold : .medium))
                .foregroundColor(isSelected ? .white : AppColors.textSecondary)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(
                    isSelected
                        ? AppColors.primary
                        : AppColors.bgCard
                )
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(
                            isSelected ? AppColors.primary : AppColors.border,
                            lineWidth: 1
                        )
                )
        }
        .animation(.easeInOut(duration: 0.15), value: isSelected)
    }
}

// MARK: - ChipRow
// Horizontally scrolling row of chips for a given enum type.

struct ChipRow<T: CaseIterable & Hashable>: View where T.AllCases: RandomAccessCollection {
    let items: [T]
    @Binding var selection: T
    let labelFor: (T) -> String

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(items, id: \.self) { item in
                    ChipToggle(
                        title: labelFor(item),
                        isSelected: selection == item
                    ) {
                        selection = item
                    }
                }
            }
            .padding(.horizontal, 16)
        }
    }
}

// MARK: - Preview

#Preview {
    VStack(alignment: .leading, spacing: 16) {
        Text("Focus Area")
            .font(.caption)
            .foregroundColor(AppColors.textMuted)
            .padding(.horizontal, 16)

        ChipRow(
            items: FocusArea.allCases,
            selection: .constant(.edging),
            labelFor: \.label
        )

        Text("Skill Level")
            .font(.caption)
            .foregroundColor(AppColors.textMuted)
            .padding(.horizontal, 16)

        ChipRow(
            items: SkillLevel.allCases,
            selection: .constant(.intermediate),
            labelFor: \.label
        )
    }
    .padding(.vertical)
    .background(AppColors.bg)
}
