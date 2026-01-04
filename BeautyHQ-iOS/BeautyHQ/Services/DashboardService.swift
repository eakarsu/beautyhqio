import Foundation

actor DashboardService {
    static let shared = DashboardService()
    private init() {}

    func getDashboard() async throws -> DashboardResponse {
        try await APIClient.shared.get("/dashboard")
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
