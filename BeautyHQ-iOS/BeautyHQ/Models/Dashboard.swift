import Foundation

// Dashboard response from backend
struct DashboardResponse: Codable {
    let stats: DashboardStats
    let appointments: [DashboardAppointment]
    let recentClients: [DashboardClient]
    let alerts: [DashboardAlert]
}

struct DashboardStats: Codable {
    let todayAppointments: Int
    let appointmentChange: String?
    let todayRevenue: Double
    let revenueChange: String?
    let walkInQueue: Int?
    let avgWaitTime: String?
    let staffOnDuty: Int?
    let totalClients: Int?

    var formattedTodayRevenue: String {
        formatCurrency(todayRevenue)
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }
}

struct DashboardAppointment: Codable, Identifiable {
    let id: String
    let time: Date
    let client: String
    let clientId: String?
    let service: String
    let staff: String
    let staffId: String?
    let status: String
}

struct DashboardClient: Codable, Identifiable {
    let id: String
    let name: String
    let phone: String?
    let email: String?
    let status: String
    let createdAt: Date
}

struct DashboardAlert: Codable {
    let type: String
    let message: String
    let href: String?
}

struct DailySummary: Codable {
    let totalSales: Double?
    let totalRefunds: Double?
    let netRevenue: Double?
    let transactionCount: Int?
    let byPaymentMethod: [String: Double]?

    init(totalSales: Double? = nil, totalRefunds: Double? = nil, netRevenue: Double? = nil,
         transactionCount: Int? = nil, byPaymentMethod: [String: Double]? = nil) {
        self.totalSales = totalSales
        self.totalRefunds = totalRefunds
        self.netRevenue = netRevenue
        self.transactionCount = transactionCount
        self.byPaymentMethod = byPaymentMethod
    }

    var formattedNetRevenue: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: netRevenue ?? 0)) ?? "$0"
    }
}
