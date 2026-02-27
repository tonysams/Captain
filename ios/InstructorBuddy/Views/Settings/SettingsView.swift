import SwiftUI

struct SettingsView: View {

    @EnvironmentObject private var appVM: AppViewModel
    @State private var analytics: CostAnalytics?
    @State private var isLoading = false
    @State private var psiaLevel = PSIALevel.level3

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {

                    // Guest mode banner
                    if appVM.isGuestMode {
                        HStack(spacing: 10) {
                            Image(systemName: "person.crop.circle.badge.questionmark")
                                .font(.system(size: 20))
                                .foregroundColor(AppColors.warning)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Guest Mode")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(AppColors.textPrimary)
                                Text("Session data is stored locally only. Sign in to sync and access AI coaching.")
                                    .font(.caption)
                                    .foregroundColor(AppColors.textMuted)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .padding(14)
                        .background(AppColors.warning.opacity(0.1))
                        .cornerRadius(14)
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(AppColors.warning.opacity(0.3), lineWidth: 1))
                        .padding(.horizontal, 20)
                    }

                    // Profile card
                    VStack(alignment: .leading, spacing: 12) {
                        Text("INSTRUCTOR")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(AppColors.textMuted)
                            .tracking(1.5)

                        HStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(AppColors.primary.opacity(0.15))
                                    .frame(width: 52, height: 52)
                                Image(systemName: "person.fill")
                                    .font(.system(size: 22))
                                    .foregroundColor(AppColors.primary)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(appVM.isGuestMode ? "Guest" : (appVM.currentUser?.email ?? "—"))
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(AppColors.textPrimary)
                                Text(appVM.isGuestMode ? "Not signed in" : "Instructor")
                                    .font(.caption)
                                    .foregroundColor(AppColors.textMuted)
                            }
                        }
                        .padding(14)
                        .background(AppColors.bgCard)
                        .cornerRadius(14)
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(AppColors.border, lineWidth: 1))
                    }
                    .padding(.horizontal, 20)

                    // PSIA Level
                    VStack(alignment: .leading, spacing: 10) {
                        Text("PSIA CERTIFICATION")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(AppColors.textMuted)
                            .tracking(1.5)

                        ChipRow(
                            items: PSIALevel.allCases,
                            selection: $psiaLevel,
                            labelFor: \.label
                        )
                    }
                    .padding(.horizontal, 20)

                    // 30-day cost dashboard
                    VStack(alignment: .leading, spacing: 12) {
                        Text("AI USAGE (30 DAYS)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(AppColors.textMuted)
                            .tracking(1.5)

                        if isLoading {
                            ProgressView().tint(AppColors.primary)
                                .frame(maxWidth: .infinity)
                        } else if let a = analytics {
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                                CostStatBox(label: "Total Cost", value: String(format: "$%.2f", a.totalCost))
                                CostStatBox(label: "Sessions",   value: "\(a.totalSessions)")
                                CostStatBox(label: "Frames",     value: "\(a.totalFramesAnalyzed)")
                                CostStatBox(label: "Avg / Session", value: String(format: "$%.3f", a.averageCostPerSession))
                            }
                        } else {
                            Text("Unable to load analytics.")
                                .font(.footnote)
                                .foregroundColor(AppColors.textMuted)
                        }
                    }
                    .padding(.horizontal, 20)

                    // Sign out
                    Button(role: .destructive) {
                        appVM.signOut()
                    } label: {
                        Text("Sign Out")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(AppColors.error)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(AppColors.bgCard)
                            .cornerRadius(14)
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(AppColors.border, lineWidth: 1))
                    }
                    .padding(.horizontal, 20)
                }
                .padding(.vertical, 20)
            }
            .background(AppColors.bg.ignoresSafeArea())
            .navigationTitle("Settings")
            .onAppear { loadAnalytics() }
        }
    }

    private func loadAnalytics() {
        isLoading = true
        Task {
            analytics = try? await APIService.shared.getCostAnalytics()
            isLoading = false
        }
    }
}

private struct CostStatBox: View {
    let label: String
    let value: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(AppColors.textPrimary)
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(AppColors.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(AppColors.bgCard)
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppColors.border, lineWidth: 1))
    }
}
