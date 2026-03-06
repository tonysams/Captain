import SwiftUI
import Foundation

// MARK: - Color+Hex

extension Color {
    init?(hex: String) {
        var hexClean = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexClean = hexClean.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        guard Scanner(string: hexClean).scanHexInt64(&rgb) else { return nil }

        let r, g, b, a: Double
        switch hexClean.count {
        case 6: // RGB
            r = Double((rgb & 0xFF0000) >> 16) / 255.0
            g = Double((rgb & 0x00FF00) >> 8)  / 255.0
            b = Double((rgb & 0x0000FF))        / 255.0
            a = 1.0
        case 8: // RGBA
            r = Double((rgb & 0xFF000000) >> 24) / 255.0
            g = Double((rgb & 0x00FF0000) >> 16) / 255.0
            b = Double((rgb & 0x0000FF00) >> 8)  / 255.0
            a = Double((rgb & 0x000000FF))        / 255.0
        default:
            return nil
        }

        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}

// MARK: - App colour palette
// Mirrors /mobile/constants/colors.ts exactly so UI looks identical.

enum AppColors {
    // Backgrounds
    static var bg:        Color { Color(hex: "#0A0F1E")! }   // main dark navy
    static var bgCard:    Color { Color(hex: "#111827")! }   // card surface
    static var bgOverlay: Color { Color(hex: "#1F2937")! }   // modal / sheet

    // Text
    static var textPrimary:   Color { Color(hex: "#F9FAFB")! }
    static var textSecondary: Color { Color(hex: "#D1D5DB")! }
    static var textMuted:     Color { Color(hex: "#6B7280")! }

    // Brand
    static var primary:    Color { Color(hex: "#4A9EFF")! }
    static var primaryDim: Color { Color(hex: "#4A9EFF")!.opacity(0.15) }

    // Borders / separators
    static var border: Color { Color(hex: "#1F2937")! }

    // Status colours
    static var success: Color { Color(hex: "#10B981")! }
    static var warning: Color { Color(hex: "#F59E0B")! }
    static var error:   Color { Color(hex: "#EF4444")! }

    // Overlay accent colours (matching the 5 overlay types)
    static var overlayRed:    Color { Color(hex: "#E53E3E")! }
    static var overlayGreen:  Color { Color(hex: "#38A169")! }
    static var overlayYellow: Color { Color(hex: "#D69E2E")! }
    static var overlayBlue:   Color { Color(hex: "#4A9EFF")! }
    static var overlayPurple: Color { Color(hex: "#805AD5")! }
}

// MARK: - Session status colours

extension SessionStatus {
    var color: Color {
        switch self {
        case .recording:  return AppColors.error
        case .processing: return AppColors.warning
        case .completed:  return AppColors.success
        case .failed:     return AppColors.textMuted
        }
    }
    var label: String {
        switch self {
        case .recording:  return "Recording"
        case .processing: return "Analysing"
        case .completed:  return "Complete"
        case .failed:     return "Failed"
        }
    }
}
