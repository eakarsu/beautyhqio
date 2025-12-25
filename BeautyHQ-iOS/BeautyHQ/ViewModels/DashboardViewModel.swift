import Foundation

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var stats: DashboardStats?
    @Published var upcomingAppointments: [Appointment] = []
    @Published var isLoading = false
    @Published var error: String?

    func loadData() async {
        isLoading = true
        error = nil

        do {
            async let statsTask = DashboardService.shared.getStats()
            async let appointmentsTask = AppointmentService.shared.getUpcomingAppointments(limit: 5)

            let (fetchedStats, fetchedAppointments) = try await (statsTask, appointmentsTask)

            stats = fetchedStats
            upcomingAppointments = fetchedAppointments
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }
}
