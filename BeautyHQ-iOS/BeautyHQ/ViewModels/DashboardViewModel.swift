import Foundation

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var stats: DashboardStats?
    @Published var todayAppointments: [DashboardAppointment] = []
    @Published var recentClients: [DashboardClient] = []
    @Published var alerts: [DashboardAlert] = []
    @Published var isLoading = false
    @Published var error: String?

    func loadData() async {
        isLoading = true
        error = nil

        do {
            let dashboard = try await DashboardService.shared.getDashboard()
            stats = dashboard.stats
            todayAppointments = dashboard.appointments
            recentClients = dashboard.recentClients
            alerts = dashboard.alerts
        } catch {
            self.error = error.localizedDescription
            print("Dashboard error: \(error)")
        }

        isLoading = false
    }
}
