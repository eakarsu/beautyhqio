import Foundation

// Response model matching backend format
struct ClientsResponse: Decodable {
    let clients: [Client]
    let pagination: ClientsPagination
}

struct ClientsPagination: Decodable {
    let page: Int
    let limit: Int
    let total: Int
    let totalPages: Int
}

actor ClientService {
    static let shared = ClientService()
    private init() {}

    func getClients(search: String? = nil, page: Int = 1, pageSize: Int = 50) async throws -> ClientsResponse {
        var queryItems = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(pageSize))
        ]

        if let search = search, !search.isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: search))
        }

        return try await APIClient.shared.get("/clients", queryItems: queryItems)
    }

    func getClient(id: String) async throws -> Client {
        try await APIClient.shared.get("/clients/\(id)")
    }

    func searchClients(query: String) async throws -> [Client] {
        let queryItems = [URLQueryItem(name: "q", value: query)]
        return try await APIClient.shared.get("/clients/search", queryItems: queryItems)
    }

    func createClient(_ request: CreateClientRequest) async throws -> Client {
        try await APIClient.shared.post("/clients", body: request)
    }

    func updateClient(id: String, _ request: CreateClientRequest) async throws -> Client {
        try await APIClient.shared.patch("/clients/\(id)", body: request)
    }

    func deleteClient(id: String) async throws {
        let _: EmptyResponse = try await APIClient.shared.delete("/clients/\(id)")
    }

    func getClientAppointments(clientId: String, limit: Int = 10) async throws -> [Appointment] {
        let queryItems = [URLQueryItem(name: "limit", value: String(limit))]
        return try await APIClient.shared.get("/clients/\(clientId)/appointments", queryItems: queryItems)
    }

    func getClientTransactions(clientId: String, limit: Int = 10) async throws -> [Transaction] {
        let queryItems = [URLQueryItem(name: "limit", value: String(limit))]
        return try await APIClient.shared.get("/clients/\(clientId)/transactions", queryItems: queryItems)
    }
}
