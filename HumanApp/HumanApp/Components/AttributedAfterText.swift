import SwiftUI

/// Parses Claude's **bold** markers into accent-colored Lora SemiBold runs.
/// Odd-indexed segments (between ** pairs) are rendered bold + accent.
struct AttributedAfterText: View {
    let markdown: String

    private var attributed: AttributedString {
        var result = AttributedString()
        let parts = markdown.components(separatedBy: "**")

        for (index, part) in parts.enumerated() {
            guard !part.isEmpty else { continue }
            var segment = AttributedString(part)

            if index % 2 == 1 {
                // Bold + accent
                segment.font = Font.loraSemiBold(16)
                segment.foregroundColor = Color.accent
            } else {
                // Normal Lora
                segment.font = Font.loraRegular(16)
                segment.foregroundColor = Color.ink
            }

            result.append(segment)
        }
        return result
    }

    var body: some View {
        Text(attributed)
            .lineSpacing(11.2)   // 1.75 × 16px = 28pt leading, minus base = ~11pt
            .fixedSize(horizontal: false, vertical: true)
    }
}
