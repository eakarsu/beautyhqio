import SwiftUI

struct AppointmentsView: View {
    @StateObject private var viewModel = AppointmentsViewModel()
    @State private var selectedDate = Date()
    @State private var showingAddAppointment = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Date Navigator
                dateNavigator

                // Status Filter
                statusFilter

                // Appointments List
                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.appointments.isEmpty {
                    EmptyStateView(
                        icon: "calendar",
                        title: "No Appointments",
                        message: viewModel.showingAllDates
                            ? "No appointments scheduled yet."
                            : "No appointments for this day. Tap 'All' to see all appointments."
                    )
                } else {
                    appointmentsList
                }
            }
            .navigationTitle("Appointments")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        Task {
                            await viewModel.loadAllAppointments()
                        }
                    } label: {
                        Text("All")
                            .font(.subheadline)
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddAppointment = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddAppointment) {
                AddAppointmentView()
            }
        }
        .task {
            // Load all appointments initially to show seeded data
            await viewModel.loadAllAppointments()
        }
        .onChange(of: selectedDate) { _, newDate in
            Task {
                await viewModel.loadAppointments(for: newDate)
            }
        }
    }

    private var dateNavigator: some View {
        HStack {
            Button {
                selectedDate = Calendar.current.date(byAdding: .day, value: -1, to: selectedDate) ?? selectedDate
            } label: {
                Image(systemName: "chevron.left")
                    .padding(12)
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            .opacity(viewModel.showingAllDates ? 0.3 : 1)
            .disabled(viewModel.showingAllDates)

            Spacer()

            VStack(spacing: 2) {
                if viewModel.showingAllDates {
                    Text("All Dates")
                        .font(.headline)
                    Text("\(viewModel.appointments.count) appointments")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    Text(relativeDay)
                        .font(.headline)
                    Text(selectedDate, format: .dateTime.month().day().year())
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Button {
                selectedDate = Calendar.current.date(byAdding: .day, value: 1, to: selectedDate) ?? selectedDate
            } label: {
                Image(systemName: "chevron.right")
                    .padding(12)
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            .opacity(viewModel.showingAllDates ? 0.3 : 1)
            .disabled(viewModel.showingAllDates)
        }
        .padding()
        .background(Color(.systemBackground))
    }

    private var relativeDay: String {
        if Calendar.current.isDateInToday(selectedDate) {
            return "Today"
        } else if Calendar.current.isDateInTomorrow(selectedDate) {
            return "Tomorrow"
        } else if Calendar.current.isDateInYesterday(selectedDate) {
            return "Yesterday"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEEE"
            return formatter.string(from: selectedDate)
        }
    }

    private var statusFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(
                    title: "All",
                    isSelected: viewModel.selectedStatus == nil
                ) {
                    viewModel.selectedStatus = nil
                }

                ForEach([AppointmentStatus.booked, .confirmed, .checkedIn, .inService, .completed], id: \.self) { status in
                    FilterChip(
                        title: status.displayName,
                        isSelected: viewModel.selectedStatus == status
                    ) {
                        viewModel.selectedStatus = status
                    }
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
    }

    private var appointmentsList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredAppointments) { appointment in
                    NavigationLink(value: appointment) {
                        AppointmentCard(appointment: appointment)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
        .refreshable {
            await viewModel.loadAppointments(for: selectedDate)
        }
        .navigationDestination(for: Appointment.self) { appointment in
            AppointmentDetailView(appointment: appointment)
        }
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(isSelected ? .white : .secondary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.purple : Color(.systemGray6))
                .clipShape(Capsule())
        }
    }
}

// MARK: - Appointment Card
struct AppointmentCard: View {
    let appointment: Appointment

    var body: some View {
        HStack(spacing: 0) {
            // Time Column
            VStack(spacing: 4) {
                Text(appointment.startTime, style: .time)
                    .font(.subheadline)
                    .fontWeight(.bold)
                Text(appointment.endTime, style: .time)
                    .font(.caption)
                Text(appointment.durationFormatted)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .frame(width: 70)
            .padding(.vertical, 12)
            .background(Color.purple.opacity(0.1))

            // Content
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    // Client
                    HStack(spacing: 8) {
                        Circle()
                            .fill(Color.purple.opacity(0.2))
                            .frame(width: 36, height: 36)
                            .overlay(
                                Text(appointment.client?.initials ?? "?")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.purple)
                            )

                        VStack(alignment: .leading, spacing: 2) {
                            Text(appointment.client?.fullName ?? "Unknown")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text(appointment.client?.formattedPhone ?? "")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    StatusBadge(status: appointment.status)
                }

                HStack {
                    Image(systemName: "scissors")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(appointment.service?.name ?? "Service")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text(appointment.service?.formattedPrice ?? "")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }

                if let staff = appointment.staff {
                    HStack {
                        Image(systemName: "person")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("with \(staff.fullName)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(12)
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }
}

// MARK: - Empty State View
struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundColor(.gray)
                .frame(width: 96, height: 96)
                .background(Color(.systemGray6))
                .clipShape(Circle())

            Text(title)
                .font(.headline)

            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            if let actionTitle = actionTitle, let action = action {
                Button(actionTitle, action: action)
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)
            }
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    AppointmentsView()
}
