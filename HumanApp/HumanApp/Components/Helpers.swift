import SwiftUI

// MARK: — Scale press effect for the primary submit button
struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: — Custom shape with individual corner radii
/// Used for the user chat bubble: top-left/right/bottom-left = 20, bottom-right = 4
struct RoundedCornerShape: Shape {
    var topLeft: CGFloat = 0
    var topRight: CGFloat = 0
    var bottomLeft: CGFloat = 0
    var bottomRight: CGFloat = 0

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let tl = min(topLeft,    rect.width / 2, rect.height / 2)
        let tr = min(topRight,   rect.width / 2, rect.height / 2)
        let bl = min(bottomLeft, rect.width / 2, rect.height / 2)
        let br = min(bottomRight,rect.width / 2, rect.height / 2)

        // Start at top-left, go clockwise
        path.move(to: CGPoint(x: rect.minX + tl, y: rect.minY))

        // Top edge → top-right corner
        path.addLine(to: CGPoint(x: rect.maxX - tr, y: rect.minY))
        path.addArc(
            center: CGPoint(x: rect.maxX - tr, y: rect.minY + tr),
            radius: tr,
            startAngle: .degrees(-90), endAngle: .degrees(0), clockwise: false
        )

        // Right edge → bottom-right corner
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - br))
        path.addArc(
            center: CGPoint(x: rect.maxX - br, y: rect.maxY - br),
            radius: br,
            startAngle: .degrees(0), endAngle: .degrees(90), clockwise: false
        )

        // Bottom edge → bottom-left corner
        path.addLine(to: CGPoint(x: rect.minX + bl, y: rect.maxY))
        path.addArc(
            center: CGPoint(x: rect.minX + bl, y: rect.maxY - bl),
            radius: bl,
            startAngle: .degrees(90), endAngle: .degrees(180), clockwise: false
        )

        // Left edge → top-left corner
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + tl))
        path.addArc(
            center: CGPoint(x: rect.minX + tl, y: rect.minY + tl),
            radius: tl,
            startAngle: .degrees(180), endAngle: .degrees(270), clockwise: false
        )

        path.closeSubpath()
        return path
    }
}
