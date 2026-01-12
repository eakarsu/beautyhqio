//
//  CalendarAuthManager.swift
//  BeautyHQ
//
//  Handles OAuth authentication flows for Google and Outlook calendars
//

import Foundation
import AuthenticationServices
import SwiftUI

@MainActor
class CalendarAuthManager: NSObject, ObservableObject {
    static let shared = CalendarAuthManager()

    @Published var isLoading = false
    @Published var error: String?

    private var webAuthSession: ASWebAuthenticationSession?

    private override init() {
        super.init()
    }

    // MARK: - Google Calendar OAuth

    func connectGoogleCalendar(staffId: String) async -> Bool {
        isLoading = true
        error = nil

        do {
            // Get auth URL from backend
            let authUrl = try await CalendarService.shared.getGoogleAuthUrl(
                staffId: staffId,
                redirectUrl: nil
            )

            guard let url = URL(string: authUrl) else {
                error = "Invalid auth URL"
                isLoading = false
                return false
            }

            // Use ASWebAuthenticationSession for OAuth
            let success = await startWebAuthSession(url: url, provider: "google")

            isLoading = false
            return success
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            return false
        }
    }

    // MARK: - Outlook Calendar OAuth

    func connectOutlookCalendar(staffId: String) async -> Bool {
        isLoading = true
        error = nil

        do {
            // Get auth URL from backend
            let authUrl = try await CalendarService.shared.getOutlookAuthUrl(
                staffId: staffId,
                redirectUrl: nil
            )

            guard let url = URL(string: authUrl) else {
                error = "Invalid auth URL"
                isLoading = false
                return false
            }

            let success = await startWebAuthSession(url: url, provider: "outlook")

            isLoading = false
            return success
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            return false
        }
    }

    // MARK: - Web Auth Session

    private func startWebAuthSession(url: URL, provider: String) async -> Bool {
        await withCheckedContinuation { continuation in
            // The callback URL scheme should match what's configured in your app
            // For web-based OAuth, we use an ephemeral session
            webAuthSession = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: nil  // Use web callback
            ) { [weak self] callbackURL, error in
                Task { @MainActor in
                    if let error = error {
                        if (error as NSError).code == ASWebAuthenticationSessionError.canceledLogin.rawValue {
                            self?.error = nil // User cancelled - not an error
                        } else {
                            self?.error = error.localizedDescription
                        }
                        continuation.resume(returning: false)
                        return
                    }

                    // If we got here without error, the auth was successful
                    // The backend will have stored the tokens via the callback
                    continuation.resume(returning: true)
                }
            }

            webAuthSession?.presentationContextProvider = self
            webAuthSession?.prefersEphemeralWebBrowserSession = false
            webAuthSession?.start()
        }
    }

    // MARK: - Disconnect

    func disconnectGoogleCalendar(staffId: String) async -> Bool {
        do {
            try await CalendarService.shared.disconnectGoogle(staffId: staffId)
            return true
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func disconnectOutlookCalendar(staffId: String) async -> Bool {
        do {
            try await CalendarService.shared.disconnectOutlook(staffId: staffId)
            return true
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    // MARK: - Client Google Calendar OAuth

    func connectClientGoogleCalendar(clientId: String) async -> Bool {
        isLoading = true
        error = nil

        do {
            // Get auth URL from backend
            let authUrl = try await CalendarService.shared.getClientGoogleAuthUrl(
                clientId: clientId,
                redirectUrl: nil
            )

            guard let url = URL(string: authUrl) else {
                error = "Invalid auth URL"
                isLoading = false
                return false
            }

            // Use ASWebAuthenticationSession for OAuth
            let success = await startWebAuthSession(url: url, provider: "google")

            isLoading = false
            return success
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            return false
        }
    }

    // MARK: - Client Outlook Calendar OAuth

    func connectClientOutlookCalendar(clientId: String) async -> Bool {
        isLoading = true
        error = nil

        do {
            // Get auth URL from backend
            let authUrl = try await CalendarService.shared.getClientOutlookAuthUrl(
                clientId: clientId,
                redirectUrl: nil
            )

            guard let url = URL(string: authUrl) else {
                error = "Invalid auth URL"
                isLoading = false
                return false
            }

            let success = await startWebAuthSession(url: url, provider: "outlook")

            isLoading = false
            return success
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            return false
        }
    }

    // MARK: - Client Disconnect

    func disconnectClientGoogleCalendar(clientId: String) async -> Bool {
        do {
            try await CalendarService.shared.disconnectClientGoogle(clientId: clientId)
            return true
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func disconnectClientOutlookCalendar(clientId: String) async -> Bool {
        do {
            try await CalendarService.shared.disconnectClientOutlook(clientId: clientId)
            return true
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }
}

// MARK: - ASWebAuthenticationPresentationContextProviding

extension CalendarAuthManager: ASWebAuthenticationPresentationContextProviding {
    @MainActor
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first(where: { $0.isKeyWindow }) ?? windowScene.windows.first else {
            fatalError("No window found for presentation")
        }
        return window
    }
}
