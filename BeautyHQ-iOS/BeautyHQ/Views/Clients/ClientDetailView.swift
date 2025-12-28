import SwiftUI

struct ClientDetailView: View {
    let client: Client
    @StateObject private var viewModel = ClientDetailViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Profile Header
                profileHeader

                // Stats
                statsRow

                // Quick Actions
                quickActions

                // Contact Info
                contactCard

                // Notes
                if let notes = client.notes {
                    notesCard(notes)
                }

                // Appointments
                appointmentsSection
            }
            .padding()
        }
        .navigationTitle("Client")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    // Edit
                } label: {
                    Image(systemName: "pencil")
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            bookButton
        }
        .task {
            await viewModel.loadAppointments(for: client.id)
        }
    }

    private var profileHeader: some View {
        VStack(spacing: 16) {
            Circle()
                .fill(Color.purple.opacity(0.15))
                .frame(width: 100, height: 100)
                .overlay(
                    Text(client.initials)
                        .font(.largeTitle)
                        .fontWeight(.semibold)
                        .foregroundColor(.purple)
                )

            Text(client.fullName)
                .font(.title)
                .fontWeight(.bold)

            if let lastVisit = client.lastVisit {
                Text("Last visit: \(lastVisit, format: .dateTime.month().day().year())")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            StatCard(
                title: "Visits",
                value: "\(client.totalVisits ?? 0)",
                icon: "calendar",
                color: .purple
            )
            StatCard(
                title: "Spent",
                value: formatCurrency(client.totalSpent ?? 0),
                icon: "dollarsign.circle",
                color: .green
            )
            StatCard(
                title: "Points",
                value: "\(client.loyaltyPoints ?? 0)",
                icon: "star.fill",
                color: .orange
            )
        }
    }

    private var quickActions: some View {
        HStack(spacing: 24) {
            QuickActionCircle(icon: "phone.fill", color: .green, title: "Call") {}
            QuickActionCircle(icon: "message.fill", color: .blue, title: "Text") {}
            if client.email != nil {
                QuickActionCircle(icon: "envelope.fill", color: .purple, title: "Email") {}
            }
            QuickActionCircle(icon: "calendar", color: .pink, title: "Book") {}
        }
    }

    private var contactCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader(icon: "person.fill", title: "Contact Info")

            ContactRow(icon: "phone", value: client.formattedPhone)

            if let email = client.email {
                ContactRow(icon: "envelope", value: email)
            }

            if let dob = client.birthday {
                ContactRow(icon: "gift", value: "Birthday: \(dob.formatted(.dateTime.month().day()))")
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }

    private func notesCard(_ notes: String) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader(icon: "doc.text.fill", title: "Notes")
            Text(notes)
                .font(.subheadline)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }

    private var appointmentsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                SectionHeader(icon: "calendar", title: "Appointments")
                Spacer()
                Button("See All") {}
                    .font(.subheadline)
                    .foregroundColor(.purple)
            }

            if viewModel.appointments.isEmpty {
                Text("No appointments yet")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
            } else {
                ForEach(viewModel.appointments) { appointment in
                    ClientAppointmentRow(appointment: appointment)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }

    private var bookButton: some View {
        Button {
            // Book appointment
        } label: {
            HStack {
                Image(systemName: "plus")
                Text("Book Appointment")
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color.purple)
            .foregroundColor(.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding()
        .background(Color(.systemBackground))
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "$\(Int(value))"
    }
}

// MARK: - Quick Action Circle
struct QuickActionCircle: View {
    let icon: String
    let color: Color
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 50, height: 50)
                    .background(color.opacity(0.15))
                    .clipShape(Circle())

                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Contact Row
struct ContactRow: View {
    let icon: String
    let value: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.gray)
                .frame(width: 20)
            Text(value)
                .font(.subheadline)
        }
    }
}

// MARK: - Client Appointment Row
struct ClientAppointmentRow: View {
    let appointment: Appointment

    var body: some View {
        HStack(spacing: 12) {
            VStack(spacing: 0) {
                Text(appointment.startTime, format: .dateTime.day())
                    .font(.headline)
                Text(appointment.startTime, format: .dateTime.month(.abbreviated))
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)
            }
            .frame(width: 44)

            VStack(alignment: .leading, spacing: 4) {
                Text(appointment.service?.name ?? "Service")
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(appointment.startTime, style: .time)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            StatusBadge(status: appointment.status)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - View Model
@MainActor
class ClientDetailViewModel: ObservableObject {
    @Published var appointments: [Appointment] = []
    @Published var isLoading = false

    func loadAppointments(for clientId: String) async {
        isLoading = true
        do {
            appointments = try await ClientService.shared.getClientAppointments(clientId: clientId, limit: 5)
        } catch {
            // Handle error
        }
        isLoading = false
    }
}
