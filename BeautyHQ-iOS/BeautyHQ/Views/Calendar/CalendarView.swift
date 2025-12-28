import SwiftUI

struct CalendarView: View {
    @StateObject private var viewModel = CalendarViewModel()
    @State private var selectedDate = Date()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Calendar Header
                DatePicker(
                    "Select Date",
                    selection: $selectedDate,
                    displayedComponents: [.date]
                )
                .datePickerStyle(.graphical)
                .padding()
                .onChange(of: selectedDate) { _, newDate in
                    Task {
                        await viewModel.loadAppointments(for: newDate)
                    }
                }

                Divider()

                // Appointments List
                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxHeight: .infinity)
                } else if viewModel.appointments.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "calendar.badge.exclamationmark")
                            .font(.largeTitle)
                            .foregroundColor(.gray)
                        Text("No appointments for this day")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxHeight: .infinity)
                } else {
                    List(viewModel.appointments) { appointment in
                        CalendarAppointmentRow(appointment: appointment)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Calendar")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        selectedDate = Date()
                    } label: {
                        Text("Today")
                    }
                }
            }
        }
        .task {
            await viewModel.loadAppointments(for: selectedDate)
        }
    }
}

struct CalendarAppointmentRow: View {
    let appointment: Appointment

    var body: some View {
        HStack(spacing: 12) {
            Rectangle()
                .fill(Color.purple)
                .frame(width: 4)
                .cornerRadius(2)

            VStack(alignment: .leading, spacing: 4) {
                Text(appointment.client?.fullName ?? "Client")
                    .font(.headline)
                Text(appointment.service?.name ?? "Service")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(appointment.startTime, style: .time)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text("\(appointment.duration) min")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }
}

@MainActor
class CalendarViewModel: ObservableObject {
    @Published var appointments: [Appointment] = []
    @Published var isLoading = false

    func loadAppointments(for date: Date) async {
        isLoading = true
        do {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate]  // Just date, no time
            let dateString = formatter.string(from: date)
            let queryItems = [URLQueryItem(name: "date", value: dateString)]
            appointments = try await APIClient.shared.get("/appointments", queryItems: queryItems)
            print("Loaded \(appointments.count) calendar appointments for \(dateString)")
        } catch {
            print("Failed to load calendar appointments: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    CalendarView()
}
