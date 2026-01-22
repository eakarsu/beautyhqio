import AuthenticationServices
import CryptoKit
import Foundation
import UIKit

/// Manages Sign in with Apple authentication flow
@MainActor
class AppleSignInManager: NSObject, ObservableObject {
    static let shared = AppleSignInManager()

    @Published var isProcessing = false
    @Published var error: String?

    // Store the current nonce for verification
    private var currentNonce: String?

    // Completion handler for the sign-in flow
    private var signInCompletion: ((Result<AppleSignInCredentials, Error>) -> Void)?

    private override init() {
        super.init()
    }

    // MARK: - Public Methods

    /// Initiates the Sign in with Apple flow
    func signIn() async throws -> AppleSignInCredentials {
        isProcessing = true
        error = nil

        return try await withCheckedThrowingContinuation { continuation in
            signInCompletion = { result in
                continuation.resume(with: result)
            }
            performSignIn()
        }
    }

    /// Checks if the user has an existing Apple ID credential
    func checkCredentialState(userID: String) async -> ASAuthorizationAppleIDProvider.CredentialState {
        await withCheckedContinuation { continuation in
            let provider = ASAuthorizationAppleIDProvider()
            provider.getCredentialState(forUserID: userID) { state, _ in
                continuation.resume(returning: state)
            }
        }
    }

    // MARK: - Private Methods

    private func performSignIn() {
        let nonce = generateNonce()
        currentNonce = nonce

        let appleIDProvider = ASAuthorizationAppleIDProvider()
        let request = appleIDProvider.createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = sha256(nonce)

        let authorizationController = ASAuthorizationController(authorizationRequests: [request])
        authorizationController.delegate = self
        authorizationController.presentationContextProvider = self
        authorizationController.performRequests()
    }

    /// Generates a random nonce string for security
    private func generateNonce(length: Int = 32) -> String {
        precondition(length > 0)
        var randomBytes = [UInt8](repeating: 0, count: length)
        let errorCode = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)

        if errorCode != errSecSuccess {
            fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(errorCode)")
        }

        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        let nonce = randomBytes.map { byte in
            charset[Int(byte) % charset.count]
        }

        return String(nonce)
    }

    /// Creates SHA256 hash of the input string
    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        let hashString = hashedData.compactMap {
            String(format: "%02x", $0)
        }.joined()

        return hashString
    }
}

// MARK: - ASAuthorizationControllerDelegate
extension AppleSignInManager: ASAuthorizationControllerDelegate {

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        Task { @MainActor in
            handleAuthorization(authorization)
        }
    }

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        Task { @MainActor in
            handleError(error)
        }
    }

    private func handleAuthorization(_ authorization: ASAuthorization) {
        isProcessing = false

        guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            let error = AppleSignInError.invalidCredential
            self.error = error.localizedDescription
            signInCompletion?(.failure(error))
            signInCompletion = nil
            return
        }

        guard let nonce = currentNonce else {
            let error = AppleSignInError.invalidNonce
            self.error = error.localizedDescription
            signInCompletion?(.failure(error))
            signInCompletion = nil
            return
        }

        guard let identityTokenData = appleIDCredential.identityToken,
              let identityToken = String(data: identityTokenData, encoding: .utf8) else {
            let error = AppleSignInError.missingIdentityToken
            self.error = error.localizedDescription
            signInCompletion?(.failure(error))
            signInCompletion = nil
            return
        }

        guard let authorizationCodeData = appleIDCredential.authorizationCode,
              let authorizationCode = String(data: authorizationCodeData, encoding: .utf8) else {
            let error = AppleSignInError.missingAuthorizationCode
            self.error = error.localizedDescription
            signInCompletion?(.failure(error))
            signInCompletion = nil
            return
        }

        // Extract user info (only available on first sign-in)
        let fullName = appleIDCredential.fullName
        let email = appleIDCredential.email

        let credentials = AppleSignInCredentials(
            userIdentifier: appleIDCredential.user,
            identityToken: identityToken,
            authorizationCode: authorizationCode,
            nonce: nonce,
            email: email,
            firstName: fullName?.givenName,
            lastName: fullName?.familyName
        )

        // Store user identifier for future credential checks
        UserDefaults.standard.set(appleIDCredential.user, forKey: "appleUserIdentifier")

        signInCompletion?(.success(credentials))
        signInCompletion = nil
        currentNonce = nil
    }

    private func handleError(_ error: Error) {
        isProcessing = false

        // Log the actual error for debugging
        print("Apple Sign-In Error: \(error)")
        print("Error domain: \((error as NSError).domain)")
        print("Error code: \((error as NSError).code)")
        print("Error description: \(error.localizedDescription)")

        if let authError = error as? ASAuthorizationError {
            let code = authError.code
            print("ASAuthorizationError code: \(code.rawValue)")

            if code == .canceled {
                // User canceled - not an error
                self.error = nil
                signInCompletion?(.failure(AppleSignInError.canceled))
            } else if code == .failed {
                self.error = "Sign in with Apple failed. Please try again."
                signInCompletion?(.failure(AppleSignInError.failed))
            } else if code == .invalidResponse {
                self.error = "Invalid response from Apple. Please try again."
                signInCompletion?(.failure(AppleSignInError.invalidResponse))
            } else if code == .notHandled {
                self.error = "Sign in request was not handled."
                signInCompletion?(.failure(AppleSignInError.notHandled))
            } else if code == .notInteractive {
                self.error = "Sign in requires user interaction."
                signInCompletion?(.failure(AppleSignInError.notInteractive))
            } else {
                self.error = "Apple Sign-In error (code \(code.rawValue)): \(error.localizedDescription)"
                signInCompletion?(.failure(AppleSignInError.unknown))
            }
        } else {
            self.error = "Sign-In error: \(error.localizedDescription)"
            signInCompletion?(.failure(error))
        }

        signInCompletion = nil
        currentNonce = nil
    }
}

