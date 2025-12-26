import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var password = ""
    @State private var showingRegister = false
    @State private var showingForgotPassword = false
    @State private var isLoading = false
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    // Logo
                    VStack(spacing: 16) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 50))
                            .foregroundStyle(.linearGradient(
                                colors: [.purple, .pink],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .frame(width: 100, height: 100)
                            .background(Color.purple.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 24))

                        Text("Welcome Back")
                            .font(.largeTitle)
                            .fontWeight(.bold)

                        Text("Sign in to continue to BeautyHQ")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 40)

                    // Form
                    VStack(spacing: 16) {
                        CustomTextField(
                            placeholder: "Email",
                            text: $email,
                            icon: "envelope.fill",
                            keyboardType: .emailAddress,
                            textContentType: .emailAddress,
                            autocapitalization: .never
                        )

                        CustomSecureField(
                            placeholder: "Password",
                            text: $password,
                            icon: "lock.fill"
                        )

                        HStack {
                            Spacer()
                            Button("Forgot password?") {
                                showingForgotPassword = true
                            }
                            .font(.subheadline)
                            .foregroundColor(.purple)
                        }
                    }

                    // Error message
                    if let error = authManager.error {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                    }

                    // Sign In Button
                    Button {
                        Task {
                            isLoading = true
                            await authManager.login(email: email, password: password)
                            isLoading = false
                        }
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Sign In")
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.purple)
                        .foregroundColor(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(email.isEmpty || password.isEmpty || isLoading)

                    // Divider
                    HStack {
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 1)
                        Text("or continue with")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 1)
                    }

                    // Social Login Buttons
                    VStack(spacing: 12) {
                        // Sign in with Apple Button
                        AppleSignInButton(
                            isProcessing: authManager.isAppleSignInProcessing
                        ) {
                            Task {
                                await authManager.signInWithApple()
                            }
                        }

                        // Google Sign In Button (placeholder)
                        SocialLoginButtonFull(
                            icon: "g.circle.fill",
                            title: "Sign in with Google",
                            backgroundColor: Color(.systemGray6),
                            foregroundColor: .primary
                        ) {
                            // TODO: Implement Google Sign In
                        }
                    }

                    Spacer()

                    // Register Link
                    HStack {
                        Text("Don't have an account?")
                            .foregroundColor(.secondary)
                        Button("Sign Up") {
                            showingRegister = true
                        }
                        .fontWeight(.semibold)
                        .foregroundColor(.purple)
                    }
                    .font(.subheadline)
                }
                .padding(.horizontal, 24)
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

// MARK: - Apple Sign In Button
struct AppleSignInButton: View {
    let isProcessing: Bool
    let action: () -> Void
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        Button(action: action) {
            ZStack {
                HStack(spacing: 8) {
                    Image(systemName: "apple.logo")
                        .font(.title3)
                    Text("Sign in with Apple")
                        .fontWeight(.medium)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(colorScheme == .dark ? Color.white : Color.black)
                .foregroundColor(colorScheme == .dark ? Color.black : Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .opacity(isProcessing ? 0.6 : 1.0)

                if isProcessing {
                    ProgressView()
                        .tint(colorScheme == .dark ? .black : .white)
                }
            }
        }
        .disabled(isProcessing)
    }
}

// MARK: - Native Sign in with Apple Button Wrapper
struct NativeAppleSignInButton: View {
    let action: () -> Void
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        SignInWithAppleButton(
            onRequest: { request in
                request.requestedScopes = [.fullName, .email]
            },
            onCompletion: { _ in
                // Handled by AppleSignInManager
            }
        )
        .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
        .frame(height: 50)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .onTapGesture {
            action()
        }
    }
}

// MARK: - Social Login Button (Full Width)
struct SocialLoginButtonFull: View {
    let icon: String
    let title: String
    let backgroundColor: Color
    let foregroundColor: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title3)
                Text(title)
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

// MARK: - Social Login Button (Icon Only) - Kept for backward compatibility
struct SocialLoginButton: View {
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.title2)
                .frame(width: 60, height: 60)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .foregroundColor(.primary)
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthManager.shared)
}
