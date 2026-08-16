import SwiftUI

/// A minimalist eggshell dress-watch dial with thin gold hands and no running seconds.
struct DressClassicFace: View {
    private let gold = Color(red: 0.75, green: 0.63, blue: 0.32)
    private let cream = Color(red: 0.96, green: 0.94, blue: 0.88)

    private var style: WatchFaceStyle {
        WatchFaceStyle(
            dialColor: cream,
            tickColor: Color(red: 0.35, green: 0.30, blue: 0.20),
            numeralColor: Color(red: 0.35, green: 0.30, blue: 0.20),
            hourHandColor: gold,
            minuteHandColor: gold,
            secondHandColor: gold,
            showNumerals: false,
            numeralStyle: .none,
            showSecondHand: false,
            accent: gold
        )
    }

    var body: some View {
        ZStack {
            AnalogClockView(style: style)
            VStack {
                Text("CLASSIC")
                    .font(.system(size: 9, weight: .semibold, design: .serif))
                    .tracking(3)
                    .foregroundColor(style.accent)
                    .padding(.top, 30)
                Spacer()
                Text("AUTOMATIC")
                    .font(.system(size: 8, weight: .medium, design: .serif))
                    .tracking(2)
                    .foregroundColor(style.accent.opacity(0.8))
                    .padding(.bottom, 34)
            }
        }
    }
}
