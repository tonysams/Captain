import SwiftUI

extension Font {
    // MARK: — Lora (serif) — used for headlines, body copy, pull quotes
    static func loraRegular(_ size: CGFloat) -> Font {
        .custom("Lora-Regular", size: size)
    }
    static func loraItalic(_ size: CGFloat) -> Font {
        .custom("Lora-Italic", size: size)
    }
    static func loraSemiBold(_ size: CGFloat) -> Font {
        .custom("Lora-SemiBold", size: size)
    }

    // MARK: — Inter (sans-serif) — used for UI labels, buttons, secondary text
    static func interLight(_ size: CGFloat) -> Font {
        .custom("Inter-Light", size: size)
    }
    static func interRegular(_ size: CGFloat) -> Font {
        .custom("Inter-Regular", size: size)
    }
    static func interMedium(_ size: CGFloat) -> Font {
        .custom("Inter-Medium", size: size)
    }
}
