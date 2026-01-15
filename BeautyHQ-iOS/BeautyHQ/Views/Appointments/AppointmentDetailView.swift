import SwiftUI

struct AppointmentDetailView: View {
    let initialAppointment: Appointment
    @StateObject private var viewModel = AppointmentDetailViewModel()
    @Environment(\.dismiss) var dismiss
    @State private var showingCancelAlert = false
    @State private var showingReschedule = false
    @State private var showingEditNotes = false
    @State private var showingCheckout = false
    @State private var currentAppointment: Appointment?

    private var appointment: Appointment {
        currentAppointment ?? initialAppointment
    }

    var body: some View {
        ZStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Status Banner
                    statusBanner

                    // Client Card
                    clientCard

                    // Service Card
                    serviceCard

                    // Notes Card
                    if appointment.notes != nil {
                        notesCard
                    }

                    // Payment Card
                    paymentCard
                }
                .padding()
            }

            // Loading overlay
            if viewModel.isLoading {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(.white)
            }
        }
        .navigationTitle("Appointment")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button("Reschedule", systemImage: "calendar") {
                        showingReschedule = true
                    }
                    Button("Edit Notes", systemImage: "pencil") {
                        showingEditNotes = true
                    }
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
                    if let updated = await viewModel.cancelAppointment(appointment) {
                        currentAppointment = updated
                    }
                    dismiss()
                }
            }
        } message: {
            Text("Are you sure you want to cancel this appointment?")
        }
        .alert("Error", isPresented: .init(
            get: { viewModel.error != nil },
            set: { if !$0 { viewModel.error = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.error ?? "An error occurred")
        }
        .onAppear {
            currentAppointment = initialAppointment
        }
        .sheet(isPresented: $showingReschedule) {
            RescheduleAppointmentView(appointment: appointment) { updated in
                currentAppointment = updated
            }
        }
        .sheet(isPresented: $showingEditNotes) {
            EditAppointmentNotesView(appointment: appointment) { updated in
                currentAppointment = updated
            }
        }
        .sheet(isPresented: $showingCheckout) {
            CheckoutView(appointment: appointment) { updated in
                currentAppointment = appointment.mergedWith(updated)
                dismiss()
            }
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

                        Text(client.formattedPhone)
                            .font(.subheadline)
                            .foregroundColor(.secondary)

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

                Divider()

                PaymentRow(
                    label: "Total",
                    value: formatCurrency(appointment.totalPrice),
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
                ("Check In", true, {
                    if let updated = await viewModel.checkIn(appointment) {
                        currentAppointment = appointment.mergedWith(updated)
                    }
                }),
                ("Cancel", false, { showingCancelAlert = true })
            ]
        case .checkedIn:
            return [
                ("Start Service", true, {
                    if let updated = await viewModel.startService(appointment) {
                        currentAppointment = appointment.mergedWith(updated)
                    }
                }),
                ("No Show", false, {
                    if let updated = await viewModel.markNoShow(appointment) {
                        currentAppointment = appointment.mergedWith(updated)
                        dismiss()
                    }
                })
            ]
        case .inService:
            return [
                ("Complete & Checkout", true, {
                    showingCheckout = true
                })
            ]
        case .completed:
            return [
                ("View Receipt", false, {
                    // Already completed - could navigate to receipt
                    dismiss()
                })
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

    func checkIn(_ appointment: Appointment) async -> Appointment? {
        isLoading = true
        defer { isLoading = false }
        do {
            return try await AppointmentService.shared.checkIn(id: appointment.id)
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }

    func startService(_ appointment: Appointment) async -> Appointment? {
        isLoading = true
        defer { isLoading = false }
        do {
            return try await AppointmentService.shared.startService(id: appointment.id)
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }

    func complete(_ appointment: Appointment) async -> Appointment? {
        isLoading = true
        defer { isLoading = false }
        do {
            // Use completeWithPayment to charge the client's card first
            return try await AppointmentService.shared.completeWithPayment(appointment: appointment)
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }

    func markNoShow(_ appointment: Appointment) async -> Appointment? {
        isLoading = true
        defer { isLoading = false }
        do {
            return try await AppointmentService.shared.markNoShow(id: appointment.id)
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }

    func cancelAppointment(_ appointment: Appointment) async -> Appointment? {
        isLoading = true
        defer { isLoading = false }
        do {
            return try await AppointmentService.shared.cancelAppointment(id: appointment.id)
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }
}

// MARK: - Reschedule Appointment View
struct RescheduleAppointmentView: View {
    let appointment: Appointment
    let onSave: (Appointment) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var selectedDate: Date
    @State private var isSaving = false
    @State private var error: String?

    init(appointment: Appointment, onSave: @escaping (Appointment) -> Void) {
        self.appointment = appointment
        self.onSave = onSave
        self._selectedDate = State(initialValue: appointment.startTime)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Current Appointment") {
                    HStack {
                        Text("Date")
                        Spacer()
                        Text(appointment.startTime, format: .dateTime.month().day().year())
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Time")
                        Spacer()
                        Text(appointment.startTime, style: .time)
                            .foregroundColor(.secondary)
                    }
                }

                Section("New Date & Time") {
                    DatePicker("Select", selection: $selectedDate, in: Date()...)
                        .datePickerStyle(.graphical)
                }

                if let error = error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Reschedule")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await reschedule() }
                    }
                    .disabled(isSaving)
                }
            }
        }
    }

    private func reschedule() async {
        isSaving = true
        do {
            let request = UpdateAppointmentRequest(staffId: nil, serviceId: nil, startTime: selectedDate, status: nil, notes: nil)
            let updated = try await AppointmentService.shared.updateAppointment(id: appointment.id, request)
            onSave(updated)
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
        isSaving = false
    }
}

// MARK: - Edit Appointment Notes View
struct EditAppointmentNotesView: View {
    let appointment: Appointment
    let onSave: (Appointment) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var notes: String
    @State private var isSaving = false
    @State private var error: String?

    init(appointment: Appointment, onSave: @escaping (Appointment) -> Void) {
        self.appointment = appointment
        self.onSave = onSave
        self._notes = State(initialValue: appointment.notes ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 200)
                }

                if let error = error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Edit Notes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await saveNotes() }
                    }
                    .disabled(isSaving)
                }
            }
        }
    }

    private func saveNotes() async {
        isSaving = true
        do {
            let request = UpdateAppointmentRequest(staffId: nil, serviceId: nil, startTime: nil, status: nil, notes: notes.isEmpty ? nil : notes)
            let updated = try await AppointmentService.shared.updateAppointment(id: appointment.id, request)
            onSave(updated)
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
        isSaving = false
    }
}

