import SwiftUI

/// A navy-and-brass marine chronometer, echoing classic ship's clocks.
struct MarinerFace: View {
    private let brass = Color(red: 0.83, green: 0.69, blue: 0.36)

    private var style: WatchFaceStyle {
        WatchFaceStyle(
            dialColor: Color(red: 0.04, green: 0.11, blue: 0.20),
            tickColor: brass,
            numeralColor: brass,
            hourHandColor: .white,
            minuteHandColor: .white,
            secondHandColor: brass,
            showNumerals: false,
            numeralStyle: .none,
            showSecondHand: true,
            accent: brass
        )
    }

    var body: some View {
        ZStack {
            AnalogClockView(style: style)
            VStack {
                Text("MARINER")
                    .font(.system(size: 10, weight: .bold, design: .serif))
                    .tracking(2)
                    .foregroundColor(style.accent)
                    .padding(.top, 28)
                Spacer()
                DateBadge(color: style.accent)
                    .padding(.bottom, 32)
            }
        }
    }
}
