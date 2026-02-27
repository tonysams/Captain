import SwiftUI

@main
struct InstructorBuddyApp: App {

    @StateObject private var appVM = AppViewModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appVM)
                .preferredColorScheme(.dark)    // force dark — our palette is dark-only
        }
    }
}