// MARK: - Checkout View
struct CheckoutView: View {
    let appointment: Appointment
    let onComplete: (Appointment) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var paymentMethods: [ClientPaymentMethod] = []
    @State private var selectedPaymentMethod: ClientPaymentMethod?
    @State private var isLoading = true
    @State private var isCharging = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if isLoading {
                    Spacer()
                    ProgressView("Loading payment methods...")
                    Spacer()
                } else {
                    ScrollView {
                        VStack(spacing: 20) {
                            // Service Summary
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Service Summary")
                                    .font(.headline)

                                if let service = appointment.service {
                                    HStack {
                                        Text(service.name)
                                        Spacer()
                                        Text(service.formattedPrice)
                                            .fontWeight(.medium)
                                    }
                                }

                                Divider()

                                HStack {
                                    Text("Total")
                                        .font(.headline)
                                    Spacer()
                                    Text(formatCurrency(appointment.totalPrice))
                                        .font(.title2)
                                        .fontWeight(.bold)
                                        .foregroundColor(.purple)
                                }
                            }
                            .padding()
                            .background(Color(.systemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)

                            // Payment Method Selection
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Payment Method")
                                    .font(.headline)

                                if paymentMethods.isEmpty {
                                    Text("No saved payment methods")
                                        .foregroundColor(.secondary)
                                        .padding(.vertical)
                                } else {
                                    ForEach(paymentMethods) { method in
                                        Button {
                                            selectedPaymentMethod = method
                                        } label: {
                                            HStack {
                                                Image(systemName: "creditcard.fill")
                                                    .foregroundColor(.purple)
                                                Text("\(method.brand.capitalized) •••• \(method.last4)")
                                                Spacer()
                                                if selectedPaymentMethod?.id == method.id {
                                                    Image(systemName: "checkmark.circle.fill")
                                                        .foregroundColor(.purple)
                                                }
                                            }
                                            .padding()
                                            .background(selectedPaymentMethod?.id == method.id ? Color.purple.opacity(0.1) : Color(.systemGray6))
                                            .clipShape(RoundedRectangle(cornerRadius: 10))
                                        }
                                        .buttonStyle(PlainButtonStyle())
                                    }
                                }
                            }
                            .padding()
                            .background(Color(.systemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)

                            if let error = error {
                                Text(error)
                                    .foregroundColor(.red)
                                    .font(.subheadline)
                                    .padding()
                            }
                        }
                        .padding()
                    }

                    // Charge Button
                    VStack {
                        Button {
                            Task { await chargeAndComplete() }
                        } label: {
                            HStack {
                                if isCharging {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Image(systemName: "creditcard.fill")
                                    Text("Charge \(formatCurrency(appointment.totalPrice))")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(selectedPaymentMethod != nil ? Color.purple : Color.gray)
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .disabled(selectedPaymentMethod == nil || isCharging)

                        Button("Skip Payment") {
                            Task { await completeWithoutPayment() }
                        }
                        .foregroundColor(.secondary)
                        .padding(.top, 8)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Checkout")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .task {
                await loadPaymentMethods()
            }
        }
    }

    private func loadPaymentMethods() async {
        guard let clientId = appointment.clientId else {
            isLoading = false
            return
        }

        do {
            paymentMethods = try await AppointmentService.shared.getClientPaymentMethods(clientId: clientId)
            // Select default or first payment method
            selectedPaymentMethod = paymentMethods.first(where: { $0.isDefault }) ?? paymentMethods.first
        } catch {
            self.error = "Failed to load payment methods"
        }
        isLoading = false
    }

    private func chargeAndComplete() async {
        guard let paymentMethod = selectedPaymentMethod,
              let clientId = appointment.clientId else { return }

        isCharging = true
        error = nil

        do {
            let amountInCents = Int(appointment.totalPrice * 100)

            if amountInCents > 0 {
                let chargeResult = try await AppointmentService.shared.chargePayment(
                    clientId: clientId,
                    paymentMethodId: paymentMethod.id,
                    amount: amountInCents,
                    staffId: appointment.staffId,
                    appointmentId: appointment.id
                )

                if !chargeResult.success {
                    self.error = chargeResult.error ?? "Payment failed"
                    isCharging = false
                    return
                }
            }

            // Mark appointment as complete
            let updated = try await AppointmentService.shared.complete(id: appointment.id)
            onComplete(updated)
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
        isCharging = false
    }

    private func completeWithoutPayment() async {
        isCharging = true
        do {
            let updated = try await AppointmentService.shared.complete(id: appointment.id)
            onComplete(updated)
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
        isCharging = false
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }
}
