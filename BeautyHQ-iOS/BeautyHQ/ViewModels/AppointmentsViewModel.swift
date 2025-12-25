import Foundation

@MainActor
class AppointmentsViewModel: ObservableObject {
    @Published var appointments: [Appointment] = []
    @Published var selectedStatus: AppointmentStatus?
    @Published var isLoading = false
    @Published var error: String?

    var filteredAppointments: [Appointment] {
        guard let status = selectedStatus else {
            return appointments
        }
        return appointments.filter { $0.status == status }
    }

    func loadAppointments(for date: Date) async {
        isLoading = true
        error = nil

        do {
            appointments = try await AppointmentService.shared.getAppointments(date: date)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func updateStatus(_ appointment: Appointment, to status: AppointmentStatus) async {
        do {
            let request = UpdateAppointmentRequest(
                staffId: nil,
                serviceId: nil,
                startTime: nil,
                status: status,
                notes: nil,
                internalNotes: nil
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
