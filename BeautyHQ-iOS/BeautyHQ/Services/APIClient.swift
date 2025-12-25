import Foundation

// MARK: - API Error
enum APIError: LocalizedError {
    case invalidURL
    case noData
    case decodingError(Error)
    case networkError(Error)
    case serverError(Int, String?)
    case unauthorized
    case notFound
    case unknown

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .serverError(let code, let message):
            return message ?? "Server error: \(code)"
        case .unauthorized:
            return "Unauthorized. Please log in again."
        case .notFound:
            return "Resource not found"
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

// MARK: - API Response
struct APIResponse<T: Decodable>: Decodable {
    let data: T?
    let error: String?
    let message: String?
}

struct PaginatedResponse<T: Decodable>: Decodable {
    let data: [T]
    let total: Int
    let page: Int
    let pageSize: Int
    let totalPages: Int
}

// MARK: - API Client
actor APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = Config.requestTimeout
        config.timeoutIntervalForResource = Config.resourceTimeout
        self.session = URLSession(configuration: config)

        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase

        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
    }

    // MARK: - Request Methods

    func get<T: Decodable>(_ endpoint: String, queryItems: [URLQueryItem]? = nil) async throws -> T {
        let request = try await buildRequest(endpoint: endpoint, method: "GET", queryItems: queryItems)
        return try await execute(request)
    }

    func post<T: Decodable, B: Encodable>(_ endpoint: String, body: B) async throws -> T {
        var request = try await buildRequest(endpoint: endpoint, method: "POST")
        request.httpBody = try encoder.encode(body)
        return try await execute(request)
    }

    func put<T: Decodable, B: Encodable>(_ endpoint: String, body: B) async throws -> T {
        var request = try await buildRequest(endpoint: endpoint, method: "PUT")
        request.httpBody = try encoder.encode(body)
        return try await execute(request)
    }

    func patch<T: Decodable, B: Encodable>(_ endpoint: String, body: B) async throws -> T {
        var request = try await buildRequest(endpoint: endpoint, method: "PATCH")
        request.httpBody = try encoder.encode(body)
        return try await execute(request)
    }

    func delete<T: Decodable>(_ endpoint: String) async throws -> T {
        let request = try await buildRequest(endpoint: endpoint, method: "DELETE")
        return try await execute(request)
    }

    // MARK: - Private Methods

    private func buildRequest(endpoint: String, method: String, queryItems: [URLQueryItem]? = nil) async throws -> URLRequest {
        var urlComponents = URLComponents(string: Config.apiBaseURL + endpoint)
        urlComponents?.queryItems = queryItems

        guard let url = urlComponents?.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        // Add auth token if available
        if let token = await TokenManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        return request
    }

    private func execute<T: Decodable>(_ request: URLRequest) async throws -> T {
        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.unknown
            }

            switch httpResponse.statusCode {
            case 200...299:
                do {
                    return try decoder.decode(T.self, from: data)
                } catch {
                    throw APIError.decodingError(error)
                }
            case 401:
                await TokenManager.shared.clearTokens()
                throw APIError.unauthorized
            case 404:
                throw APIError.notFound
            case 400...499:
                let errorMessage = try? decoder.decode(APIResponse<String>.self, from: data).error
                throw APIError.serverError(httpResponse.statusCode, errorMessage)
            case 500...599:
                let errorMessage = try? decoder.decode(APIResponse<String>.self, from: data).error
                throw APIError.serverError(httpResponse.statusCode, errorMessage)
            default:
                throw APIError.unknown
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }
}

// MARK: - Token Manager
actor TokenManager {
    static let shared = TokenManager()

    private var token: String?
    private var refreshToken: String?

    private init() {
        // Load from Keychain on init
        token = KeychainHelper.shared.read(key: Config.tokenCacheKey)
    }

    func getToken() -> String? {
        token
    }

    func setTokens(token: String, refreshToken: String) {
        self.token = token
        self.refreshToken = refreshToken
        KeychainHelper.shared.save(token, key: Config.tokenCacheKey)
    }

    func clearTokens() {
        token = nil
        refreshToken = nil
        KeychainHelper.shared.delete(key: Config.tokenCacheKey)
    }
}

// MARK: - Keychain Helper
final class KeychainHelper {
    static let shared = KeychainHelper()
    private init() {}

    func save(_ value: String, key: String) {
        guard let data = value.data(using: .utf8) else { return }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]

        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    func read(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)

        guard let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}