// MARK: - ASAuthorizationControllerPresentationContextProviding
extension AppleSignInManager: ASAuthorizationControllerPresentationContextProviding {

    @MainActor
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        // Find the active window scene - works on both iPhone and iPad
        let scenes = UIApplication.shared.connectedScenes
        let windowScene = scenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
            ?? scenes.first as? UIWindowScene

        if let window = windowScene?.windows.first(where: { $0.isKeyWindow }) ?? windowScene?.windows.first {
            return window
        }

        // Fallback for iPad split view or other configurations
        if let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) ?? UIApplication.shared.windows.first {
            return window
        }

        // Last resort - return a new window instead of crashing
        return UIWindow()
    }
}

// MARK: - Supporting Types

/// Credentials returned from Sign in with Apple
struct AppleSignInCredentials {
    let userIdentifier: String
    let identityToken: String
    let authorizationCode: String
    let nonce: String
    let email: String?
    let firstName: String?
    let lastName: String?

    var fullName: String? {
        guard let firstName = firstName else { return lastName }
        guard let lastName = lastName else { return firstName }
        return "\(firstName) \(lastName)"
    }
}

/// Errors specific to Apple Sign In
enum AppleSignInError: LocalizedError {
    case canceled
    case failed
    case invalidResponse
    case notHandled
    case notInteractive
    case unknown
    case invalidCredential
    case invalidNonce
    case missingIdentityToken
    case missingAuthorizationCode

    var errorDescription: String? {
        switch self {
        case .canceled:
            return "Sign in was canceled."
        case .failed:
            return "Sign in with Apple failed."
        case .invalidResponse:
            return "Invalid response from Apple."
        case .notHandled:
            return "Sign in request was not handled."
        case .notInteractive:
            return "Sign in requires user interaction."
        case .unknown:
            return "An unknown error occurred."
        case .invalidCredential:
            return "Invalid Apple ID credential."
        case .invalidNonce:
            return "Invalid nonce for authentication."
        case .missingIdentityToken:
            return "Missing identity token from Apple."
        case .missingAuthorizationCode:
            return "Missing authorization code from Apple."
        }
    }
}

// MARK: - API Request/Response Types

/// Request to authenticate with Apple on the backend
struct AppleAuthRequest: Codable {
    let identityToken: String
    let authorizationCode: String
    let nonce: String
    let userIdentifier: String
    let email: String?
    let firstName: String?
    let lastName: String?
}
