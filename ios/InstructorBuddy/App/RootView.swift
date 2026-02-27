import SwiftUI

// MARK: - RootView
// Auth gate: shows OnboardingView until authenticated, then MainTabView.

struct RootView: View {

    @EnvironmentObject private var appVM: AppViewModel

    var body: some View {
        Group {
            if appVM.isAuthenticated && appVM.hasCompletedOnboarding {
                MainTabView()
            } else {
                OnboardingView()
            }
        }
        .animation(.easeInOut(duration: 0.35), value: appVM.isAuthenticated)
    }
}

// MARK: - MainTabView

struct MainTabView: View {

    @StateObject private var sessionVM  = SessionViewModel()
    @StateObject private var studentsVM = StudentsViewModel()
    @EnvironmentObject private var appVM: AppViewModel

    var body: some View {
        TabView {
            DashboardView()
                .environmentObject(sessionVM)
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }

            LibraryView()
                .environmentObject(sessionVM)
                .tabItem {
                    Label("Library", systemImage: "film.stack")
                }

            CaptureView()
                .environmentObject(sessionVM)
                .environmentObject(studentsVM)
                .tabItem {
                    Label("Record", systemImage: "video.circle.fill")
                }

            StudentsView()
                .environmentObject(studentsVM)
                .environmentObject(sessionVM)
                .tabItem {
                    Label("Students", systemImage: "person.2.fill")
                }

            SettingsView()
                .environmentObject(appVM)
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
        .tint(AppColors.primary)
        .onAppear {
            // Style the tab bar
            let appearance = UITabBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor(AppColors.bgCard)
            UITabBar.appearance().standardAppearance  = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}
