import SwiftUI

/// A racing chronograph dial in the spirit of classic yacht-club regatta timers.
struct RegattaFace: View {
    private let raceRed = Color(red: 0.80, green: 0.16, blue: 0.16)
    private let raceBlue = Color(red: 0.11, green: 0.28, blue: 0.55)

    private var style: WatchFaceStyle {
        WatchFaceStyle(
            dialColor: raceBlue,
            tickColor: .white,
            numeralColor: .white,
            hourHandColor: .white,
            minuteHandColor: .white,
            secondHandColor: Color(red: 1.0, green: 0.76, blue: 0.15),
            showNumerals: true,
            numeralStyle: .arabic,
            showSecondHand: true,
            accent: raceRed
        )
    }

    var body: some View {
        ZStack {
            AnalogClockView(style: style)
            VStack {
                Image(systemName: "flag.checkered")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(style.accent)
                    .padding(.top, 26)
                Spacer()
                Text("REGATTA")
                    .font(.system(size: 10, weight: .heavy, design: .rounded))
                    .tracking(2)
                    .foregroundColor(.white.opacity(0.85))
                    .padding(.bottom, 32)
            }
        }
    }
}
