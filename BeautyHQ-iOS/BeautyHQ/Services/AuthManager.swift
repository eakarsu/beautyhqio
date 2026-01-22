import Foundation
import SwiftUI
import AuthenticationServices

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var error: String?
    @Published var isAppleSignInProcessing = false

    private let appleSignInManager = AppleSignInManager.shared

    private init() {
        Task {
            await checkAuth()
            setupAppleIDCredentialRevokedObserver()
        }
    }

    // MARK: - Apple ID Credential Observer

    private func setupAppleIDCredentialRevokedObserver() {
        // Listen for Apple ID credential revocation
        NotificationCenter.default.addObserver(
            forName: ASAuthorizationAppleIDProvider.credentialRevokedNotification,
            object: nil,
            queue: nil
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                // User revoked Apple ID credentials, log them out
                await self?.logout()
            }
        }
    }

    // MARK: - Public Methods

    func login(email: String, password: String) async -> Bool {
        isLoading = true
        error = nil

        do {
            let request = LoginRequest(email: email, password: password)
            let response: AuthResponse = try await APIClient.shared.post("/auth/login", body: request)

            await TokenManager.shared.setTokens(token: response.token, refreshToken: response.refreshToken)
            currentUser = response.user
            isAuthenticated = true
            isLoading = false

            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            isLoading = false
            return false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            return false
        }
    }

    func register(name: String, email: String, password: String, businessName: String?, phone: String?) async -> Bool {
        isLoading = true
        error = nil

        do {
            let request = RegisterRequest(
                email: email,
                password: password,
                name: name,
                businessName: businessName,
                phone: phone
            )
            let response: AuthResponse = try await APIClient.shared.post("/auth/register", body: request)

            await TokenManager.shared.setTokens(token: response.token, refreshToken: response.refreshToken)
            currentUser = response.user
            isAuthenticated = true
            isLoading = false

            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            isLoading = false
            return false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            return false
        }
    }

    func logout() async {
        isLoading = true

        // Try to logout on server (ignore errors)
        do {
            let _: EmptyResponse = try await APIClient.shared.post("/auth/logout", body: EmptyBody())
        } catch {
            // Ignore logout errors
        }

        await TokenManager.shared.clearTokens()
        currentUser = nil
        isAuthenticated = false
        isLoading = false
    }

    func checkAuth() async {
        isLoading = true

        guard await TokenManager.shared.getToken() != nil else {
            isLoading = false
            isAuthenticated = false
            return
        }

        do {
            let user: User = try await APIClient.shared.get("/auth/me")
            currentUser = user
            isAuthenticated = true
        } catch {
            await TokenManager.shared.clearTokens()
            isAuthenticated = false
        }

        isLoading = false
    }

    func forgotPassword(email: String) async -> Bool {
        error = nil

        do {
            let _: MessageResponse = try await APIClient.shared.post("/auth/forgot-password", body: ["email": email])
            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            return false
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func deleteAccount() async -> Bool {
        isLoading = true
        error = nil

        do {
            let _: MessageResponse = try await APIClient.shared.delete("/auth/account")

            // Clear all local data after successful deletion
            await TokenManager.shared.clearTokens()
            UserDefaults.standard.removeObject(forKey: "appleUserIdentifier")
            currentUser = nil
            isAuthenticated = false
            isLoading = false

            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            isLoading = false
            return false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            return false
        }
    }

    // MARK: - Apple Sign In

    /// Initiates Sign in with Apple flow
    func signInWithApple() async -> Bool {
        isAppleSignInProcessing = true
        error = nil

        do {
            // Get credentials from Apple
            let credentials = try await appleSignInManager.signIn()

            // Send credentials to backend for authentication
            let request = AppleAuthRequest(
                identityToken: credentials.identityToken,
                authorizationCode: credentials.authorizationCode,
                nonce: credentials.nonce,
                userIdentifier: credentials.userIdentifier,
                email: credentials.email,
                firstName: credentials.firstName,
                lastName: credentials.lastName
            )

            let response: AuthResponse = try await APIClient.shared.post("/auth/apple", body: request)

            await TokenManager.shared.setTokens(token: response.token, refreshToken: response.refreshToken)
            currentUser = response.user
            isAuthenticated = true
            isAppleSignInProcessing = false

            return true
        } catch let appleError as AppleSignInError {
            if case .canceled = appleError {
                // User canceled - not an error to display
                error = nil
            } else {
                error = appleError.errorDescription
            }
            isAppleSignInProcessing = false
            return false
        } catch let apiError as APIError {
            error = apiError.errorDescription
            isAppleSignInProcessing = false
            return false
        } catch {
            self.error = error.localizedDescription
            isAppleSignInProcessing = false
            return false
        }
    }

    /// Checks if the stored Apple ID credential is still valid
    func checkAppleIDCredentialState() async {
        guard let userID = UserDefaults.standard.string(forKey: "appleUserIdentifier") else {
            return
        }

        let state = await appleSignInManager.checkCredentialState(userID: userID)

        switch state {
        case .revoked:
            // Credential was revoked, log out
            await logout()
        case .authorized:
            // Credential is still valid
            break
        case .notFound:
            // Credential not found, might need to re-authenticate
            break
        case .transferred:
            // User was transferred to a different iCloud account
            break
        @unknown default:
            break
        }
    }
}

// MARK: - Helper Types
struct EmptyBody: Codable {}
struct EmptyResponse: Codable {}
struct MessageResponse: Codable {
    let message: String
}
