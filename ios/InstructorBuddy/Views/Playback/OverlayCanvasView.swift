import SwiftUI

// MARK: - OverlayCanvasView
// SwiftUI Canvas that renders all 5 overlay types on top of the video frame.
// Keypoints are in normalised coordinates (0…1); Canvas maps them to pixel space.

struct OverlayCanvasView: View {

    let overlays:    [Overlay]
    let keypoints:   [PoseKeypoint]
    let visibility:  OverlayVisibility

    var body: some View {
        Canvas { context, size in
            let kpMap = buildKeypointMap(keypoints, size: size)

            for overlay in overlays where visibility[overlay.type] {
                switch overlay.type {
                case .angle:  drawAngle(&context,  size: size, overlay: overlay, kpMap: kpMap)
                case .line:   drawLine(&context,   size: size, overlay: overlay, kpMap: kpMap)
                case .arrow:  drawArrow(&context,  size: size, overlay: overlay, kpMap: kpMap)
                case .circle: drawCircle(&context, size: size, overlay: overlay, kpMap: kpMap)
                case .text:   drawText(&context,   size: size, overlay: overlay, kpMap: kpMap)
                }
            }
        }
        .allowsHitTesting(false)
    }

    // MARK: - Keypoint map

    private func buildKeypointMap(_ kps: [PoseKeypoint], size: CGSize) -> [Int: CGPoint] {
        var map: [Int: CGPoint] = [:]
        for kp in kps where kp.visibility > 0.2 {
            map[kp.id] = CGPoint(x: kp.x * size.width, y: kp.y * size.height)
        }
        return map
    }

    // MARK: - Angle overlay (arc between 3 landmarks)

    private func drawAngle(
        _ ctx: inout GraphicsContext, size: CGSize,
        overlay: Overlay, kpMap: [Int: CGPoint]
    ) {
        guard overlay.landmarks.count >= 3,
              let ptA   = kpMap[overlay.landmarks[0]],
              let ptMid = kpMap[overlay.landmarks[1]],
              let ptB   = kpMap[overlay.landmarks[2]] else { return }

        let color = overlay.swiftUIColor

        // Draw rays
        var rays = Path()
        rays.move(to: ptMid)
        rays.addLine(to: ptA)
        rays.move(to: ptMid)
        rays.addLine(to: ptB)
        ctx.stroke(rays, with: .color(color), style: StrokeStyle(lineWidth: 2, dash: [5, 3]))

        // Draw arc
        let radius: CGFloat = 30
        let angleA  = atan2(ptA.y - ptMid.y,  ptA.x - ptMid.x)
        let angleB  = atan2(ptB.y - ptMid.y,  ptB.x - ptMid.x)
        var arc = Path()
        arc.addArc(center: ptMid, radius: radius, startAngle: .radians(Double(angleA)),
                   endAngle: .radians(Double(angleB)), clockwise: false)
        ctx.stroke(arc, with: .color(color), lineWidth: 1.5)

        // Degree label
        if let deg = overlay.value {
            drawFloatingLabel(&ctx, at: ptMid, text: String(format: "%.0f°", deg), color: color)
        }
    }

    // MARK: - Line overlay (dashed alignment)

    private func drawLine(
        _ ctx: inout GraphicsContext, size: CGSize,
        overlay: Overlay, kpMap: [Int: CGPoint]
    ) {
        guard overlay.landmarks.count >= 2,
              let ptA = kpMap[overlay.landmarks[0]],
              let ptB = kpMap[overlay.landmarks[1]] else { return }

        let dash: [CGFloat] = overlay.dashPattern?.map { CGFloat($0) } ?? [8, 4]
        var path = Path()
        path.move(to: ptA)
        path.addLine(to: ptB)
        ctx.stroke(path, with: .color(overlay.swiftUIColor),
                   style: StrokeStyle(lineWidth: 2, dash: dash))

        if let label = overlay.label {
            let mid = CGPoint(x: (ptA.x + ptB.x) / 2, y: (ptA.y + ptB.y) / 2)
            drawFloatingLabel(&ctx, at: mid, text: label, color: overlay.swiftUIColor)
        }
    }

