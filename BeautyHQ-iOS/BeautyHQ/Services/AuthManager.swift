import Foundation
import SwiftUI

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var error: String?

    private init() {
        Task {
            await checkAuth()
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
}

// MARK: - Helper Types
struct EmptyBody: Codable {}
struct EmptyResponse: Codable {}
struct MessageResponse: Codable {
    let message: String
}
