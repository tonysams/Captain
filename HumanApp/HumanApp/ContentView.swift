import SwiftUI

/// Root view — owns the full-screen ZStack that switches between the 3 screens.
/// Using ZStack + enum rather than NavigationStack gives us full control over
/// bi-directional slide-fade transitions.
struct ContentView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        ZStack {
            switch appState.currentScreen {
            case .entry:
                EntryView()
                    .transition(.asymmetric(
                        insertion: .opacity.combined(with: .offset(x: -30)),
                        removal:   .opacity.combined(with: .offset(x:  30))
                    ))
                    .zIndex(1)

            case .thinking:
                ThinkingView()
                    .transition(.opacity)
                    .zIndex(2)

            case .response(let result):
                ResponseView(result: result)
                    .transition(.asymmetric(
                        insertion: .opacity.combined(with: .offset(x:  30)),
                        removal:   .opacity.combined(with: .offset(x: -30))
                    ))
                    .zIndex(1)
            }
        }
        .animation(.easeInOut(duration: 0.45), value: appState.currentScreen)
    }
}
