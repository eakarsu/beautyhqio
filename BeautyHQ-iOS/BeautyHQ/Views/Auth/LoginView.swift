import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var socialAuth = SocialAuthManager.shared
    @State private var email = ""
    @State private var password = ""
    @State private var showingRegister = false
    @State private var showingForgotPassword = false
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            ZStack {
                // Background gradient
                LinearGradient(
                    colors: [Color.cream, Color.blushPink.opacity(0.3), Color.white],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: Spacing.xl) {
                        // Logo & Welcome
                        VStack(spacing: Spacing.lg) {
                            // App Icon
                            ZStack {
                                Circle()
                                    .fill(LinearGradient.roseGoldGradient)
                                    .frame(width: 100, height: 100)
                                    .shadow(color: .roseGold.opacity(0.4), radius: 20, x: 0, y: 10)

                                Image(systemName: "sparkles")
                                    .font(.system(size: 44, weight: .medium))
                                    .foregroundColor(.white)
                            }

                            VStack(spacing: Spacing.sm) {
                                Text("BeautyHQ")
                                    .font(.system(size: 36, weight: .bold, design: .rounded))
                                    .foregroundStyle(LinearGradient.roseGoldGradient)

                                Text("Welcome back! Sign in to continue")
                                    .font(.appSubheadline)
                                    .foregroundColor(.softGray)
                            }
                        }
                        .padding(.top, 60)

                        // Login Form
                        VStack(spacing: Spacing.lg) {
                            // Email Field
                            VStack(alignment: .leading, spacing: Spacing.xs) {
                                Text("Email")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)

                                HStack(spacing: Spacing.md) {
                                    Image(systemName: "envelope.fill")
                                        .foregroundColor(.roseGold)
                                        .frame(width: 24)

                                    TextField("Enter your email", text: $email)
                                        .keyboardType(.emailAddress)
                                        .textContentType(.emailAddress)
                                        .autocapitalization(.none)
                                        .font(.appBody)
                                }
                                .padding(Spacing.md)
                                .background(Color.cardBackground)
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: CornerRadius.md)
                                        .stroke(Color.blushPink, lineWidth: 1)
                                )
                            }

                            // Password Field
                            VStack(alignment: .leading, spacing: Spacing.xs) {
                                Text("Password")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)

                                HStack(spacing: Spacing.md) {
                                    Image(systemName: "lock.fill")
                                        .foregroundColor(.roseGold)
                                        .frame(width: 24)

                                    SecureField("Enter your password", text: $password)
                                        .textContentType(.password)
                                        .font(.appBody)
                                }
                                .padding(Spacing.md)
                                .background(Color.cardBackground)
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: CornerRadius.md)
                                        .stroke(Color.blushPink, lineWidth: 1)
                                )
                            }

                            // Forgot Password
                            HStack {
                                Spacer()
                                Button("Forgot password?") {
                                    showingForgotPassword = true
                                }
                                .font(.appSubheadline)
                                .foregroundColor(.roseGold)
                            }
                        }
                        .padding(.horizontal, Spacing.lg)

                        // Debug info (shows OAuth progress)
                        if !socialAuth.debugInfo.isEmpty {
                            Text(socialAuth.debugInfo)
                                .font(.appCaption)
                                .foregroundColor(.roseGold)
                                .multilineTextAlignment(.center)
                                .padding(Spacing.md)
                                .background(Color.roseGold.opacity(0.1))
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous))
                                .padding(.horizontal, Spacing.lg)
                        }

                        // Error message
                        if let error = authManager.error ?? socialAuth.error {
                            HStack(spacing: Spacing.sm) {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .foregroundColor(.error)
                                Text(error)
                                    .font(.appCaption)
                                    .foregroundColor(.error)
                            }
                            .padding(Spacing.md)
                            .frame(maxWidth: .infinity)
                            .background(Color.error.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous))
                            .padding(.horizontal, Spacing.lg)
                        }

                        // Sign In Button
                        Button {
                            Task {
                                isLoading = true
                                _ = await authManager.login(email: email, password: password)
                                isLoading = false
                            }
                        } label: {
                            HStack(spacing: Spacing.sm) {
                                if isLoading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text("Sign In")
                                        .font(.appHeadline)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(LinearGradient.roseGoldGradient)
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                            .shadow(color: .roseGold.opacity(0.4), radius: 10, x: 0, y: 5)
                        }
                        .disabled(email.isEmpty || password.isEmpty || isLoading)
                        .opacity(email.isEmpty || password.isEmpty ? 0.6 : 1)
                        .padding(.horizontal, Spacing.lg)

                        // Divider
                        HStack(spacing: Spacing.md) {
                            Rectangle()
                                .fill(Color.blushPink)
                                .frame(height: 1)
                            Text("or continue with")
                                .font(.appCaption)
                                .foregroundColor(.softGray)
                            Rectangle()
                                .fill(Color.blushPink)
                                .frame(height: 1)
                        }
                        .padding(.horizontal, Spacing.lg)

                        // Social Login Buttons
                        HStack(spacing: Spacing.lg) {
                            // Apple
                            SocialLoginButton(
                                icon: "apple.logo",
                                label: "Apple",
                                backgroundColor: .charcoal,
                                foregroundColor: .white
                            ) {
                                Task {
                                    await SocialAuthManager.shared.signInWithApple()
                                }
                            }

                            // Google
                            SocialLoginButton(
                                icon: "g.circle.fill",
                                label: "Google",
                                backgroundColor: .white,
                                foregroundColor: .charcoal,
                                showBorder: true
                            ) {
                                Task {
                                    await SocialAuthManager.shared.signInWithGoogle()
                                }
                            }

                            // Microsoft
                            MicrosoftLoginButton {
                                Task {
                                    await SocialAuthManager.shared.signInWithMicrosoft()
                                }
                            }
                        }
                        .padding(.horizontal, Spacing.lg)

                        Spacer(minLength: Spacing.xxl)

                        // Register Link
                        HStack(spacing: Spacing.xs) {
                            Text("Don't have an account?")
                                .font(.appSubheadline)
                                .foregroundColor(.softGray)
                            Button("Sign Up") {
                                showingRegister = true
                            }
                            .font(.appHeadline)
                            .foregroundColor(.roseGold)
                        }

                        // Demo Accounts Section
                        DemoAccountsSection(
                            onSelectAccount: { demoEmail, demoPassword in
                                email = demoEmail
                                password = demoPassword
                            }
                        )
                        .padding(.horizontal, Spacing.lg)

                        .padding(.bottom, Spacing.xl)
                    }
                }
            }
            .navigationDestination(isPresented: $showingRegister) {
                RegisterView()
            }
            .sheet(isPresented: $showingForgotPassword) {
                ForgotPasswordView()
            }
        }
    }
}

