//
//  CalendarService.swift
//  BeautyHQ
//
//  Calendar API service for Google and Outlook calendar integration
//

import Foundation

// MARK: - Response Models

struct CalendarProviderStatus: Codable {
    let connected: Bool
    let calendarId: String?
    let tokenExpiry: String?

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        connected = try container.decode(Bool.self, forKey: .connected)
        calendarId = try container.decodeIfPresent(String.self, forKey: .calendarId)
        tokenExpiry = try container.decodeIfPresent(String.self, forKey: .tokenExpiry)
    }

    private enum CodingKeys: String, CodingKey {
        case connected, calendarId, tokenExpiry
    }
}

struct CalendarStatus: Codable {
    let id: String?
    let name: String?
    let email: String?
    let google: CalendarProviderStatus
    let outlook: CalendarProviderStatus
}

struct CalendarAuthResponse: Codable {
    let authUrl: String
}

struct CalendarDisconnectResponse: Codable {
    let success: Bool
}

// MARK: - Calendar Service

actor CalendarService {
    static let shared = CalendarService()

    private init() {}

    // MARK: - Status

    func getCalendarStatus(staffId: String) async throws -> CalendarStatus {
        let queryItems = [URLQueryItem(name: "staffId", value: staffId)]
        return try await APIClient.shared.get("/calendar/status", queryItems: queryItems)
    }

    // MARK: - Google Calendar

    func getGoogleAuthUrl(staffId: String, redirectUrl: String? = nil) async throws -> String {
        var queryItems = [URLQueryItem(name: "staffId", value: staffId)]
        if let redirectUrl = redirectUrl {
            queryItems.append(URLQueryItem(name: "redirect", value: redirectUrl))
        }
        let response: CalendarAuthResponse = try await APIClient.shared.get("/calendar/auth", queryItems: queryItems)
        return response.authUrl
    }

    func disconnectGoogle(staffId: String) async throws {
        let endpoint = "/calendar/status?staffId=\(staffId)&provider=google"
        let _: CalendarDisconnectResponse = try await APIClient.shared.delete(endpoint)
    }

    // MARK: - Outlook Calendar

    func getOutlookAuthUrl(staffId: String, redirectUrl: String? = nil) async throws -> String {
        var queryItems = [URLQueryItem(name: "staffId", value: staffId)]
        if let redirectUrl = redirectUrl {
            queryItems.append(URLQueryItem(name: "redirect", value: redirectUrl))
        }
        let response: CalendarAuthResponse = try await APIClient.shared.get("/calendar/outlook/auth", queryItems: queryItems)
        return response.authUrl
    }

    func disconnectOutlook(staffId: String) async throws {
        let endpoint = "/calendar/status?staffId=\(staffId)&provider=outlook"
        let _: CalendarDisconnectResponse = try await APIClient.shared.delete(endpoint)
    }

    // MARK: - Client Calendar Methods

    func getClientCalendarStatus(clientId: String) async throws -> CalendarStatus {
        let queryItems = [URLQueryItem(name: "clientId", value: clientId)]
        return try await APIClient.shared.get("/calendar/client/status", queryItems: queryItems)
    }

    // MARK: - Client Google Calendar

    func getClientGoogleAuthUrl(clientId: String, redirectUrl: String? = nil) async throws -> String {
        var queryItems = [URLQueryItem(name: "clientId", value: clientId)]
        if let redirectUrl = redirectUrl {
            queryItems.append(URLQueryItem(name: "redirect", value: redirectUrl))
        }
        let response: CalendarAuthResponse = try await APIClient.shared.get("/calendar/client/google/auth", queryItems: queryItems)
        return response.authUrl
    }

    func disconnectClientGoogle(clientId: String) async throws {
        let endpoint = "/calendar/client/status?clientId=\(clientId)&provider=google"
        let _: CalendarDisconnectResponse = try await APIClient.shared.delete(endpoint)
    }

    // MARK: - Client Outlook Calendar

    func getClientOutlookAuthUrl(clientId: String, redirectUrl: String? = nil) async throws -> String {
        var queryItems = [URLQueryItem(name: "clientId", value: clientId)]
        if let redirectUrl = redirectUrl {
            queryItems.append(URLQueryItem(name: "redirect", value: redirectUrl))
        }
        let response: CalendarAuthResponse = try await APIClient.shared.get("/calendar/client/outlook/auth", queryItems: queryItems)
        return response.authUrl
    }

    func disconnectClientOutlook(clientId: String) async throws {
        let endpoint = "/calendar/client/status?clientId=\(clientId)&provider=outlook"
        let _: CalendarDisconnectResponse = try await APIClient.shared.delete(endpoint)
    }
}
