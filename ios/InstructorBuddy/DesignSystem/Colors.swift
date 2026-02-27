import SwiftUI

// MARK: - App colour palette
// Mirrors /mobile/constants/colors.ts exactly so UI looks identical.

enum AppColors {
    // Backgrounds
    static let bg        = Color(hex: "#0A0F1E")!   // main dark navy
    static let bgCard    = Color(hex: "#111827")!   // card surface
    static let bgOverlay = Color(hex: "#1F2937")!   // modal / sheet

    // Text
    static let textPrimary   = Color(hex: "#F9FAFB")!
    static let textSecondary = Color(hex: "#D1D5DB")!
    static let textMuted     = Color(hex: "#6B7280")!

    // Brand
    static let primary    = Color(hex: "#4A9EFF")!
    static let primaryDim = Color(hex: "#4A9EFF")!.opacity(0.15)

    // Borders / separators
    static let border = Color(hex: "#1F2937")!

    // Status colours
    static let success = Color(hex: "#10B981")!
    static let warning = Color(hex: "#F59E0B")!
    static let error   = Color(hex: "#EF4444")!

    // Overlay accent colours (matching the 5 overlay types)
    static let overlayRed    = Color(hex: "#E53E3E")!
    static let overlayGreen  = Color(hex: "#38A169")!
    static let overlayYellow = Color(hex: "#D69E2E")!
    static let overlayBlue   = Color(hex: "#4A9EFF")!
    static let overlayPurple = Color(hex: "#805AD5")!
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
