import SwiftUI

struct EntryView: View {
    @EnvironmentObject var appState: AppState
    @FocusState private var inputFocused: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {

                // ── Logo ──────────────────────────────────────────
                LogoMark(size: 13)
                    .padding(.top, 72)
                    .padding(.bottom, 48)

                // ── Entry question ────────────────────────────────
                entryQuestion
                    .padding(.bottom, 32)

                // ── Text input ────────────────────────────────────
                inputField
                    .padding(.bottom, 12)

                // ── Hint ──────────────────────────────────────────
                Text("No wrong answers. No judgment.")
                    .font(.loraItalic(12))
                    .foregroundColor(.muted)
                    .frame(maxWidth: .infinity)
                    .padding(.bottom, 32)

                // ── Error message (if any) ─────────────────────────
                if let error = appState.errorMessage {
                    Text(error)
                        .font(.interRegular(13))
                        .foregroundColor(.accent)
                        .frame(maxWidth: .infinity)
                        .padding(.bottom, 16)
                }

                // ── Submit button ─────────────────────────────────
                submitButton

                Spacer(minLength: 40)
            }
            .padding(.horizontal, 36)
        }
        .background(Color.paper.ignoresSafeArea())
        .scrollDismissesKeyboard(.interactively)
    }

    // MARK: — Question headline with italic accent "figure out"
    private var entryQuestion: some View {
        (
            Text("What are you trying to ")
                .font(.loraRegular(28))
                .foregroundColor(.ink)
            + Text("figure out")
                .font(.loraItalic(28))
                .foregroundColor(.accent)
            + Text(" today?")
                .font(.loraRegular(28))
                .foregroundColor(.ink)
        )
        .lineSpacing(11.2)   // ~1.4 line-height
    }

    // MARK: — Multiline text input
    private var inputField: some View {
        ZStack(alignment: .topLeading) {
            // Placeholder text (shown when input is empty)
            if appState.userInput.isEmpty {
                Text("Anything. Really. Start wherever you are.")
                    .font(.loraItalic(16))
                    .foregroundColor(Color(hex: "#BBB3A8"))
                    .padding(.top, 22)
                    .padding(.leading, 22)
                    .allowsHitTesting(false)
            }

            TextEditor(text: $appState.userInput)
                .font(.interRegular(16))
                .foregroundColor(.ink)
                .lineSpacing(8)
                .frame(minHeight: 110)
                .padding(.horizontal, 14)
                .padding(.vertical, 14)
                .focused($inputFocused)
                .scrollContentBackground(.hidden)
                .background(Color.brandWhite)
        }
        .background(Color.brandWhite)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    inputFocused ? Color.accent : Color.warmMid,
                    lineWidth: 1.5
                )
                .animation(.easeInOut(duration: 0.2), value: inputFocused)
        )
    }

    // MARK: — Submit button
    private var submitButton: some View {
        let isEmpty = appState.userInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty

        return Button {
            inputFocused = false
            appState.submit()
        } label: {
            Text("Let's figure it out →")
                .font(.interMedium(15))
                .foregroundColor(.brandWhite)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(isEmpty ? Color.muted : Color.accent)
                .clipShape(Capsule())
        }
        .disabled(isEmpty)
        .buttonStyle(ScaleButtonStyle())
        .animation(.easeInOut(duration: 0.2), value: isEmpty)
    }
}
