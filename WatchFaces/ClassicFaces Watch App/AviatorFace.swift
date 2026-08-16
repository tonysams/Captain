import SwiftUI

/// A black pilot's-watch dial with bold luminous numerals and a red seconds hand.
struct AviatorFace: View {
    private var style: WatchFaceStyle {
        WatchFaceStyle(
            dialColor: .black,
            tickColor: .white,
            numeralColor: .white,
            hourHandColor: .white,
            minuteHandColor: .white,
            secondHandColor: .red,
            showNumerals: true,
            numeralStyle: .arabic,
            showSecondHand: true,
            accent: .red
        )
    }

    var body: some View {
        ZStack {
            AnalogClockView(style: style)
            VStack {
                Spacer()
                Text("AVIATOR")
                    .font(.system(size: 10, weight: .bold, design: .default))
                    .tracking(3)
                    .foregroundColor(.white.opacity(0.8))
                    .padding(.bottom, 32)
            }
        }
    }
}
