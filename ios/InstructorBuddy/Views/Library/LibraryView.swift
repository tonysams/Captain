import SwiftUI

struct LibraryView: View {

    @EnvironmentObject private var sessionVM: SessionViewModel

    var body: some View {
        NavigationStack {
            Group {
                if sessionVM.isLoading {
                    ProgressView()
                        .tint(AppColors.primary)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if sessionVM.sessions.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "video.slash")
                            .font(.system(size: 48))
                            .foregroundColor(AppColors.textMuted)
                        Text("No recorded sessions")
                            .font(.title3)
                            .foregroundColor(AppColors.textMuted)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 10) {
                            ForEach(sessionVM.sessions) { session in
                                NavigationLink(destination:
                                    PlaybackView(sessionId: session.id)
                                        .environmentObject(sessionVM)
                                ) {
                                    SessionCard(session: session)
                                }
                                .padding(.horizontal, 16)
                            }
                        }
                        .padding(.vertical, 12)
                    }
                }
            }
            .background(AppColors.bg.ignoresSafeArea())
            .navigationTitle("Library")
            .onAppear {
                Task { await sessionVM.loadSessions() }
            }
        }
    }
}
