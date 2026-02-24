import SwiftUI

struct ResponseView: View {
    let result: ClaudeResponse
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(spacing: 0) {
            // ── Fixed header ──────────────────────────────────────
            header

            Divider()
                .background(Color.warmMid)

            // ── Scrollable content ────────────────────────────────
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {

                    // User's query bubble (right-aligned)
                    HStack {
                        Spacer()
                        userBubble
                    }

                    // "What you got" label + Before card
                    aiLabel("WHAT YOU GOT")
                    BeforeCard(text: result.before)

                    // "What it actually means" label + After card
                    aiLabel("WHAT IT ACTUALLY MEANS")
                    AfterCard(text: result.after)

                    // Follow-up chips
                    FollowUpSection(chips: result.chips) { chip in
                        appState.userInput = chip
                        appState.submit()
                    }
                }
                .padding(.horizontal, 28)
                .padding(.top, 24)
                .padding(.bottom, 48)
            }
        }
        .background(Color.paper.ignoresSafeArea())
    }

    // MARK: — Header
    private var header: some View {
        HStack(spacing: 12) {
            Button {
                appState.navigate(to: .entry)
            } label: {
                Image(systemName: "arrow.left")
                    .font(.system(size: 18, weight: .regular))
                    .foregroundColor(.muted)
                    .frame(width: 36, height: 36)
                    .contentShape(Rectangle())
            }

            LogoMark(size: 11)

            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
    }

    // MARK: — User message bubble
    private var userBubble: some View {
        Text(appState.userInput)
            .font(.interRegular(15))
            .foregroundColor(.paper)
            .lineSpacing(7.5)
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .background(Color.ink)
            .clipShape(
                RoundedCornerShape(
                    topLeft: 20, topRight: 20,
                    bottomLeft: 20, bottomRight: 4
                )
            )
            .frame(maxWidth: UIScreen.main.bounds.width * 0.8, alignment: .trailing)
    }

    // MARK: — Section label
    private func aiLabel(_ text: String) -> some View {
        Text(text)
            .font(.interMedium(11))
            .kerning(2.2)
            .foregroundColor(.muted)
    }
}
