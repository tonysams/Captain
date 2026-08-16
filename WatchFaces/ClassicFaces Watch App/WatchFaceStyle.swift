import SwiftUI

/// The numeral treatment used around a dial.
enum NumeralStyle {
    case arabic
    case roman
    case none

    func label(for hour: Int) -> String {
        switch self {
        case .arabic:
            return "\(hour)"
        case .roman:
            return Self.romanNumerals[hour] ?? "\(hour)"
        case .none:
            return ""
        }
    }

    // Classic dial makers render 4 o'clock as "IIII" rather than "IV".
    private static let romanNumerals: [Int: String] = [
        1: "I", 2: "II", 3: "III", 4: "IIII", 5: "V", 6: "VI",
        7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII",
    ]
}

/// Everything an `AnalogClockView` needs to render one classic dial design.
struct WatchFaceStyle {
    let dialColor: Color
    let tickColor: Color
    let numeralColor: Color
    let hourHandColor: Color
    let minuteHandColor: Color
    let secondHandColor: Color
    let showNumerals: Bool
    let numeralStyle: NumeralStyle
    let showSecondHand: Bool
    let accent: Color
}
