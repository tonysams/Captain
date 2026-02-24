import SwiftUI

/// White card with terracotta border and gradient top stripe.
/// Uses AttributedAfterText to render **bold** markers in accent color.
struct AfterCard: View {
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Tag row
            HStack(spacing: 6) {
                Circle()
                    .fill(Color.accent)
                    .frame(width: 8, height: 8)
                Text("FOR YOU")
                    .font(.interMedium(10))
                    .kerning(2)
                    .foregroundColor(.accent)
            }

            AttributedAfterText(markdown: text)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.brandWhite)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.accent, lineWidth: 1.5)
        )
        // Gradient top stripe — 3pt, accent → lighter orange
        .overlay(alignment: .top) {
            LinearGradient(
                colors: [Color.accent, Color(hex: "#E8A06A")],
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(height: 3)
            .clipShape(
                RoundedCornerShape(topLeft: 16, topRight: 16, bottomLeft: 0, bottomRight: 0)
            )
        }
    }
}
