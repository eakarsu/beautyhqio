import SwiftUI

// MARK: - Notification Names
extension Notification.Name {
    static let clientDeleted = Notification.Name("clientDeleted")
    static let appointmentDeleted = Notification.Name("appointmentDeleted")
    static let appointmentCreated = Notification.Name("appointmentCreated")
}

struct ClientDetailView: View {
    let client: Client
    var onDelete: (() -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = ClientDetailViewModel()
    @State private var showingEditClient = false
    @State private var showingBookAppointment = false
    @State private var showingDeleteConfirmation = false
    @State private var isDeleting = false
    @State private var deleteError: String?
    @State private var showingDeleteError = false
    @State private var showingAIRecommendations = false
    @State private var aiRecommendations: AIStyleRecommendation?
    @State private var isLoadingAI = false
    @State private var selectedServiceForBooking: String?

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

                // AI Recommendations
                aiRecommendationsSection
            }
            .padding()
        }
        .navigationTitle("Client")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        showingEditClient = true
                    } label: {
                        Label("Edit Client", systemImage: "pencil")
                    }

                    Divider()

                    Button(role: .destructive) {
                        showingDeleteConfirmation = true
                    } label: {
                        Label("Delete Client", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            bookButton
        }
        .task {
            await viewModel.loadAppointments(for: client.id)
        }
        .sheet(isPresented: $showingEditClient) {
            EditClientView(client: client)
        }
        .sheet(isPresented: $showingBookAppointment) {
            AddAppointmentView {
                Task { await viewModel.loadAppointments(for: client.id) }
            }
        }
        .alert("Delete Client", isPresented: $showingDeleteConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                Task { await deleteClient() }
            }
        } message: {
            Text("Are you sure you want to delete \(client.fullName)? This action cannot be undone.")
        }
        .alert("Error", isPresented: $showingDeleteError) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(deleteError ?? "An unknown error occurred")
        }
        .overlay {
            if isDeleting {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                    .overlay {
                        ProgressView("Deleting...")
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(10)
                    }
            }
        }
    }

    private func deleteClient() async {
        isDeleting = true
        do {
            try await ClientService.shared.deleteClient(id: client.id)
            // Post notification to refresh clients list
            await MainActor.run {
                NotificationCenter.default.post(name: .clientDeleted, object: nil)
                onDelete?()
            }
            // Small delay to allow refresh to start
            try? await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds
            await MainActor.run {
                dismiss()
            }
        } catch {
            print("Error deleting client: \(error)")
            await MainActor.run {
                isDeleting = false
                deleteError = "Failed to delete client: \(error.localizedDescription)"
                showingDeleteError = true
            }
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
            QuickActionCircle(icon: "phone.fill", color: .green, title: "Call") {
                if let url = URL(string: "tel:\(client.phone.filter { $0.isNumber })") {
                    UIApplication.shared.open(url)
                }
            }
            QuickActionCircle(icon: "message.fill", color: .blue, title: "Text") {
                if let url = URL(string: "sms:\(client.phone.filter { $0.isNumber })") {
                    UIApplication.shared.open(url)
                }
            }
            if let email = client.email {
                QuickActionCircle(icon: "envelope.fill", color: .purple, title: "Email") {
                    if let url = URL(string: "mailto:\(email)") {
                        UIApplication.shared.open(url)
                    }
                }
            }
            QuickActionCircle(icon: "calendar", color: .pink, title: "Book") {
                showingBookAppointment = true
            }
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
                NavigationLink("See All") {
                    ClientAppointmentsListView(clientId: client.id, clientName: client.fullName)
                }
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

    private var aiRecommendationsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                SectionHeader(icon: "sparkles", title: "AI Recommendations")
                Spacer()
                Button {
                    Task { await fetchAIRecommendations() }
                } label: {
                    HStack(spacing: 4) {
                        if isLoadingAI {
                            ProgressView()
                                .scaleEffect(0.7)
                        } else {
                            Image(systemName: "sparkles")
                        }
                        Text(isLoadingAI ? "Analyzing..." : "Get AI Tips")
                            .font(.caption)
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        LinearGradient(
                            colors: [.purple, .indigo],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .clipShape(Capsule())
                }
                .disabled(isLoadingAI)
            }

            if let recommendations = aiRecommendations {
                // Recommended Services
                if !recommendations.recommendations.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recommended Services")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)

                        ForEach(recommendations.recommendations, id: \.service) { rec in
                            AIServiceRecommendationCard(
                                recommendation: rec,
                                onBook: {
                                    selectedServiceForBooking = rec.service
                                    showingBookAppointment = true
                                }
                            )
                        }
                    }
                }

                // Personalized Tips
                if !recommendations.personalizedTips.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Personalized Tips")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)

                        ForEach(Array(recommendations.personalizedTips.enumerated()), id: \.offset) { index, tip in
                            HStack(alignment: .top, spacing: 8) {
                                Text("\(index + 1)")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .frame(width: 20, height: 20)
                                    .background(Color.pink)
                                    .clipShape(Circle())
                                Text(tip)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding()
                    .background(Color.pink.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                // Products to Consider
                if !recommendations.productsToConsider.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Products to Consider")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)

                        ForEach(recommendations.productsToConsider, id: \.self) { product in
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.orange)
                                Text(product)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding()
                    .background(Color.orange.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            } else if !isLoadingAI {
                VStack(spacing: 12) {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 32))
                        .foregroundColor(.purple.opacity(0.5))
                    Text("Get personalized service and product recommendations")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }

    private func fetchAIRecommendations() async {
        isLoadingAI = true
        do {
            aiRecommendations = try await ClientService.shared.getAIRecommendations(clientId: client.id, preferences: client.notes)
        } catch {
            print("Error fetching AI recommendations: \(error)")
        }
        isLoadingAI = false
    }

    private var bookButton: some View {
        Button {
            showingBookAppointment = true
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

// MARK: - Edit Client View
struct EditClientView: View {
    let client: Client
    @Environment(\.dismiss) private var dismiss
    @State private var firstName: String = ""
    @State private var lastName: String = ""
    @State private var phone: String = ""
    @State private var email: String = ""
    @State private var notes: String = ""
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Personal Information") {
                    TextField("First Name", text: $firstName)
                    TextField("Last Name", text: $lastName)
                }

                Section("Contact") {
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle("Edit Client")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await saveClient()
                        }
                    }
                    .disabled(isSaving || firstName.isEmpty || lastName.isEmpty || phone.isEmpty)
                }
            }
            .onAppear {
                firstName = client.firstName
                lastName = client.lastName
                phone = client.phone
                email = client.email ?? ""
                notes = client.notes ?? ""
            }
        }
    }

    private func saveClient() async {
        isSaving = true
        do {
            let request = CreateClientRequest(
                firstName: firstName,
                lastName: lastName,
                email: email.isEmpty ? nil : email,
                phone: phone,
                mobile: nil,
                birthday: client.birthday,
                notes: notes.isEmpty ? nil : notes
            )
            _ = try await ClientService.shared.updateClient(id: client.id, request)
            dismiss()
        } catch {
            print("Error saving client: \(error)")
        }
        isSaving = false
    }
}

