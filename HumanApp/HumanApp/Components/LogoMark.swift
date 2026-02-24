import SwiftUI

/// The HUMAN wordmark — "HUM" + accent "A" + "N"
/// Works at any size: 11pt (header), 13pt (entry), 32pt (thinking screen)
struct LogoMark: View {
    var size: CGFloat = 13
    var style: Style = .light   // .light = on paper bg, .dark = on ink bg

    enum Style { case light, dark }

    private var primaryColor: Color {
        style == .light ? .muted : .paper
    }

    var body: some View {
        (
            Text("HUM")
                .foregroundColor(primaryColor)
            + Text("A")
                .foregroundColor(.accent)
            + Text("N")
                .foregroundColor(primaryColor)
        )
        .font(.loraRegular(size))
        .kerning(size * 0.35)     // 0.35em letter-spacing
        .textCase(.uppercase)
    }
}
