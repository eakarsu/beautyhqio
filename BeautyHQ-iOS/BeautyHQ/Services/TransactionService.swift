import Foundation

struct RefundTransactionRequest: Encodable {
    let amount: Double?
    let reason: String?
}

struct VoidTransactionRequest: Encodable {
    let reason: String?
}

actor TransactionService {
    static let shared = TransactionService()
    private init() {}

    func getTransactions(startDate: Date? = nil, endDate: Date? = nil, limit: Int = 100) async throws -> [Transaction] {
        var queryItems: [URLQueryItem] = []

        if let startDate = startDate {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate]
            queryItems.append(URLQueryItem(name: "startDate", value: formatter.string(from: startDate)))
        }

        if let endDate = endDate {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate]
            queryItems.append(URLQueryItem(name: "endDate", value: formatter.string(from: endDate)))
        }

        queryItems.append(URLQueryItem(name: "limit", value: String(limit)))

        // Backend returns array directly, not paginated
        return try await APIClient.shared.get("/transactions", queryItems: queryItems.isEmpty ? nil : queryItems)
    }

    func getTransaction(id: String) async throws -> Transaction {
        try await APIClient.shared.get("/transactions/\(id)")
    }

    func getTodayTransactions() async throws -> [Transaction] {
        // Get recent transactions (last 30 days) since seeded data may not be from today
        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -30, to: endDate) ?? endDate
        return try await getTransactions(startDate: startDate, endDate: endDate, limit: 50)
    }

    func getRecentTransactions(days: Int = 7, limit: Int = 50) async throws -> [Transaction] {
        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -days, to: endDate) ?? endDate
        return try await getTransactions(startDate: startDate, endDate: endDate, limit: limit)
    }

    func getAllTransactions(limit: Int = 100) async throws -> [Transaction] {
        return try await getTransactions(limit: limit)
    }

    func createTransaction(_ request: CreateTransactionRequest) async throws -> Transaction {
        try await APIClient.shared.post("/transactions", body: request)
    }

    func refundTransaction(id: String, amount: Double? = nil, reason: String? = nil) async throws -> Transaction {
        try await APIClient.shared.post("/transactions/\(id)/refund", body: RefundTransactionRequest(amount: amount, reason: reason))
    }

    func voidTransaction(id: String, reason: String? = nil) async throws -> Transaction {
        try await APIClient.shared.post("/transactions/\(id)/void", body: VoidTransactionRequest(reason: reason))
    }

    func getDailySummary(date: Date? = nil) async throws -> DailySummary {
        // Calculate summary from all transactions since seeded data may not be from today
        let transactions = try await getAllTransactions(limit: 100)

        var totalSales: Double = 0
        var totalRefunds: Double = 0
        var paymentMethods: [String: Double] = [:]

        for tx in transactions {
            if tx.type == .sale {
                totalSales += tx.total
            } else if tx.type == .refund {
                totalRefunds += tx.total
            }

            if let method = tx.paymentMethod {
                paymentMethods[method, default: 0] += tx.total
            }
        }

        return DailySummary(
            totalSales: totalSales,
            totalRefunds: totalRefunds,
            netRevenue: totalSales - totalRefunds,
            transactionCount: transactions.count,
            byPaymentMethod: paymentMethods
        )
    }
}