// MARK: - Demo Accounts Section
struct DemoAccountsSection: View {
    let onSelectAccount: (String, String) -> Void

    var body: some View {
        VStack(spacing: Spacing.md) {
            Text("DEMO ACCOUNTS & ROLE ACCESS")
                .font(.appCaption)
                .fontWeight(.semibold)
                .foregroundColor(.softGray)
                .tracking(1)

            VStack(spacing: Spacing.sm) {
                DemoAccountRow(
                    role: "Owner",
                    email: "admin@luxebeauty.com",
                    password: "admin123",
                    description: "Full dashboard with all features",
                    color: .blue
                ) {
                    onSelectAccount("admin@luxebeauty.com", "admin123")
                }

                DemoAccountRow(
                    role: "Manager",
                    email: "jennifer@luxebeauty.com",
                    password: "password123",
                    description: "Same as Owner (minus Billing/Subscription)",
                    color: .purple
                ) {
                    onSelectAccount("jennifer@luxebeauty.com", "password123")
                }

                DemoAccountRow(
                    role: "Receptionist",
                    email: "lisa@luxebeauty.com",
                    password: "password123",
                    description: "Limited dashboard (no Services, Staff, Products)",
                    color: .orange
                ) {
                    onSelectAccount("lisa@luxebeauty.com", "password123")
                }

                DemoAccountRow(
                    role: "Staff",
                    email: "sarah@luxebeauty.com",
                    password: "password123",
                    description: "Staff portal (My Schedule, Clients, Earnings)",
                    color: .green
                ) {
                    onSelectAccount("sarah@luxebeauty.com", "password123")
                }
            }

            Text("Tap any row to auto-fill credentials")
                .font(.appCaption2)
                .foregroundColor(.softGray)
        }
        .padding(Spacing.md)
        .background(Color.screenBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
    }
}

struct DemoAccountRow: View {
    let role: String
    let email: String
    let password: String
    let description: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(role)
                        .font(.appCaption)
                        .fontWeight(.semibold)
                        .foregroundColor(color)

                    Spacer()

                    Text(email)
                        .font(.appCaption2)
                        .foregroundColor(color.opacity(0.8))
                }

                Text(description)
                    .font(.system(size: 10))
                    .foregroundColor(color.opacity(0.7))
            }
            .padding(Spacing.sm)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(color.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Social Login Button
struct SocialLoginButton: View {
    let icon: String
    let label: String
    var backgroundColor: Color = .white
    var foregroundColor: Color = .charcoal
    var showBorder: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: Spacing.xs) {
                Image(systemName: icon)
                    .font(.system(size: 22, weight: .medium))
                    .foregroundColor(foregroundColor)
                    .frame(width: 56, height: 56)
                    .background(backgroundColor)
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: CornerRadius.md)
                            .stroke(showBorder ? Color.blushPink : Color.clear, lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 4)

                Text(label)
                    .font(.appCaption2)
                    .foregroundColor(.softGray)
            }
        }
    }
}

// MARK: - Microsoft Login Button (Custom icon)
struct MicrosoftLoginButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: Spacing.xs) {
                // Microsoft logo (4 colored squares)
                ZStack {
                    RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous)
                        .fill(Color.white)
                        .frame(width: 56, height: 56)
                        .shadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 4)
                        .overlay(
                            RoundedRectangle(cornerRadius: CornerRadius.md)
                                .stroke(Color.blushPink, lineWidth: 1)
                        )

                    // Microsoft squares
                    VStack(spacing: 2) {
                        HStack(spacing: 2) {
                            Rectangle()
                                .fill(Color(hex: "F25022")) // Red
                                .frame(width: 12, height: 12)
                            Rectangle()
                                .fill(Color(hex: "7FBA00")) // Green
                                .frame(width: 12, height: 12)
                        }
                        HStack(spacing: 2) {
                            Rectangle()
                                .fill(Color(hex: "00A4EF")) // Blue
                                .frame(width: 12, height: 12)
                            Rectangle()
                                .fill(Color(hex: "FFB900")) // Yellow
                                .frame(width: 12, height: 12)
                        }
                    }
                }

                Text("Microsoft")
                    .font(.appCaption2)
                    .foregroundColor(.softGray)
            }
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthManager.shared)
}