// MARK: - Client Appointments List View
struct ClientAppointmentsListView: View {
    let clientId: String
    let clientName: String
    @State private var appointments: [Appointment] = []
    @State private var isLoading = true

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
            } else if appointments.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "calendar.badge.clock")
                        .font(.system(size: 48))
                        .foregroundColor(.gray)
                    Text("No Appointments")
                        .font(.headline)
                    Text("This client has no appointment history.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            } else {
                List(appointments) { appointment in
                    NavigationLink(destination: AppointmentDetailView(initialAppointment: appointment)) {
                        ClientAppointmentRow(appointment: appointment)
                    }
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("\(clientName)'s Appointments")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadAppointments()
        }
    }

    private func loadAppointments() async {
        do {
            appointments = try await ClientService.shared.getClientAppointments(clientId: clientId, limit: 50)
        } catch {
            print("Error loading appointments: \(error)")
        }
        isLoading = false
    }
}

// MARK: - AI Service Recommendation Card
struct AIServiceRecommendationCard: View {
    let recommendation: AIServiceRecommendation
    let onBook: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(recommendation.service)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        Text("\(recommendation.confidence)% match")
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.purple.opacity(0.15))
                            .foregroundColor(.purple)
                            .clipShape(Capsule())
                    }
                    Text(recommendation.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Button(action: onBook) {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                        Text("Book")
                    }
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.purple)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.purple.opacity(0.1))
                    .clipShape(Capsule())
                }
            }

            HStack(alignment: .top, spacing: 6) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
                    .font(.caption)
                Text(recommendation.reason)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color(.systemBackground), Color.purple.opacity(0.05)],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.purple.opacity(0.2), lineWidth: 1)
        )
    }
}
