import SwiftUI

struct ForgotPasswordView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.dismiss) var dismiss

    @State private var email = ""
    @State private var isLoading = false
    @State private var isSuccess = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                if isSuccess {
                    // Success State
                    VStack(spacing: 24) {
                        Image(systemName: "envelope.badge.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.purple)
                            .frame(width: 120, height: 120)
                            .background(Color.purple.opacity(0.1))
                            .clipShape(Circle())

                        Text("Check Your Email")
                            .font(.title)
                            .fontWeight(.bold)

                        Text("We've sent password reset instructions to\n\(email)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)

                        Button("Back to Sign In") {
                            dismiss()
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.purple)
                        .foregroundColor(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                } else {
                    // Form State
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Reset Password")
                            .font(.largeTitle)
                            .fontWeight(.bold)

                        Text("Enter your email and we'll send you instructions to reset your password.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    CustomTextField(
                        placeholder: "Email",
                        text: $email,
                        icon: "envelope.fill",
                        keyboardType: .emailAddress,
                        textContentType: .emailAddress,
                        autocapitalization: .never
                    )

                    if let error = authManager.error {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }

                    Button {
                        Task {
                            isLoading = true
                            let success = await authManager.forgotPassword(email: email)
                            isLoading = false
                            if success {
                                isSuccess = true
                            }
                        }
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Send Reset Link")
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.purple)
                        .foregroundColor(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(email.isEmpty || isLoading)
                }

                Spacer()
            }
            .padding(.horizontal, 24)
            .padding(.top, 40)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .foregroundColor(.primary)
                    }
                }
            }
        }
    }
}

#Preview {
    ForgotPasswordView()
        .environmentObject(AuthManager.shared)
}
