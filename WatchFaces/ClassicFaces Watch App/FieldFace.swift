import SwiftUI

/// A high-contrast khaki field-watch dial, built for legibility.
struct FieldFace: View {
    private let olive = Color(red: 0.24, green: 0.27, blue: 0.18)
    private let sand = Color(red: 0.79, green: 0.73, blue: 0.56)

    private var style: WatchFaceStyle {
        WatchFaceStyle(
            dialColor: olive,
            tickColor: sand,
            numeralColor: sand,
            hourHandColor: sand,
            minuteHandColor: sand,
            secondHandColor: Color(red: 0.90, green: 0.45, blue: 0.15),
            showNumerals: true,
            numeralStyle: .arabic,
            showSecondHand: true,
            accent: Color(red: 0.90, green: 0.45, blue: 0.15)
        )
    }

    var body: some View {
        ZStack {
            AnalogClockView(style: style)
            VStack {
                Text("FIELD")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .tracking(3)
                    .foregroundColor(sand.opacity(0.85))
                    .padding(.top, 28)
                Spacer()
                DateBadge(color: sand)
                    .padding(.bottom, 32)
            }
        }
    }
}
