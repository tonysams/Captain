import SwiftUI

struct StudentDetailView: View {

    let student: Student
    @EnvironmentObject private var studentsVM: StudentsViewModel
    @EnvironmentObject private var sessionVM: SessionViewModel
    @State private var sessions: [Session] = []
    @State private var isLoadingSessions = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {

                // Profile header
                HStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(AppColors.primary.opacity(0.15))
                            .frame(width: 64, height: 64)
                        Text(student.name.prefix(1).uppercased())
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(AppColors.primary)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text(student.name)
                            .font(.title2).bold()
                            .foregroundColor(AppColors.textPrimary)
                        Text(student.skillLevel.label)
                            .font(.subheadline)
                            .foregroundColor(AppColors.textMuted)
                        if let email = student.email {
                            Text(email)
                                .font(.caption)
                                .foregroundColor(AppColors.textMuted)
                        }
                    }
                }
                .padding(.horizontal, 20)

                // Notes
                if let notes = student.notes, !notes.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("NOTES")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(AppColors.textMuted)
                            .tracking(1.5)
                        Text(notes)
                            .font(.body)
                            .foregroundColor(AppColors.textSecondary)
                    }
                    .padding(.horizontal, 20)
                }

                Divider()
                    .background(AppColors.border)
                    .padding(.horizontal, 20)

                // Session history
                VStack(alignment: .leading, spacing: 12) {
                    Text("SESSION HISTORY")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(AppColors.textMuted)
                        .tracking(1.5)
                        .padding(.horizontal, 20)

                    if isLoadingSessions {
                        ProgressView().tint(AppColors.primary)
                            .frame(maxWidth: .infinity)
                    } else if sessions.isEmpty {
                        Text("No sessions yet.")
                            .font(.subheadline)
                            .foregroundColor(AppColors.textMuted)
                            .padding(.horizontal, 20)
                    } else {
                        ForEach(sessions) { session in
                            NavigationLink(destination:
                                PlaybackView(sessionId: session.id)
                                    .environmentObject(sessionVM)
                            ) {
                                SessionCard(session: session)
                            }
                            .padding(.horizontal, 16)
                        }
                    }
                }
            }
            .padding(.vertical, 20)
        }
        .background(AppColors.bg.ignoresSafeArea())
        .navigationTitle(student.name)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            isLoadingSessions = true
            Task {
                sessions = (try? await studentsVM.sessions(for: student.id)) ?? []
                isLoadingSessions = false
            }
        }
    }
}
