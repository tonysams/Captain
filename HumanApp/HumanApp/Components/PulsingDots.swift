import SwiftUI

/// Three accent-colored dots that pulse in a staggered loop.
/// Mirrors the CSS @keyframes pulse exactly:
///   0%/80%/100% → opacity 0.2, scale 0.8
///   40%         → opacity 1.0, scale 1.0
struct PulsingDots: View {
    @State private var animating = false

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(Color.accent)
                    .frame(width: 8, height: 8)
                    .scaleEffect(animating ? 1.0 : 0.8)
                    .opacity(animating ? 1.0 : 0.2)
                    .animation(
                        .easeInOut(duration: 0.7)
                            .repeatForever(autoreverses: true)
                            .delay(Double(index) * 0.2),
                        value: animating
                    )
            }
        }
        .onAppear  { animating = true  }
        .onDisappear { animating = false }
    }
}
