import SwiftUI

struct RegisterView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.dismiss) var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var businessName = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @State private var validationError: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("Create Account")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    Text("Start managing your salon today")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // Form
                VStack(spacing: 16) {
                    CustomTextField(
                        placeholder: "Full Name",
                        text: $name,
                        icon: "person.fill",
                        textContentType: .name
                    )

                    CustomTextField(
                        placeholder: "Email",
                        text: $email,
                        icon: "envelope.fill",
                        keyboardType: .emailAddress,
                        textContentType: .emailAddress,
                        autocapitalization: .never
                    )

                    CustomTextField(
                        placeholder: "Phone (Optional)",
                        text: $phone,
                        icon: "phone.fill",
                        keyboardType: .phonePad,
                        textContentType: .telephoneNumber
                    )

                    CustomTextField(
                        placeholder: "Business Name (Optional)",
                        text: $businessName,
                        icon: "building.2.fill"
                    )

                    CustomSecureField(
                        placeholder: "Password",
                        text: $password,
                        icon: "lock.fill"
                    )

                    CustomSecureField(
                        placeholder: "Confirm Password",
                        text: $confirmPassword,
                        icon: "lock.fill"
                    )

                    if password.count > 0 && password.count < 8 {
                        Text("Password must be at least 8 characters")
                            .font(.caption)
                            .foregroundColor(.orange)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }

                // Error message
                if let error = validationError ?? authManager.error {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                }

                // Register Button
                Button {
                    register()
                } label: {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Create Account")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color.purple)
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(!isFormValid || isLoading)

                // Terms
                Text("By creating an account, you agree to our Terms of Service and Privacy Policy")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)

                // Sign In Link
                HStack {
                    Text("Already have an account?")
                        .foregroundColor(.secondary)
                    Button("Sign In") {
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .foregroundColor(.purple)
                }
                .font(.subheadline)
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 20)
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    private var isFormValid: Bool {
        !name.isEmpty &&
        !email.isEmpty &&
        password.count >= 8 &&
        password == confirmPassword
    }

    private func register() {
        validationError = nil

        guard password == confirmPassword else {
            validationError = "Passwords do not match"
            return
        }

        guard password.count >= 8 else {
            validationError = "Password must be at least 8 characters"
            return
        }

        Task {
            isLoading = true
            await authManager.register(
                name: name,
                email: email,
                password: password,
                businessName: businessName.isEmpty ? nil : businessName,
                phone: phone.isEmpty ? nil : phone
            )
            isLoading = false
        }
    }
}

#Preview {
    NavigationStack {
        RegisterView()
            .environmentObject(AuthManager.shared)
    }
}
