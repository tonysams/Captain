import SwiftUI

/// The tan "ORIGINAL" card that shows the dense source text
struct BeforeCard: View {
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Tag row
            HStack(spacing: 6) {
                Circle()
                    .fill(Color(hex: "#C4B8AA"))
                    .frame(width: 8, height: 8)
                Text("ORIGINAL")
                    .font(.interMedium(10))
                    .kerning(2)
                    .foregroundColor(Color(hex: "#9A8C80"))
            }

            Text(text)
                .font(.interRegular(13))
                .foregroundColor(.muted)
                .lineSpacing(9.1)   // 1.7 at 13px
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.beforeCard)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.beforeCardBorder, lineWidth: 1)
        )
    }
}
