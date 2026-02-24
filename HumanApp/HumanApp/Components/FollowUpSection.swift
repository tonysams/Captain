import SwiftUI

/// Peach-background section with italic question and wrapping pill chips
struct FollowUpSection: View {
    let chips: [String]
    let onChipTapped: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Where do you want to go from here?")
                .font(.loraItalic(15))
                .foregroundColor(.ink)
                .lineSpacing(7.5)
                .fixedSize(horizontal: false, vertical: true)

            FlowLayout(spacing: 8) {
                ForEach(chips, id: \.self) { chip in
                    ChipButton(label: chip) {
                        onChipTapped(chip)
                    }
                }
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.accentLight)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: — Individual chip button
struct ChipButton: View {
    let label: String
    let action: () -> Void
    @State private var pressed = false

    var body: some View {
        Button {
            // Flash on tap
            withAnimation(.easeInOut(duration: 0.15)) { pressed = true }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                withAnimation(.easeInOut(duration: 0.15)) { pressed = false }
            }
            action()
        } label: {
            Text(label)
                .font(.interRegular(13))
                .foregroundColor(pressed ? .brandWhite : .ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(pressed ? Color.accent : Color.brandWhite)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(pressed ? Color.accent : Color.warmMid, lineWidth: 1)
                )
        }
        .buttonStyle(PlainButtonStyle())
        .animation(.easeInOut(duration: 0.2), value: pressed)
    }
}

// MARK: — Wrapping flow layout (iOS 16+)
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var height: CGFloat = 0
        var x: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > width, x > 0 {
                height += rowHeight + spacing
                x = 0
                rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        height += rowHeight
        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                y += rowHeight + spacing
                x = bounds.minX
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
