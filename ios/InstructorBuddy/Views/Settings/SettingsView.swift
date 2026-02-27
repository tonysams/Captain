import SwiftUI

struct SettingsView: View {

    @EnvironmentObject private var appVM: AppViewModel
    @State private var analytics: CostAnalytics?
    @State private var isLoading = false
    @State private var psiaLevel = PSIALevel.level3
    @State private var apiKeyInput: String = ""
    @State private var apiKeySaved = false

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

                    // Anthropic API key
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("ANTHROPIC API KEY")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(AppColors.textMuted)
                                .tracking(1.5)
                            Spacer()
                            if ClaudeService.shared.hasAPIKey {
                                Label("Saved", systemImage: "checkmark.circle.fill")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(AppColors.success)
                            }
                        }

                        HStack(spacing: 10) {
                            SecureField(
                                ClaudeService.shared.hasAPIKey ? "sk-ant-••••••••" : "sk-ant-api03-…",
                                text: $apiKeyInput
                            )
                            .autocapitalization(.none)
                            .autocorrectionDisabled()
                            .padding(.horizontal, 14)
                            .frame(height: 46)
                            .background(AppColors.bgCard)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppColors.border, lineWidth: 1))

                            Button {
                                ClaudeService.shared.apiKey = apiKeyInput.trimmingCharacters(in: .whitespaces)
                                apiKeyInput = ""
                                apiKeySaved = true
                                DispatchQueue.main.asyncAfter(deadline: .now() + 2) { apiKeySaved = false }
                            } label: {
                                Text(apiKeySaved ? "Saved!" : "Save")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 16)
                                    .frame(height: 46)
                                    .background(apiKeySaved ? AppColors.success : AppColors.primary)
                                    .cornerRadius(12)
                            }
                            .disabled(apiKeyInput.trimmingCharacters(in: .whitespaces).isEmpty)
                        }

                        Text("Get your key at console.anthropic.com. Stored securely in the iOS Keychain — never leaves your device.")
                            .font(.caption)
                            .foregroundColor(AppColors.textMuted)
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

                    // Sign out / reset
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
        }
    }
}
