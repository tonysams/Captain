import Foundation
import SwiftUI

// MARK: - OverlayType

enum OverlayType: String, Codable, CaseIterable {
    case angle  = "angle"
    case line   = "line"
    case arrow  = "arrow"
    case circle = "circle"
    case text   = "text"

    var label: String {
        switch self {
        case .angle:  return "Angles"
        case .line:   return "Lines"
        case .arrow:  return "Arrows"
        case .circle: return "Circles"
        case .text:   return "Labels"
        }
    }

    var icon: String {
        switch self {
        case .angle:  return "angle"
        case .line:   return "line.diagonal"
        case .arrow:  return "arrow.up.right"
        case .circle: return "circle"
        case .text:   return "textformat"
        }
    }
}

// MARK: - OverlayVisibility

struct OverlayVisibility {
    var angle:  Bool = true
    var line:   Bool = true
    var arrow:  Bool = true
    var circle: Bool = true
    var text:   Bool = true

    subscript(type: OverlayType) -> Bool {
        get {
            switch type {
            case .angle:  return angle
            case .line:   return line
            case .arrow:  return arrow
            case .circle: return circle
            case .text:   return text
            }
        }
        set {
            switch type {
            case .angle:  angle  = newValue
            case .line:   line   = newValue
            case .arrow:  arrow  = newValue
            case .circle: circle = newValue
            case .text:   text   = newValue
            }
        }
    }
}

// MARK: - Overlay

/// A single drawing primitive returned by the Claude API and stored in `analysis_results`.
struct Overlay: Codable, Identifiable {
    let id: String
    let type: OverlayType
    let color: String            // hex e.g. "#E53E3E"
    let label: String?
    let landmarks: [Int]         // 1-3 MediaPipe keypoint IDs

    // angle  → landmarks[0]=A, [1]=MID, [2]=B
    // line   → landmarks[0]=start, [1]=end
    // arrow  → landmarks[0]=tail, [1]=head
    // circle → landmarks[0]=centre
    // text   → landmarks[0]=anchor point

    // Optional extra geometry
    let value: Double?           // angle overlay: pre-computed degree value
    let dashPattern: [Double]?   // line: [on, off] dash lengths (nil = solid)
    let radius: Double?          // circle: normalised radius (default 0.03)

    enum CodingKeys: String, CodingKey {
        case id, type, color, label, landmarks, value
        case dashPattern = "dash_pattern"
        case radius
    }
}

// MARK: - Colour helper

extension Overlay {
    /// Parse the hex colour string into a SwiftUI Color.
    var swiftUIColor: Color {
        Color(hex: color) ?? .white
    }
}
