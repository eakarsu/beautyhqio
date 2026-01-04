import Foundation

@MainActor
class AppointmentsViewModel: ObservableObject {
    @Published var appointments: [Appointment] = []
    @Published var allAppointments: [Appointment] = []
    @Published var selectedStatus: AppointmentStatus?
    @Published var isLoading = false
    @Published var error: String?
    @Published var availableDates: Set<String> = []
    @Published var showingAllDates = true

    var filteredAppointments: [Appointment] {
        guard let status = selectedStatus else {
            return appointments
        }
        return appointments.filter { $0.status == status }
    }

    // Load all appointments (no date filter) to get seeded data
    func loadAllAppointments() async {
        isLoading = true
        error = nil
        showingAllDates = true

        do {
            allAppointments = try await AppointmentService.shared.getAppointments(date: nil)
            appointments = allAppointments

            // Build set of dates that have appointments
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            availableDates = Set(allAppointments.map { dateFormatter.string(from: $0.startTime) })

            print("Loaded \(allAppointments.count) total appointments")
        } catch {
            self.error = error.localizedDescription
            print("Failed to load appointments: \(error)")
        }

        isLoading = false
    }

    func loadAppointments(for date: Date) async {
        isLoading = true
        error = nil
        showingAllDates = false

        do {
            // First ensure we have all appointments cached
            if allAppointments.isEmpty {
                allAppointments = try await AppointmentService.shared.getAppointments(date: nil)
            }

            // Filter locally by date
            let calendar = Calendar.current
            appointments = allAppointments.filter { appointment in
                calendar.isDate(appointment.startTime, inSameDayAs: date)
            }
            print("Filtered \(appointments.count) appointments for \(date)")
        } catch {
            self.error = error.localizedDescription
            print("Failed to load appointments: \(error)")
        }

        isLoading = false
    }

    // Check if a date has appointments
    func hasAppointments(on date: Date) -> Bool {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        return availableDates.contains(dateFormatter.string(from: date))
    }

    func updateStatus(_ appointment: Appointment, to status: AppointmentStatus) async {
        do {
            let request = UpdateAppointmentRequest(
                staffId: nil,
                serviceId: nil,
                startTime: nil,
                status: status,
                notes: nil
            )
            let updated = try await AppointmentService.shared.updateAppointment(id: appointment.id, request)

            if let index = appointments.firstIndex(where: { $0.id == appointment.id }) {
                appointments[index] = updated
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