    // MARK: - Arrow overlay

    private func drawArrow(
        _ ctx: inout GraphicsContext, size: CGSize,
        overlay: Overlay, kpMap: [Int: CGPoint]
    ) {
        guard overlay.landmarks.count >= 2,
              let tail = kpMap[overlay.landmarks[0]],
              let head = kpMap[overlay.landmarks[1]] else { return }

        let color = overlay.swiftUIColor
        var shaft = Path()
        shaft.move(to: tail)
        shaft.addLine(to: head)
        ctx.stroke(shaft, with: .color(color), lineWidth: 2.5)

        // Arrowhead
        let angle  = atan2(head.y - tail.y, head.x - tail.x)
        let length: CGFloat = 12
        let spread: CGFloat = 0.5
        let p1 = CGPoint(
            x: head.x - length * cos(angle - spread),
            y: head.y - length * sin(angle - spread)
        )
        let p2 = CGPoint(
            x: head.x - length * cos(angle + spread),
            y: head.y - length * sin(angle + spread)
        )
        var arrowhead = Path()
        arrowhead.move(to: head)
        arrowhead.addLine(to: p1)
        arrowhead.move(to: head)
        arrowhead.addLine(to: p2)
        ctx.stroke(arrowhead, with: .color(color), lineWidth: 2.5)

        if let label = overlay.label {
            let mid = CGPoint(x: (tail.x + head.x) / 2, y: (tail.y + head.y) / 2)
            drawFloatingLabel(&ctx, at: mid, text: label, color: color)
        }
    }

    // MARK: - Circle overlay (joint highlight)

    private func drawCircle(
        _ ctx: inout GraphicsContext, size: CGSize,
        overlay: Overlay, kpMap: [Int: CGPoint]
    ) {
        guard let centre = kpMap[overlay.landmarks.first ?? -1] else { return }
        let r: CGFloat  = CGFloat((overlay.radius ?? 0.03) * size.width)
        let color       = overlay.swiftUIColor
        let rect        = CGRect(x: centre.x - r, y: centre.y - r, width: r * 2, height: r * 2)

        ctx.fill(Path(ellipseIn: rect), with: .color(color.opacity(0.25)))
        ctx.stroke(Path(ellipseIn: rect), with: .color(color), lineWidth: 2)
    }

    // MARK: - Text / floating label overlay

    private func drawText(
        _ ctx: inout GraphicsContext, size: CGSize,
        overlay: Overlay, kpMap: [Int: CGPoint]
    ) {
        guard let anchor = kpMap[overlay.landmarks.first ?? -1],
              let label  = overlay.label else { return }
        drawFloatingLabel(&ctx, at: anchor, text: label, color: overlay.swiftUIColor)
    }

    // MARK: - Shared floating label

    private func drawFloatingLabel(
        _ ctx: inout GraphicsContext,
        at point: CGPoint,
        text: String,
        color: Color
    ) {
        let font     = Font.system(size: 12, weight: .semibold)
        let resolved = ctx.resolve(Text(text).font(font).foregroundStyle(color))
        let textSize = resolved.measure(in: CGSize(width: 200, height: 40))
        let padding: CGFloat = 4
        let bgRect = CGRect(
            x: point.x - textSize.width / 2 - padding,
            y: point.y - textSize.height / 2 - padding - 20,
            width:  textSize.width  + padding * 2,
            height: textSize.height + padding * 2
        )
        ctx.fill(Path(roundedRect: bgRect, cornerRadius: 4),
                 with: .color(Color.black.opacity(0.55)))
        ctx.draw(resolved, at: CGPoint(x: point.x, y: point.y - 20), anchor: .center)
    }
}
