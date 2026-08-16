import SwiftUI

/// Draws a live analog dial (ticks, optional numerals, sweeping hands) for a given style.
struct AnalogClockView: View {
    let style: WatchFaceStyle

    var body: some View {
        TimelineView(.periodic(from: .now, by: style.showSecondHand ? 1.0 : 5.0)) { timeline in
            Canvas { context, size in
                draw(context: context, size: size, date: timeline.date)
            }
        }
    }

    private func draw(context: GraphicsContext, size: CGSize, date: Date) {
        let comps = Calendar.current.dateComponents([.hour, .minute, .second, .nanosecond], from: date)
        let hour = Double(comps.hour ?? 0)
        let minute = Double(comps.minute ?? 0)
        let second = Double(comps.second ?? 0)
        let nanosecond = Double(comps.nanosecond ?? 0)

        let center = CGPoint(x: size.width / 2, y: size.height / 2)
        let radius = min(size.width, size.height) / 2

        let dialRect = CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2)
        context.fill(Path(ellipseIn: dialRect), with: .color(style.dialColor))

        for tickIndex in 0..<60 {
            let isHour = tickIndex % 5 == 0
            let angle = Angle.degrees(Double(tickIndex) / 60 * 360)
            let tickLength: CGFloat = isHour ? radius * 0.12 : radius * 0.05
            let tickWidth: CGFloat = isHour ? 2.5 : 1
            var path = Path()
            path.move(to: point(center: center, radius: radius * 0.92, angle: angle))
            path.addLine(to: point(center: center, radius: radius * 0.92 - tickLength, angle: angle))
            context.stroke(path, with: .color(style.tickColor), lineWidth: tickWidth)
        }

        if style.showNumerals {
            for hourMark in 1...12 {
                let angle = Angle.degrees(Double(hourMark) / 12 * 360)
                let center2 = point(center: center, radius: radius * 0.74, angle: angle)
                let text = Text(style.numeralStyle.label(for: hourMark))
                    .font(.system(size: radius * 0.19, weight: .semibold, design: .rounded))
                    .foregroundColor(style.numeralColor)
                context.draw(context.resolve(text), at: center2, anchor: .center)
            }
        }

        let hourAngle = Angle.degrees(((hour.truncatingRemainder(dividingBy: 12)) + minute / 60) / 12 * 360)
        let minuteAngle = Angle.degrees((minute + second / 60) / 60 * 360)
        let secondAngle = Angle.degrees((second + nanosecond / 1_000_000_000) / 60 * 360)

        drawHand(context: context, center: center, angle: hourAngle, length: radius * 0.5, width: 4.5, color: style.hourHandColor)
        drawHand(context: context, center: center, angle: minuteAngle, length: radius * 0.72, width: 3, color: style.minuteHandColor)
        if style.showSecondHand {
            drawHand(context: context, center: center, angle: secondAngle, length: radius * 0.82, width: 1.2, color: style.secondHandColor)
        }

        let pin = Path(ellipseIn: CGRect(x: center.x - 3, y: center.y - 3, width: 6, height: 6))
        context.fill(pin, with: .color(style.showSecondHand ? style.secondHandColor : style.hourHandColor))
    }

    private func point(center: CGPoint, radius: CGFloat, angle: Angle) -> CGPoint {
        let radians = angle.radians - .pi / 2
        return CGPoint(x: center.x + radius * cos(radians), y: center.y + radius * sin(radians))
    }

    private func drawHand(context: GraphicsContext, center: CGPoint, angle: Angle, length: CGFloat, width: CGFloat, color: Color) {
        let tip = point(center: center, radius: length, angle: angle)
        let tail = point(center: center, radius: length * 0.15, angle: angle + .degrees(180))
        var path = Path()
        path.move(to: tail)
        path.addLine(to: tip)
        context.stroke(path, with: .color(color), style: StrokeStyle(lineWidth: width, lineCap: .round))
    }
}

/// A small bordered date pill used by several dials (e.g. "MON 16").
struct DateBadge: View {
    var color: Color

    var body: some View {
        TimelineView(.periodic(from: .now, by: 60)) { timeline in
            Text(Self.formatter.string(from: timeline.date).uppercased())
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundColor(color)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(color.opacity(0.6), lineWidth: 1)
                )
        }
    }

    private static let formatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE d"
        return formatter
    }()
}
