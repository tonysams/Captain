import SwiftUI

struct ThinkingView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        ZStack {
            Color.ink.ignoresSafeArea()

            VStack(spacing: 24) {
                // Logo — large, paper-colored
                Text("HUMAN")
                    .font(.loraSemiBold(32))
                    .foregroundColor(.paper)
                    .kerning(9.6)   // 0.3em at 32px

                // Animated dots
                PulsingDots()

                // Thinking phrase
                Text("Reading between your lines\u{2026}")
                    .font(.loraItalic(15))
                    .foregroundColor(.thinkingPhrase)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 240)
                    .lineSpacing(9.6)   // 1.6 at 15px
            }
        }
        // Allow tapping to cancel (back to entry)
        .onTapGesture {
            appState.cancelActiveTask()
            appState.navigate(to: .entry)
        }
    }
}
