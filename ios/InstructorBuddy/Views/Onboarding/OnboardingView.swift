import SwiftUI

// MARK: - OnboardingView
// 3-step pager: Welcome → How It Works → PSIA Level + Sign In / Sign Up.

struct OnboardingView: View {

    @EnvironmentObject private var appVM: AppViewModel

    @State private var page       = 0
    @State private var psiaLevel  = PSIALevel.level3
    @State private var email      = ""
    @State private var password   = ""
    @State private var isSignUp   = false

    var body: some View {
        ZStack {
            AppColors.bg.ignoresSafeArea()

            TabView(selection: $page) {
                // Page 0 — Welcome
                WelcomePage()
                    .tag(0)

                // Page 1 — How it works
                HowItWorksPage()
                    .tag(1)

                // Page 2 — PSIA Level + Auth
                AuthPage(
                    psiaLevel: $psiaLevel,
                    email:     $email,
                    password:  $password,
                    isSignUp:  $isSignUp
                )
                .tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .always))
            .indexViewStyle(.page(backgroundDisplayMode: .always))

            // Bottom CTA (only on last page)
            if page == 2 {
                VStack {
                    Spacer()
                    VStack(spacing: 12) {
                        PrimaryButton(
                            title:     isSignUp ? "Create Account" : "Sign In",
                            isLoading: appVM.isLoading
                        ) {
                            Task {
                                if isSignUp {
                                    await appVM.signUp(email: email, password: password)
                                } else {
                                    await appVM.signIn(email: email, password: password)
                                }
                                if appVM.isAuthenticated {
                                    appVM.completeOnboarding()
                                }
                            }
                        }
                        if let err = appVM.errorMessage {
                            Text(err)
                                .font(.footnote)
                                .foregroundColor(AppColors.error)
                                .multilineTextAlignment(.center)
                        }
                        Button {
                            isSignUp.toggle()
                            appVM.errorMessage = nil
                        } label: {
                            Text(isSignUp ? "Already have an account? Sign In" : "New here? Create Account")
                                .font(.footnote)
                                .foregroundColor(AppColors.primary)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 48)
                }
            }

            // Next arrow (pages 0 & 1)
            if page < 2 {
                VStack {
                    Spacer()
                    Button {
                        withAnimation { page += 1 }
                    } label: {
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.system(size: 52))
                            .foregroundColor(AppColors.primary)
                    }
                    .padding(.bottom, 48)
                }
            }
        }
    }
}

// MARK: - Page views

private struct WelcomePage: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "figure.skiing.downhill")
                .font(.system(size: 80))
                .foregroundColor(AppColors.primary)
            VStack(spacing: 8) {
                Text("Instructor Buddy")
                    .font(.system(size: 34, weight: .black))
                    .foregroundColor(AppColors.textPrimary)
                Text("AI-powered ski coaching\nin your pocket")
                    .font(.title3)
                    .foregroundColor(AppColors.textSecondary)
                    .multilineTextAlignment(.center)
            }
            Spacer()
            Spacer()
        }
        .padding(.horizontal, 32)
    }
}

private struct HowItWorksPage: View {
    let steps: [(String, String, String)] = [
        ("video.fill",           "Record",  "Film your student's run with the in-app camera."),
        ("figure.skiing.downhill", "Analyse", "AI extracts key frames and detects body pose."),
        ("brain",               "Coach",   "Get instant cues and annotated overlays.")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 28) {
            Text("How It Works")
                .font(.system(size: 28, weight: .black))
                .foregroundColor(AppColors.textPrimary)
                .padding(.horizontal, 32)

            ForEach(steps, id: \.0) { icon, title, desc in
                HStack(alignment: .top, spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(AppColors.primary.opacity(0.15))
                            .frame(width: 48, height: 48)
                        Image(systemName: icon)
                            .font(.system(size: 20))
                            .foregroundColor(AppColors.primary)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text(title)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(AppColors.textPrimary)
                        Text(desc)
                            .font(.subheadline)
                            .foregroundColor(AppColors.textSecondary)
                    }
                }
                .padding(.horizontal, 32)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
    }
}

private struct AuthPage: View {
    @Binding var psiaLevel: PSIALevel
    @Binding var email: String
    @Binding var password: String
    @Binding var isSignUp: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Get Started")
                    .font(.system(size: 28, weight: .black))
                    .foregroundColor(AppColors.textPrimary)

                // PSIA level
                VStack(alignment: .leading, spacing: 8) {
                    Text("Your PSIA Level")
                        .font(.caption)
                        .foregroundColor(AppColors.textMuted)
                    ChipRow(items: PSIALevel.allCases, selection: $psiaLevel, labelFor: \.label)
                }

                // Email
                VStack(alignment: .leading, spacing: 6) {
                    Text("Email")
                        .font(.caption)
                        .foregroundColor(AppColors.textMuted)
                    TextField("instructor@example.com", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .padding(.horizontal, 14)
                        .frame(height: 48)
                        .background(AppColors.bgCard)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppColors.border, lineWidth: 1))
                }

                // Password
                VStack(alignment: .leading, spacing: 6) {
                    Text("Password")
                        .font(.caption)
                        .foregroundColor(AppColors.textMuted)
                    SecureField("••••••••", text: $password)
                        .padding(.horizontal, 14)
                        .frame(height: 48)
                        .background(AppColors.bgCard)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppColors.border, lineWidth: 1))
                }

                Spacer(minLength: 120)   // room for bottom CTA
            }
            .padding(32)
        }
    }
}
