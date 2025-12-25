import Foundation

struct DashboardStats: Codable {
    let todayAppointments: Int
    let todayRevenue: Double
    let weeklyRevenue: Double
    let monthlyRevenue: Double
    let newClients: Int
    let upcomingAppointments: [Appointment]
    let recentTransactions: [Transaction]

    var formattedTodayRevenue: String {
        formatCurrency(todayRevenue)
    }

    var formattedWeeklyRevenue: String {
        formatCurrency(weeklyRevenue)
    }

    var formattedMonthlyRevenue: String {
        formatCurrency(monthlyRevenue)
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }
}

struct DailySummary: Codable {
    let totalSales: Double
    let totalRefunds: Double
    let netRevenue: Double
    let transactionCount: Int
    let byPaymentMethod: [String: Double]

    var formattedNetRevenue: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: netRevenue)) ?? "$\(netRevenue)"
    }
}
