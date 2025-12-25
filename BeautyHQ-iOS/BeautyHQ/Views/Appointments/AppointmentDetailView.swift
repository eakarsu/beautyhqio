import SwiftUI

struct AppointmentDetailView: View {
    let appointment: Appointment
    @StateObject private var viewModel = AppointmentDetailViewModel()
    @Environment(\.dismiss) var dismiss
    @State private var showingCancelAlert = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Status Banner
                statusBanner

                // Client Card
                clientCard

                // Service Card
                serviceCard

                // Notes Card
                if appointment.notes != nil || appointment.internalNotes != nil {
                    notesCard
                }

                // Payment Card
                paymentCard
            }
            .padding()
        }
        .navigationTitle("Appointment")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button("Reschedule", systemImage: "calendar") {}
                    Button("Edit Notes", systemImage: "pencil") {}
                    Divider()
                    Button("Cancel Appointment", systemImage: "xmark.circle", role: .destructive) {
                        showingCancelAlert = true
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            actionButtons
        }
        .alert("Cancel Appointment", isPresented: $showingCancelAlert) {
            Button("No", role: .cancel) {}
            Button("Yes, Cancel", role: .destructive) {
                Task {
                    await viewModel.cancelAppointment(appointment)
                    dismiss()
                }
            }
        } message: {
            Text("Are you sure you want to cancel this appointment?")
        }
    }

    private var statusBanner: some View {
        VStack(spacing: 12) {
            StatusBadge(status: appointment.status)

            Text(appointment.startTime, format: .dateTime.weekday(.wide).month().day().year())
                .font(.headline)

            Text("\(appointment.startTime, style: .time) - \(appointment.endTime, style: .time)")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }

    private var clientCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader(icon: "person.fill", title: "Client")

            if let client = appointment.client {
                HStack(spacing: 14) {
                    Circle()
                        .fill(Color.purple.opacity(0.15))
                        .frame(width: 56, height: 56)
                        .overlay(
                            Text(client.initials)
                                .font(.headline)
                                .fontWeight(.semibold)
                                .foregroundColor(.purple)
                        )

                    VStack(alignment: .leading, spacing: 4) {
                        Text(client.fullName)
                            .font(.headline)

                        if let phone = client.formattedPhone {
                            Text(phone)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }

                        if let email = client.email {
                            Text(email)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }

    private var serviceCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader(icon: "scissors", title: "Service")

            if let service = appointment.service {
                HStack {
                    Text(service.name)
                        .font(.headline)
                    Spacer()
                    Text(service.formattedPrice)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.purple)
                }

                HStack(spacing: 20) {
                    Label(appointment.durationFormatted, systemImage: "clock")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    if let staff = appointment.staff {
                        Label(staff.fullName, systemImage: "person")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }

    private var notesCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader(icon: "doc.text.fill", title: "Notes")

            if let notes = appointment.notes {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Client Notes")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                    Text(notes)
                        .font(.subheadline)
                }
            }

            if let internalNotes = appointment.internalNotes {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Internal Notes")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                    Text(internalNotes)
                        .font(.subheadline)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }

    private var paymentCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader(icon: "creditcard.fill", title: "Payment")

            VStack(spacing: 12) {
                PaymentRow(label: "Service", value: formatCurrency(appointment.totalPrice))

                if appointment.depositPaid > 0 {
                    PaymentRow(
                        label: "Deposit Paid",
                        value: "-\(formatCurrency(appointment.depositPaid))",
                        valueColor: .green
                    )
                }

                Divider()

                PaymentRow(
                    label: "Balance Due",
                    value: formatCurrency(appointment.balanceDue),
                    isTotal: true
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }

    @ViewBuilder
    private var actionButtons: some View {
        let buttons = getActionButtons()
        if !buttons.isEmpty {
            VStack(spacing: 10) {
                ForEach(buttons, id: \.title) { button in
                    Button {
                        Task {
                            await button.action()
                        }
                    } label: {
                        Text(button.title)
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(button.isPrimary ? Color.purple : Color(.systemGray5))
                            .foregroundColor(button.isPrimary ? .white : .primary)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
        }
    }

    private func getActionButtons() -> [(title: String, isPrimary: Bool, action: () async -> Void)] {
        switch appointment.status {
        case .booked, .confirmed:
            return [
                ("Check In", true, { await viewModel.checkIn(appointment) }),
                ("Cancel", false, { showingCancelAlert = true })
            ]
        case .checkedIn:
            return [
                ("Start Service", true, { await viewModel.startService(appointment) }),
                ("No Show", false, { await viewModel.markNoShow(appointment) })
            ]
        case .inService:
            return [
                ("Complete & Checkout", true, { await viewModel.complete(appointment) })
            ]
        default:
            return []
        }
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }
}

// MARK: - Section Header
struct SectionHeader: View {
    let icon: String
    let title: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(.purple)
            Text(title)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
                .textCase(.uppercase)
        }
    }
}

// MARK: - Payment Row
struct PaymentRow: View {
    let label: String
    let value: String
    var valueColor: Color = .primary
    var isTotal: Bool = false

    var body: some View {
        HStack {
            Text(label)
                .font(isTotal ? .headline : .subheadline)
                .foregroundColor(isTotal ? .primary : .secondary)
            Spacer()
            Text(value)
                .font(isTotal ? .title2 : .subheadline)
                .fontWeight(isTotal ? .bold : .regular)
                .foregroundColor(isTotal ? .purple : valueColor)
        }
    }
}

// MARK: - View Model
@MainActor
class AppointmentDetailViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?

    func checkIn(_ appointment: Appointment) async {
        do {
            _ = try await AppointmentService.shared.checkIn(id: appointment.id)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func startService(_ appointment: Appointment) async {
        do {
            _ = try await AppointmentService.shared.startService(id: appointment.id)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func complete(_ appointment: Appointment) async {
        do {
            _ = try await AppointmentService.shared.complete(id: appointment.id)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func markNoShow(_ appointment: Appointment) async {
        do {
            _ = try await AppointmentService.shared.markNoShow(id: appointment.id)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func cancelAppointment(_ appointment: Appointment) async {
        do {
            _ = try await AppointmentService.shared.cancelAppointment(id: appointment.id)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
