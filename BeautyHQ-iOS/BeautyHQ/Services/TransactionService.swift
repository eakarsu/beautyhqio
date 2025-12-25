import Foundation

actor TransactionService {
    static let shared = TransactionService()
    private init() {}

    func getTransactions(date: Date? = nil, page: Int = 1, pageSize: Int = 50) async throws -> PaginatedResponse<Transaction> {
        var queryItems = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "pageSize", value: String(pageSize))
        ]

        if let date = date {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate]
            queryItems.append(URLQueryItem(name: "date", value: formatter.string(from: date)))
        }

        return try await APIClient.shared.get("/transactions", queryItems: queryItems)
    }

    func getTransaction(id: String) async throws -> Transaction {
        try await APIClient.shared.get("/transactions/\(id)")
    }

    func getTodayTransactions() async throws -> [Transaction] {
        let response = try await getTransactions(date: Date())
        return response.data
    }

    func createTransaction(_ request: CreateTransactionRequest) async throws -> Transaction {
        try await APIClient.shared.post("/transactions", body: request)
    }

    func refundTransaction(id: String, amount: Double? = nil, reason: String? = nil) async throws -> Transaction {
        var body: [String: Any] = [:]
        if let amount = amount { body["amount"] = amount }
        if let reason = reason { body["reason"] = reason }

        return try await APIClient.shared.post("/transactions/\(id)/refund", body: body)
    }

    func voidTransaction(id: String, reason: String? = nil) async throws -> Transaction {
        try await APIClient.shared.post("/transactions/\(id)/void", body: ["reason": reason as Any])
    }

    func getDailySummary(date: Date? = nil) async throws -> DailySummary {
        var queryItems: [URLQueryItem]? = nil

        if let date = date {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate]
            queryItems = [URLQueryItem(name: "date", value: formatter.string(from: date))]
        }

        return try await APIClient.shared.get("/transactions/summary", queryItems: queryItems)
    }
}
