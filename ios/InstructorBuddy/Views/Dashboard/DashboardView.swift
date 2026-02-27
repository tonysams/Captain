import SwiftUI

struct DashboardView: View {

    @EnvironmentObject private var sessionVM: SessionViewModel
    @State private var navigateToCapture = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {

                    // Header
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Instructor Buddy")
                            .font(.system(size: 28, weight: .black))
                            .foregroundColor(AppColors.textPrimary)
                        Text("AI-powered ski coaching")
                            .font(.subheadline)
                            .foregroundColor(AppColors.textMuted)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)

                    // New session CTA
                    PrimaryButton(title: "New Session", icon: "video.fill") {
                        navigateToCapture = true
                    }
                    .padding(.horizontal, 20)

                    // Recent sessions
                    if !sessionVM.sessions.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("RECENT SESSIONS")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(AppColors.textMuted)
                                .tracking(1.5)
                                .padding(.horizontal, 20)

                            ForEach(sessionVM.sessions.prefix(3)) { session in
                                NavigationLink(destination:
                                    PlaybackView(sessionId: session.id)
                                        .environmentObject(sessionVM)
                                ) {
                                    SessionCard(session: session)
                                }
                                .padding(.horizontal, 16)
                            }
                        }
                    } else if !sessionVM.isLoading {
                        VStack(spacing: 12) {
                            Image(systemName: "video.slash")
                                .font(.system(size: 36))
                                .foregroundColor(AppColors.textMuted)
                            Text("No sessions yet.\nTap New Session to get started.")
                                .font(.subheadline)
                                .foregroundColor(AppColors.textMuted)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 32)
                    }

                    if sessionVM.isLoading {
                        ProgressView()
                            .tint(AppColors.primary)
                            .frame(maxWidth: .infinity)
                            .padding(.top, 32)
                    }
                }
                .padding(.bottom, 32)
            }
            .background(AppColors.bg.ignoresSafeArea())
            .navigationBarHidden(true)
            .navigationDestination(isPresented: $navigateToCapture) {
                CaptureView()
                    .environmentObject(sessionVM)
                    .environmentObject(StudentsViewModel())
            }
            .onAppear {
                Task { await sessionVM.loadSessions() }
            }
        }
    }
}
