import Foundation

actor DashboardService {
    static let shared = DashboardService()
    private init() {}

    func getStats() async throws -> DashboardStats {
        try await APIClient.shared.get("/dashboard/stats")
    }

    func getTodayOverview() async throws -> TodayOverview {
        try await APIClient.shared.get("/dashboard/today")
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

struct TodayOverview: Codable {
    let appointments: Int
    let completedAppointments: Int
    let revenue: Double
    let newClients: Int
    let walkIns: Int
}
