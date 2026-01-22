import SwiftUI
#if os(iOS)
import UIKit
#endif

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var appState: AppState

    var body: some View {
        Group {
            if authManager.isLoading {
                LoadingView()
            } else if authManager.isAuthenticated {
                // Show different views based on user role
                if let role = authManager.currentUser?.role {
                    switch role {
                    case .client:
                        // Clients see a simplified portal view
                        ClientPortalTabView()
                    case .staff:
                        // Staff see staff portal (My Schedule, My Clients, My Earnings)
                        StaffPortalTabView()
                    case .platformAdmin, .owner, .manager, .receptionist:
                        // Admins and receptionist see main business view
                        MainTabView()
                    }
                } else {
                    MainTabView()
                }
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut, value: authManager.isAuthenticated)
    }
}

// MARK: - Loading View
struct LoadingView: View {
    var body: some View {
        VStack(spacing: Spacing.lg) {
            ZStack {
                Circle()
                    .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                    .frame(width: 100, height: 100)

                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                    .scaleEffect(1.5)
            }

            Text("Loading...")
                .font(.appSubheadline)
                .foregroundColor(.softGray)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.screenBackground)
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    @EnvironmentObject var appState: AppState

    init() {
        #if os(iOS)
        // Configure tab bar appearance
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBackground

        // Selected state with rose gold
        let roseGoldColor = UIColor(Color.roseGold)
        appearance.stackedLayoutAppearance.selected.iconColor = roseGoldColor
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: roseGoldColor,
            .font: UIFont.systemFont(ofSize: 10, weight: .semibold)
        ]

        // Normal state
        let softGrayColor = UIColor(Color.softGray)
        appearance.stackedLayoutAppearance.normal.iconColor = softGrayColor
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: softGrayColor,
            .font: UIFont.systemFont(ofSize: 10, weight: .medium)
        ]

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
        #endif
    }

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }
                .tag(AppState.Tab.dashboard)

            AppointmentsView()
                .tabItem {
                    Label("Appointments", systemImage: "calendar")
                }
                .tag(AppState.Tab.appointments)

            ClientsView()
                .tabItem {
                    Label("Clients", systemImage: "person.2.fill")
                }
                .tag(AppState.Tab.clients)

            POSView()
                .tabItem {
                    Label("POS", systemImage: "cart.fill")
                }
                .tag(AppState.Tab.pos)

            MoreView()
                .tabItem {
                    Label("More", systemImage: "ellipsis.circle.fill")
                }
                .tag(AppState.Tab.more)
        }
        .tint(.roseGold)
    }
}

// MARK: - Client Portal Tab View (for CLIENT role)
struct ClientPortalTabView: View {
    @State private var selectedTab: ClientTab = .appointments

    init() {
        #if os(iOS)
        // Configure tab bar appearance
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBackground

        let roseGoldColor = UIColor(Color.roseGold)
        appearance.stackedLayoutAppearance.selected.iconColor = roseGoldColor
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: roseGoldColor,
            .font: UIFont.systemFont(ofSize: 10, weight: .semibold)
        ]

        let softGrayColor = UIColor(Color.softGray)
        appearance.stackedLayoutAppearance.normal.iconColor = softGrayColor
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: softGrayColor,
            .font: UIFont.systemFont(ofSize: 10, weight: .medium)
        ]

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
        #endif
    }

    enum ClientTab: Int {
        case appointments = 0
        case rewards = 1
        case payments = 2
        case profile = 3
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            ClientAppointmentsView()
                .tabItem {
                    Label("Appointments", systemImage: "calendar")
                }
                .tag(ClientTab.appointments)

            ClientRewardsView()
                .tabItem {
                    Label("Rewards", systemImage: "gift.fill")
                }
                .tag(ClientTab.rewards)

            ClientPaymentsView()
                .tabItem {
                    Label("Payments", systemImage: "creditcard.fill")
                }
                .tag(ClientTab.payments)

            ClientProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(ClientTab.profile)
        }
        .tint(.roseGold)
    }
}

// MARK: - Client Appointments View
struct ClientAppointmentsView: View {
    @State private var selectedTab = 0
    @State private var upcomingAppointments: [ClientPortalAppointment] = []
    @State private var pastAppointments: [ClientPortalAppointment] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showBookingSheet = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("My Appointments")
                        .font(.appTitle)
                        .foregroundColor(.charcoal)
                    Spacer()
                    Button(action: { showBookingSheet = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(.roseGold)
                    }
                }
                .padding(.horizontal)
                .padding(.top)

                // Tab Picker
                Picker("", selection: $selectedTab) {
                    Text("Upcoming (\(upcomingAppointments.count))").tag(0)
                    Text("Past (\(pastAppointments.count))").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()

                if isLoading {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                    Spacer()
                } else if let error = errorMessage {
                    Spacer()
                    VStack(spacing: Spacing.md) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 50))
                            .foregroundColor(.warning)
                        Text(error)
                            .font(.appBody)
                            .foregroundColor(.softGray)
                        Button("Retry") {
                            Task { await loadAppointments() }
                        }
                        .foregroundColor(.roseGold)
                    }
                    Spacer()
                } else {
                    let appointments = selectedTab == 0 ? upcomingAppointments : pastAppointments
                    if appointments.isEmpty {
                        Spacer()
                        VStack(spacing: Spacing.md) {
                            Image(systemName: selectedTab == 0 ? "calendar.badge.clock" : "calendar.badge.checkmark")
                                .font(.system(size: 60))
                                .foregroundColor(.softGray)
                            Text(selectedTab == 0 ? "No upcoming appointments" : "No past appointments")
                                .font(.appBody)
                                .foregroundColor(.softGray)
                            if selectedTab == 0 {
                                Button(action: { showBookingSheet = true }) {
                                    Text("Book an Appointment")
                                        .font(.appHeadline)
                                        .foregroundColor(.white)
                                        .padding(.horizontal, Spacing.lg)
                                        .padding(.vertical, Spacing.md)
                                        .background(Color.roseGold)
                                        .cornerRadius(12)
                                }
                            }
                        }
                        Spacer()
                    } else {
                        ScrollView {
                            LazyVStack(spacing: Spacing.md) {
                                ForEach(appointments) { appointment in
                                    NavigationLink(destination: ClientAppointmentDetailView(appointmentId: appointment.id)) {
                                        ClientAppointmentCard(appointment: appointment)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
            .background(Color.screenBackground)
            .navigationBarHidden(true)
            .sheet(isPresented: $showBookingSheet) {
                BookAppointmentView()
            }
        }
        .task {
            await loadAppointments()
        }
        .onReceive(NotificationCenter.default.publisher(for: .appointmentDeleted)) { _ in
            Task { await loadAppointments() }
        }
        .onReceive(NotificationCenter.default.publisher(for: .appointmentCreated)) { _ in
            Task { await loadAppointments() }
        }
    }

    private func loadAppointments() async {
        isLoading = true
        errorMessage = nil
        do {
            let response = try await ClientService.shared.getMyAppointments()
            upcomingAppointments = response.upcoming
            pastAppointments = response.past
        } catch {
            errorMessage = "Failed to load appointments"
            print("Error loading appointments: \(error)")
        }
        isLoading = false
    }
}

// MARK: - Client Appointment Card
struct ClientAppointmentCard: View {
    let appointment: ClientPortalAppointment

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            // Salon name and status
            HStack {
                Text(appointment.salon.name)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                Spacer()
                Text(appointment.status)
                    .font(.appCaption)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusColor.opacity(0.15))
                    .foregroundColor(statusColor)
                    .cornerRadius(4)
            }

            // Address
            HStack(spacing: 4) {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(.softGray)
                    .font(.caption)
                Text(appointment.salon.fullAddress)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }

            Divider()

            // Date and time
            HStack(spacing: Spacing.md) {
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .foregroundColor(.roseGold)
                    Text(appointment.formattedDate)
                        .font(.appBody)
                        .foregroundColor(.charcoal)
                }
                HStack(spacing: 4) {
                    Image(systemName: "clock")
                        .foregroundColor(.roseGold)
                    Text(appointment.formattedTime)
                        .font(.appBody)
                        .foregroundColor(.charcoal)
                }
                Spacer()
            }

            // Services
            HStack {
                ForEach(appointment.services.prefix(3)) { service in
                    Text(service.name)
                        .font(.appCaption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.roseGold.opacity(0.1))
                        .foregroundColor(.roseGold)
                        .cornerRadius(4)
                }
                if appointment.services.count > 3 {
                    Text("+\(appointment.services.count - 3)")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
            }

            // Staff
            if let staff = appointment.staff {
                HStack(spacing: 4) {
                    Image(systemName: "person.fill")
                        .foregroundColor(.softGray)
                        .font(.caption)
                    Text("with \(staff.displayName)")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
            }
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(CornerRadius.md)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    private var statusColor: Color {
        switch appointment.status.uppercased() {
        case "COMPLETED": return .success
        case "CANCELLED": return .error
        case "CONFIRMED": return .success
        case "PENDING", "BOOKED": return .warning
        default: return .softGray
        }
    }
}

// MARK: - Client Appointment Detail View
struct ClientAppointmentDetailView: View {
    let appointmentId: String
    @Environment(\.dismiss) private var dismiss
    @State private var appointment: ClientAppointmentDetail?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showCancelAlert = false
    @State private var showDeleteAlert = false
    @State private var isCancelling = false
    @State private var isDeleting = false
    @State private var showRescheduleSheet = false

    var body: some View {
        ScrollView {
            if isLoading {
                VStack {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                    Spacer()
                }
                .frame(minHeight: 400)
            } else if let error = errorMessage {
                VStack(spacing: Spacing.md) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 50))
                        .foregroundColor(.warning)
                    Text(error)
                        .font(.appBody)
                        .foregroundColor(.softGray)
                }
                .frame(minHeight: 400)
            } else if let apt = appointment {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    // Status banner
                    if apt.status == "CANCELLED" {
                        HStack {
                            Image(systemName: "xmark.circle.fill")
                            Text("This appointment has been cancelled")
                        }
                        .font(.appBody)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.error)
                        .cornerRadius(CornerRadius.md)
                    }

                    // Salon info
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text(apt.salon.name)
                            .font(.appTitle2)
                            .foregroundColor(.charcoal)

                        HStack(spacing: 4) {
                            Image(systemName: "mappin.circle.fill")
                                .foregroundColor(.roseGold)
                            Text(apt.salon.fullAddress)
                                .font(.appBody)
                                .foregroundColor(.softGray)
                        }

                        if let phone = apt.salon.phone {
                            HStack(spacing: 4) {
                                Image(systemName: "phone.fill")
                                    .foregroundColor(.roseGold)
                                Text(phone)
                                    .font(.appBody)
                                    .foregroundColor(.softGray)
                            }
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.cardBackground)
                    .cornerRadius(CornerRadius.md)

                    // Date & Time
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text("Date & Time")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)

                        HStack(spacing: Spacing.lg) {
                            HStack(spacing: 8) {
                                Image(systemName: "calendar")
                                    .foregroundColor(.roseGold)
                                Text(apt.formattedDate)
                                    .font(.appBody)
                            }
                            HStack(spacing: 8) {
                                Image(systemName: "clock")
                                    .foregroundColor(.roseGold)
                                Text(apt.formattedTime)
                                    .font(.appBody)
                            }
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.cardBackground)
                    .cornerRadius(CornerRadius.md)

                    // Services
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Services")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)

                        ForEach(apt.services) { service in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(service.name)
                                        .font(.appBody)
                                        .foregroundColor(.charcoal)
                                    Text(service.formattedDuration)
                                        .font(.appCaption)
                                        .foregroundColor(.softGray)
                                }
                                Spacer()
                                Text(service.formattedPrice)
                                    .font(.appBody)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.charcoal)
                            }
                            .padding()
                            .background(Color.softGray.opacity(0.1))
                            .cornerRadius(CornerRadius.sm)
                        }

                        Divider()

                        HStack {
                            Text("Total")
                                .font(.appHeadline)
                                .foregroundColor(.charcoal)
                            Spacer()
                            Text(String(format: "$%.0f", apt.totalPrice))
                                .font(.appTitle2)
                                .foregroundColor(.roseGold)
                        }
                    }
                    .padding()
                    .background(Color.cardBackground)
                    .cornerRadius(CornerRadius.md)

                    // Staff
                    if let staff = apt.staff {
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            Text("Your Stylist")
                                .font(.appHeadline)
                                .foregroundColor(.charcoal)

                            HStack(spacing: Spacing.md) {
                                ZStack {
                                    Circle()
                                        .fill(Color.roseGold.opacity(0.2))
                                        .frame(width: 50, height: 50)
                                    Text(String(staff.displayName.prefix(1)))
                                        .font(.appHeadline)
                                        .foregroundColor(.roseGold)
                                }
                                Text(staff.displayName)
                                    .font(.appBody)
                                    .foregroundColor(.charcoal)
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.cardBackground)
                        .cornerRadius(CornerRadius.md)
                    }

                    // Action buttons
                    if apt.isUpcoming {
                        VStack(spacing: Spacing.md) {
                            // Reschedule button
                            Button(action: { showRescheduleSheet = true }) {
                                HStack {
                                    Image(systemName: "calendar.badge.clock")
                                    Text("Reschedule")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .foregroundColor(.white)
                                .background(Color.roseGold)
                                .cornerRadius(CornerRadius.md)
                            }

                            // Cancel button
                            Button(action: { showCancelAlert = true }) {
                                HStack {
                                    if isCancelling {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .error))
                                    } else {
                                        Image(systemName: "xmark.circle")
                                    }
                                    Text(isCancelling ? "Cancelling..." : "Cancel Appointment")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .foregroundColor(.error)
                                .background(Color.error.opacity(0.1))
                                .cornerRadius(CornerRadius.md)
                            }
                            .disabled(isCancelling)
                        }
                    }
                }
                .padding()
            }
        }
        .background(Color.screenBackground)
        .navigationTitle("Appointment Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(role: .destructive) {
                        showDeleteAlert = true
                    } label: {
                        Label("Delete Appointment", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .alert("Cancel Appointment", isPresented: $showCancelAlert) {
            Button("Keep Appointment", role: .cancel) {}
            Button("Cancel", role: .destructive) {
                Task { await cancelAppointment() }
            }
        } message: {
            Text("Are you sure you want to cancel this appointment?")
        }
        .alert("Delete Appointment", isPresented: $showDeleteAlert) {
            Button("Keep", role: .cancel) {}
            Button("Delete", role: .destructive) {
                Task { await deleteAppointment() }
            }
        } message: {
            Text("Are you sure you want to permanently delete this appointment? This cannot be undone.")
        }
        .sheet(isPresented: $showRescheduleSheet) {
            if let apt = appointment {
                ClientRescheduleAppointmentView(appointment: apt) {
                    showRescheduleSheet = false
                    Task { await loadAppointment() }
                }
            }
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
        .task {
            await loadAppointment()
        }
    }

    private func loadAppointment() async {
        isLoading = true
        do {
            appointment = try await ClientService.shared.getMyAppointment(id: appointmentId)
        } catch {
            errorMessage = "Failed to load appointment details"
        }
        isLoading = false
    }

    private func cancelAppointment() async {
        isCancelling = true
        do {
            appointment = try await ClientService.shared.cancelMyAppointment(id: appointmentId)
        } catch {
            print("Error cancelling appointment: \(error)")
        }
        isCancelling = false
    }

    private func deleteAppointment() async {
        isDeleting = true
        do {
            try await ClientService.shared.deleteMyAppointment(id: appointmentId)
            // Post notification to refresh appointments list
            NotificationCenter.default.post(name: .appointmentDeleted, object: nil)
            dismiss()
        } catch {
            print("Error deleting appointment: \(error)")
        }
        isDeleting = false
    }
}

// MARK: - Client Reschedule Appointment View
struct ClientRescheduleAppointmentView: View {
    let appointment: ClientAppointmentDetail
    let onComplete: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var selectedDate = Date()
    @State private var availableSlots: [BookingTimeSlot] = []
    @State private var selectedSlot: BookingTimeSlot?
    @State private var isLoadingSlots = false
    @State private var isRescheduling = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    // Current appointment info
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text("Current Appointment")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)

                        HStack(spacing: Spacing.md) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(appointment.formattedDate)
                                    .font(.appBody)
                                    .foregroundColor(.charcoal)
                                Text(appointment.formattedTime)
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                            }
                            Spacer()
                            Text(appointment.services.first?.name ?? "Service")
                                .font(.appCaption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.roseGold.opacity(0.1))
                                .foregroundColor(.roseGold)
                                .cornerRadius(4)
                        }
                    }
                    .padding()
                    .background(Color.cardBackground)
                    .cornerRadius(CornerRadius.md)

                    // Select new date
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Select New Date")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)

                        DatePicker(
                            "Date",
                            selection: $selectedDate,
                            in: Date()...,
                            displayedComponents: .date
                        )
                        .datePickerStyle(.graphical)
                        .tint(.roseGold)
                    }
                    .padding()
                    .background(Color.cardBackground)
                    .cornerRadius(CornerRadius.md)

                    // Available time slots
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Available Times")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)

                        if isLoadingSlots {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                            .padding()
                        } else if availableSlots.isEmpty {
                            Text("No available slots for this date")
                                .font(.appBody)
                                .foregroundColor(.softGray)
                                .padding()
                        } else {
                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: Spacing.sm) {
                                ForEach(availableSlots.filter { $0.available }) { slot in
                                    Button(action: { selectedSlot = slot }) {
                                        Text(slot.displayTime)
                                            .font(.appCaption)
                                            .fontWeight(.medium)
                                            .padding(.vertical, 10)
                                            .frame(maxWidth: .infinity)
                                            .background(selectedSlot?.id == slot.id ? Color.roseGold : Color.softGray.opacity(0.1))
                                            .foregroundColor(selectedSlot?.id == slot.id ? .white : .charcoal)
                                            .cornerRadius(8)
                                    }
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color.cardBackground)
                    .cornerRadius(CornerRadius.md)

                    if let error = errorMessage {
                        Text(error)
                            .font(.appCaption)
                            .foregroundColor(.error)
                            .padding()
                    }

                    // Confirm button
                    Button(action: { Task { await rescheduleAppointment() } }) {
                        HStack {
                            if isRescheduling {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            }
                            Text(isRescheduling ? "Rescheduling..." : "Confirm New Time")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(selectedSlot != nil ? Color.roseGold : Color.softGray)
                        .foregroundColor(.white)
                        .cornerRadius(CornerRadius.md)
                    }
                    .disabled(selectedSlot == nil || isRescheduling)
                }
                .padding()
            }
            .background(Color.screenBackground)
            .navigationTitle("Reschedule")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onChange(of: selectedDate) { _, _ in
                Task { await loadAvailableSlots() }
            }
            .task {
                await loadAvailableSlots()
            }
        }
    }

    private func loadAvailableSlots() async {
        guard let staffId = appointment.staff?.id else { return }
        guard let serviceId = appointment.services.first?.id else { return }

        isLoadingSlots = true
        do {
            let response = try await ClientService.shared.getAvailableSlots(
                locationId: appointment.locationId,
                serviceId: serviceId,
                date: selectedDate,
                staffId: staffId
            )
            availableSlots = response.slots.filter { $0.available }
        } catch {
            availableSlots = []
        }
        isLoadingSlots = false
    }

    private func rescheduleAppointment() async {
        guard let slot = selectedSlot else { return }

        isRescheduling = true
        errorMessage = nil

        do {
            try await ClientService.shared.rescheduleAppointment(
                id: appointment.id,
                newDate: selectedDate,
                newTime: slot.time
            )
            onComplete()
            dismiss()
        } catch {
            errorMessage = "Failed to reschedule. Please try again."
        }
        isRescheduling = false
    }
}

// MARK: - Client Payments View
struct ClientPaymentsView: View {
    @State private var selectedTab = 0
    @State private var paymentMethods: [ClientPaymentMethod] = []
    @State private var paymentHistory: [ClientPaymentHistoryItem] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showDeleteAlert = false
    @State private var methodToDelete: ClientPaymentMethod?

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                Text("Payments")
                    .font(.appTitle)
                    .foregroundColor(.charcoal)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    .padding(.top)

                // Tab Picker
                Picker("", selection: $selectedTab) {
                    Text("Payment Methods").tag(0)
                    Text("History").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()

                if isLoading {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                    Spacer()
                } else if let error = errorMessage {
                    Spacer()
                    VStack(spacing: Spacing.md) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 50))
                            .foregroundColor(.warning)
                        Text(error)
                            .font(.appBody)
                            .foregroundColor(.softGray)
                        Button("Retry") {
                            Task { await loadData() }
                        }
                        .foregroundColor(.roseGold)
                    }
                    Spacer()
                } else if selectedTab == 0 {
                    // Payment Methods Tab
                    ScrollView {
                        VStack(spacing: Spacing.md) {
                            if paymentMethods.isEmpty {
                                VStack(spacing: Spacing.md) {
                                    Image(systemName: "creditcard")
                                        .font(.system(size: 60))
                                        .foregroundColor(.softGray)
                                    Text("No payment methods saved")
                                        .font(.appBody)
                                        .foregroundColor(.softGray)
                                    Text("Add a card to make booking faster")
                                        .font(.appCaption)
                                        .foregroundColor(.softGray)
                                }
                                .padding(.top, 60)
                            } else {
                                ForEach(paymentMethods) { method in
                                    ClientPaymentMethodCard(
                                        method: method,
                                        onSetDefault: { await setDefault(method) },
                                        onDelete: {
                                            methodToDelete = method
                                            showDeleteAlert = true
                                        }
                                    )
                                }
                            }

                            // Security notice
                            HStack(spacing: 8) {
                                Image(systemName: "lock.shield.fill")
                                    .foregroundColor(.success)
                                Text("Your payment info is encrypted and secure")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                            }
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.success.opacity(0.1))
                            .cornerRadius(CornerRadius.md)
                        }
                        .padding()
                    }
                } else {
                    // Payment History Tab
                    if paymentHistory.isEmpty {
                        Spacer()
                        VStack(spacing: Spacing.md) {
                            Image(systemName: "receipt")
                                .font(.system(size: 60))
                                .foregroundColor(.softGray)
                            Text("No payment history")
                                .font(.appBody)
                                .foregroundColor(.softGray)
                        }
                        Spacer()
                    } else {
                        ScrollView {
                            LazyVStack(spacing: Spacing.md) {
                                ForEach(paymentHistory) { payment in
                                    PaymentHistoryCard(payment: payment)
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
            .background(Color.screenBackground)
            .navigationBarHidden(true)
            .alert("Delete Payment Method", isPresented: $showDeleteAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    if let method = methodToDelete {
                        Task { await deleteMethod(method) }
                    }
                }
            } message: {
                Text("Are you sure you want to remove this card?")
            }
        }
        .task {
            await loadData()
        }
    }

    private func loadData() async {
        isLoading = true
        errorMessage = nil
        do {
            async let methodsTask = ClientService.shared.getMyPaymentMethods()
            async let historyTask = ClientService.shared.getMyPaymentHistory()
            let (methods, history) = try await (methodsTask, historyTask)
            paymentMethods = methods
            paymentHistory = history
        } catch {
            errorMessage = "Failed to load payment data"
            print("Error: \(error)")
        }
        isLoading = false
    }

    private func setDefault(_ method: ClientPaymentMethod) async {
        do {
            _ = try await ClientService.shared.setDefaultPaymentMethod(id: method.id)
            paymentMethods = try await ClientService.shared.getMyPaymentMethods()
        } catch {
            print("Error setting default: \(error)")
        }
    }

    private func deleteMethod(_ method: ClientPaymentMethod) async {
        do {
            try await ClientService.shared.deletePaymentMethod(id: method.id)
            paymentMethods = try await ClientService.shared.getMyPaymentMethods()
        } catch {
            print("Error deleting: \(error)")
        }
    }
}

// MARK: - Client Payment Method Card
struct ClientPaymentMethodCard: View {
    let method: ClientPaymentMethod
    let onSetDefault: () async -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: Spacing.md) {
            // Card icon
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.roseGold.opacity(0.1))
                    .frame(width: 50, height: 35)
                Image(systemName: method.brandIcon)
                    .foregroundColor(.roseGold)
            }

            // Card details
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text("\(method.displayBrand) •••• \(method.last4)")
                        .font(.appBody)
                        .foregroundColor(.charcoal)
                    if method.isDefault {
                        Text("Default")
                            .font(.appCaption)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.roseGold.opacity(0.15))
                            .foregroundColor(.roseGold)
                            .cornerRadius(4)
                    }
                }
                Text("Expires \(method.expiryDate)")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }

            Spacer()

            // Actions
            if !method.isDefault {
                Button(action: { Task { await onSetDefault() } }) {
                    Image(systemName: "checkmark.circle")
                        .foregroundColor(.roseGold)
                }
            }

            Button(action: onDelete) {
                Image(systemName: "trash")
                    .foregroundColor(.error)
            }
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(CornerRadius.md)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Payment History Card
struct PaymentHistoryCard: View {
    let payment: ClientPaymentHistoryItem

    var body: some View {
        HStack(spacing: Spacing.md) {
            // Icon
            ZStack {
                Circle()
                    .fill(statusColor.opacity(0.15))
                    .frame(width: 44, height: 44)
                Image(systemName: "receipt")
                    .foregroundColor(statusColor)
            }

            // Details
            VStack(alignment: .leading, spacing: 2) {
                Text(payment.description)
                    .font(.appBody)
                    .foregroundColor(.charcoal)
                HStack(spacing: 4) {
                    Text(payment.formattedDate)
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    if let last4 = payment.last4, let brand = payment.brand {
                        Text("• \(brand.capitalized) \(last4)")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                    }
                }
            }

            Spacer()

            // Amount and status
            VStack(alignment: .trailing, spacing: 2) {
                Text(payment.formattedAmount)
                    .font(.appBody)
                    .fontWeight(.semibold)
                    .foregroundColor(.charcoal)
                Text(payment.status.capitalized)
                    .font(.appCaption)
                    .foregroundColor(statusColor)
            }
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(CornerRadius.md)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    private var statusColor: Color {
        switch payment.status.lowercased() {
        case "succeeded": return .success
        case "failed": return .error
        default: return .warning
        }
    }
}

// MARK: - Client Profile View
struct ClientProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var profile: ClientPortalProfile?
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showingLogoutAlert = false
    @State private var showingDeleteAccountAlert = false
    @State private var showingDeleteConfirmation = false
    @State private var deleteConfirmationText = ""
    @State private var isDeleting = false

    // Editable fields
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var phone = ""
    @State private var birthday: Date = Date()
    @State private var hasBirthday = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Header
                    Text("My Profile")
                        .font(.appTitle)
                        .foregroundColor(.charcoal)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)

                    if isLoading {
                        Spacer()
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                        Spacer()
                    } else {
                        // Avatar
                        ZStack {
                            Circle()
                                .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                                .frame(width: 100, height: 100)
                            Text(profile?.initials ?? authManager.currentUser?.initials ?? "")
                                .font(.appTitle)
                                .foregroundColor(.roseGold)
                        }

                        Text(profile?.fullName ?? authManager.currentUser?.name ?? "")
                            .font(.appTitle2)
                            .foregroundColor(.charcoal)

                        // Profile Form
                        VStack(alignment: .leading, spacing: Spacing.lg) {
                            // First Name
                            VStack(alignment: .leading, spacing: 4) {
                                Text("First Name")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                                TextField("First name", text: $firstName)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }

                            // Last Name
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Last Name")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                                TextField("Last name", text: $lastName)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }

                            // Email (read-only)
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Email")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                                Text(profile?.email ?? authManager.currentUser?.email ?? "")
                                    .font(.appBody)
                                    .foregroundColor(.charcoal)
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.softGray.opacity(0.1))
                                    .cornerRadius(8)
                                Text("Email cannot be changed")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                            }

                            // Phone
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Phone Number")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                                TextField("(555) 123-4567", text: $phone)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .keyboardType(.phonePad)
                            }

                            // Birthday
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Birthday")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                                DatePicker("", selection: $birthday, displayedComponents: .date)
                                    .datePickerStyle(CompactDatePickerStyle())
                                    .labelsHidden()
                                Text("We'll send you a special treat!")
                                    .font(.appCaption)
                                    .foregroundColor(.roseGold)
                            }

                            // Save Button
                            Button(action: saveProfile) {
                                HStack {
                                    if isSaving {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                            .scaleEffect(0.8)
                                    } else {
                                        Image(systemName: "checkmark")
                                    }
                                    Text(isSaving ? "Saving..." : "Save Changes")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.roseGold)
                                .foregroundColor(.white)
                                .cornerRadius(CornerRadius.md)
                            }
                            .disabled(isSaving)
                        }
                        .padding()
                        .background(Color.cardBackground)
                        .cornerRadius(CornerRadius.md)
                        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                        .padding(.horizontal)

                        // Sign Out
                        Button(action: { showingLogoutAlert = true }) {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                Text("Sign Out")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .foregroundColor(.error)
                            .background(Color.error.opacity(0.1))
                            .cornerRadius(CornerRadius.md)
                        }
                        .padding(.horizontal)

                        // Delete Account
                        Button(action: { showingDeleteAccountAlert = true }) {
                            HStack {
                                Image(systemName: "trash")
                                Text("Delete Account")
                                if isDeleting {
                                    Spacer()
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .error))
                                        .scaleEffect(0.8)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .foregroundColor(.error)
                            .background(Color.error.opacity(0.05))
                            .cornerRadius(CornerRadius.md)
                        }
                        .disabled(isDeleting)
                        .padding(.horizontal)

                        Text("Permanently delete your account and all associated data.")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                            .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .background(Color.screenBackground)
            .navigationBarHidden(true)
            .alert("Sign Out", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    Task { await authManager.logout() }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
            .alert("Delete Account", isPresented: $showingDeleteAccountAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete Account", role: .destructive) {
                    showingDeleteConfirmation = true
                }
            } message: {
                Text("Are you sure you want to permanently delete your account? This will remove all your data including appointments, rewards, and payment information. This action cannot be undone.")
            }
            .alert("Confirm Deletion", isPresented: $showingDeleteConfirmation) {
                TextField("Type DELETE to confirm", text: $deleteConfirmationText)
                Button("Cancel", role: .cancel) {
                    deleteConfirmationText = ""
                }
                Button("Delete Forever", role: .destructive) {
                    if deleteConfirmationText.uppercased() == "DELETE" {
                        Task {
                            isDeleting = true
                            await authManager.deleteAccount()
                            isDeleting = false
                            deleteConfirmationText = ""
                        }
                    }
                }
                .disabled(deleteConfirmationText.uppercased() != "DELETE")
            } message: {
                Text("This is your final confirmation. Type DELETE to permanently remove your account.")
            }
        }
        .task {
            await loadProfile()
        }
    }

    private func loadProfile() async {
        isLoading = true
        do {
            let loadedProfile = try await ClientService.shared.getMyProfile()
            profile = loadedProfile
            firstName = loadedProfile.firstName
            lastName = loadedProfile.lastName
            phone = loadedProfile.phone ?? ""
            if let bday = loadedProfile.birthday {
                birthday = bday
                hasBirthday = true
            }
        } catch {
            // Use auth manager user as fallback
            if let user = authManager.currentUser {
                firstName = user.firstName
                lastName = user.lastName
                phone = user.phone ?? ""
            }
        }
        isLoading = false
    }

    private func saveProfile() {
        isSaving = true
        Task {
            do {
                let updated = try await ClientService.shared.updateMyProfile(
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone.isEmpty ? nil : phone,
                    birthday: birthday
                )
                profile = updated
            } catch {
                print("Error saving profile: \(error)")
            }
            isSaving = false
        }
    }
}

// MARK: - Client Rewards View
struct ClientRewardsView: View {
    @State private var loyaltyAccount: ClientLoyaltyAccount?
    @State private var rewards: [ClientReward] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showRedeemAlert = false
    @State private var rewardToRedeem: ClientReward?
    @State private var isRedeeming = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Header
                    Text("My Rewards")
                        .font(.appTitle)
                        .foregroundColor(.charcoal)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)

                    if isLoading {
                        Spacer()
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                        Spacer()
                    } else if let error = errorMessage {
                        VStack(spacing: Spacing.md) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 50))
                                .foregroundColor(.warning)
                            Text(error)
                                .font(.appBody)
                                .foregroundColor(.softGray)
                            Button("Retry") {
                                Task { await loadData() }
                            }
                            .foregroundColor(.roseGold)
                        }
                        .padding(.top, 60)
                    } else {
                        // Points Card
                        if let account = loyaltyAccount {
                            VStack(spacing: Spacing.md) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(account.tier)
                                            .font(.appCaption)
                                            .fontWeight(.semibold)
                                            .foregroundColor(.white.opacity(0.8))
                                        Text("\(account.pointsBalance)")
                                            .font(.system(size: 48, weight: .bold))
                                            .foregroundColor(.white)
                                        Text("Points Available")
                                            .font(.appBody)
                                            .foregroundColor(.white.opacity(0.8))
                                    }
                                    Spacer()
                                    Image(systemName: "trophy.fill")
                                        .font(.system(size: 50))
                                        .foregroundColor(.white.opacity(0.3))
                                }

                                Divider()
                                    .background(Color.white.opacity(0.3))

                                HStack {
                                    Text("Lifetime Points:")
                                        .font(.appCaption)
                                        .foregroundColor(.white.opacity(0.8))
                                    Text("\(account.lifetimePoints)")
                                        .font(.appBody)
                                        .fontWeight(.semibold)
                                        .foregroundColor(.white)
                                }
                            }
                            .padding()
                            .background(
                                LinearGradient(
                                    colors: [Color.roseGold, Color.champagneGold],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .cornerRadius(CornerRadius.lg)
                            .padding(.horizontal)
                        }

                        // How to Earn Section
                        VStack(alignment: .leading, spacing: Spacing.md) {
                            Text("How to Earn")
                                .font(.appHeadline)
                                .foregroundColor(.charcoal)

                            HStack(spacing: Spacing.lg) {
                                EarnMethodCard(icon: "calendar", title: "Book Services", description: "1 point per $1")
                                EarnMethodCard(icon: "person.2", title: "Refer Friends", description: "100 points")
                                EarnMethodCard(icon: "gift", title: "Birthday", description: "50 points")
                            }
                        }
                        .padding()
                        .background(Color.cardBackground)
                        .cornerRadius(CornerRadius.md)
                        .padding(.horizontal)

                        // Available Rewards
                        VStack(alignment: .leading, spacing: Spacing.md) {
                            Text("Available Rewards")
                                .font(.appHeadline)
                                .foregroundColor(.charcoal)
                                .padding(.horizontal)

                            if rewards.isEmpty {
                                VStack(spacing: Spacing.md) {
                                    Image(systemName: "gift")
                                        .font(.system(size: 40))
                                        .foregroundColor(.softGray)
                                    Text("No rewards available yet")
                                        .font(.appBody)
                                        .foregroundColor(.softGray)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 40)
                            } else {
                                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: Spacing.md) {
                                    ForEach(rewards) { reward in
                                        RewardCard(
                                            reward: reward,
                                            canRedeem: (loyaltyAccount?.pointsBalance ?? 0) >= reward.pointsCost,
                                            onRedeem: {
                                                rewardToRedeem = reward
                                                showRedeemAlert = true
                                            }
                                        )
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                    }
                }
                .padding(.vertical)
            }
            .background(Color.screenBackground)
            .navigationBarHidden(true)
            .alert("Redeem Reward", isPresented: $showRedeemAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Redeem") {
                    if let reward = rewardToRedeem {
                        Task { await redeemReward(reward) }
                    }
                }
            } message: {
                if let reward = rewardToRedeem {
                    Text("Redeem \(reward.name) for \(reward.pointsCost) points?")
                }
            }
        }
        .task {
            await loadData()
        }
    }

    private func loadData() async {
        isLoading = true
        errorMessage = nil
        do {
            async let accountTask = ClientService.shared.getMyLoyaltyAccount()
            async let rewardsTask = ClientService.shared.getAvailableRewards()
            let (account, loadedRewards) = try await (accountTask, rewardsTask)
            loyaltyAccount = account
            rewards = loadedRewards
        } catch {
            errorMessage = "Failed to load rewards"
            print("Error: \(error)")
        }
        isLoading = false
    }

    private func redeemReward(_ reward: ClientReward) async {
        isRedeeming = true
        do {
            let response = try await ClientService.shared.redeemReward(id: reward.id)
            if response.success {
                // Reload data to get updated points
                await loadData()
            }
        } catch {
            print("Error redeeming: \(error)")
        }
        isRedeeming = false
    }
}

// MARK: - Earn Method Card
struct EarnMethodCard: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.roseGold)
            Text(title)
                .font(.appCaption)
                .fontWeight(.semibold)
                .foregroundColor(.charcoal)
                .multilineTextAlignment(.center)
            Text(description)
                .font(.appCaption)
                .foregroundColor(.softGray)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Reward Card
struct RewardCard: View {
    let reward: ClientReward
    let canRedeem: Bool
    let onRedeem: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            // Reward icon
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.roseGold.opacity(0.1))
                    .frame(height: 80)
                Image(systemName: "gift.fill")
                    .font(.system(size: 30))
                    .foregroundColor(.roseGold)
            }

            Text(reward.name)
                .font(.appBody)
                .fontWeight(.semibold)
                .foregroundColor(.charcoal)
                .lineLimit(2)

            if let description = reward.description, !description.isEmpty {
                Text(description)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
                    .lineLimit(2)
            }

            HStack {
                Text("\(reward.pointsCost) pts")
                    .font(.appCaption)
                    .fontWeight(.semibold)
                    .foregroundColor(.roseGold)
                Spacer()
            }

            Button(action: onRedeem) {
                Text("Redeem")
                    .font(.appCaption)
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(canRedeem ? Color.roseGold : Color.softGray.opacity(0.3))
                    .foregroundColor(canRedeem ? .white : .softGray)
                    .cornerRadius(6)
            }
            .disabled(!canRedeem)
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(CornerRadius.md)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Book Appointment View
struct BookAppointmentView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var currentStep = 0
    @State private var locations: [BookingLocation] = []
    @State private var selectedLocation: BookingLocation?
    @State private var services: [BookingService] = []
    @State private var selectedServices: [BookingService] = []
    @State private var availableStylists: [BookingStaff] = []
    @State private var selectedStylist: BookingStaff?
    @State private var selectedDate = Date()
    @State private var availableSlots: [BookingTimeSlot] = []
    @State private var selectedSlot: BookingTimeSlot?
    @State private var isLoading = true
    @State private var isLoadingStylists = false
    @State private var isLoadingSlots = false
    @State private var isBooking = false
    @State private var errorMessage: String?
    @State private var bookingSuccess = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Progress indicator (5 steps: Location, Services, Stylist, Date/Time, Confirm)
                HStack(spacing: 4) {
                    ForEach(0..<5) { step in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(step <= currentStep ? Color.roseGold : Color.softGray.opacity(0.3))
                            .frame(height: 4)
                    }
                }
                .padding()

                if bookingSuccess {
                    // Success view
                    VStack(spacing: Spacing.lg) {
                        Spacer()
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.success)
                        Text("Booking Confirmed!")
                            .font(.appTitle)
                            .foregroundColor(.charcoal)
                        Text("You'll receive a confirmation email shortly.")
                            .font(.appBody)
                            .foregroundColor(.softGray)
                            .multilineTextAlignment(.center)
                        Spacer()
                        Button("Done") {
                            dismiss()
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.roseGold)
                        .foregroundColor(.white)
                        .cornerRadius(CornerRadius.md)
                        .padding(.horizontal)
                    }
                } else if isLoading {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                    Spacer()
                } else {
                    // Step content
                    switch currentStep {
                    case 0:
                        LocationSelectionStep(locations: locations, selectedLocation: $selectedLocation)
                    case 1:
                        ServiceSelectionStep(services: services, selectedServices: $selectedServices)
                    case 2:
                        StylistSelectionStep(
                            stylists: availableStylists,
                            selectedStylist: $selectedStylist,
                            isLoading: isLoadingStylists
                        )
                    case 3:
                        DateTimeSelectionStepSimple(
                            selectedDate: $selectedDate,
                            availableSlots: availableSlots,
                            selectedSlot: $selectedSlot,
                            isLoading: isLoadingSlots,
                            onDateChange: { await loadSlots() }
                        )
                    case 4:
                        BookingConfirmationStep(
                            location: selectedLocation,
                            services: selectedServices,
                            stylist: selectedStylist,
                            date: selectedDate,
                            slot: selectedSlot
                        )
                    default:
                        EmptyView()
                    }

                    Spacer()

                    // Navigation buttons
                    HStack(spacing: Spacing.md) {
                        if currentStep > 0 {
                            Button("Back") {
                                currentStep -= 1
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.softGray.opacity(0.2))
                            .foregroundColor(.charcoal)
                            .cornerRadius(CornerRadius.md)
                        }

                        Button(nextButtonTitle) {
                            if currentStep == 4 {
                                Task { await createBooking() }
                            } else {
                                nextStep()
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(canProceed ? Color.roseGold : Color.softGray.opacity(0.3))
                        .foregroundColor(canProceed ? .white : .softGray)
                        .cornerRadius(CornerRadius.md)
                        .disabled(!canProceed || isBooking || isLoadingSlots)
                    }
                    .padding()
                }
            }
            .background(Color.screenBackground)
            .navigationTitle(stepTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .task {
            await loadLocations()
        }
        .onChange(of: selectedLocation) {
            print("DEBUG onChange: selectedLocation changed to \(selectedLocation?.name ?? "nil")")
            if selectedLocation != nil {
                Task { await loadServices() }
            }
        }
        .onChange(of: selectedServices) {
            print("DEBUG onChange: selectedServices changed, count=\(selectedServices.count)")
            // Slots will be loaded when entering step 2
        }
    }

    private var stepTitle: String {
        switch currentStep {
        case 0: return "Select Location"
        case 1: return "Select Services"
        case 2: return "Select Stylist"
        case 3: return "Select Date & Time"
        case 4: return "Confirm Booking"
        default: return "Book Appointment"
        }
    }

    private var nextButtonTitle: String {
        if currentStep == 4 {
            return isBooking ? "Booking..." : "Confirm Booking"
        }
        if currentStep == 1 && isLoadingStylists {
            return "Loading..."
        }
        if currentStep == 2 && isLoadingSlots {
            return "Loading..."
        }
        return "Next"
    }

    private var canProceed: Bool {
        switch currentStep {
        case 0: return selectedLocation != nil
        case 1: return !selectedServices.isEmpty
        case 2: return selectedStylist != nil
        case 3: return selectedSlot != nil
        case 4: return true
        default: return false
        }
    }

    private func nextStep() {
        if currentStep < 4 {
            // When moving from step 1 to step 2, load available stylists
            if currentStep == 1 {
                print("DEBUG nextStep: moving to step 2, loading stylists")
                currentStep = 2
                Task {
                    await loadStylists()
                }
                return
            }
            // When moving from step 2 to step 3, load available slots
            if currentStep == 2 {
                print("DEBUG nextStep: moving to step 3, loading slots")
                currentStep = 3
                Task {
                    await loadSlots()
                }
                return
            }
            currentStep += 1
            print("DEBUG nextStep: moved to step \(currentStep)")
        }
    }

    private func loadLocations() async {
        isLoading = true
        do {
            locations = try await ClientService.shared.getBookingLocations()
        } catch {
            errorMessage = "Failed to load locations"
        }
        isLoading = false
    }

    private func loadServices() async {
        guard let location = selectedLocation else { return }
        do {
            services = try await ClientService.shared.getLocationServices(locationId: location.id)
        } catch {
            print("Error loading services: \(error)")
        }
    }

    private func loadStylists() async {
        guard let location = selectedLocation else {
            print("DEBUG loadStylists: missing location")
            return
        }
        isLoadingStylists = true
        let serviceId = selectedServices.first?.id
        print("DEBUG loadStylists: loading for location=\(location.id), serviceId=\(serviceId ?? "nil")")
        do {
            availableStylists = try await ClientService.shared.getLocationStaff(locationId: location.id, serviceId: serviceId)
            print("DEBUG loadStylists: got \(availableStylists.count) stylists")
            for stylist in availableStylists {
                print("DEBUG loadStylists: - \(stylist.displayName)")
            }
        } catch {
            print("Error loading stylists: \(error)")
            availableStylists = []
        }
        isLoadingStylists = false
    }

    private func loadSlots() async {
        guard let location = selectedLocation,
              let service = selectedServices.first,
              let stylist = selectedStylist else {
            print("DEBUG loadSlots: missing location, service, or stylist")
            return
        }
        isLoadingSlots = true
        print("DEBUG loadSlots: loading for location=\(location.id), service=\(service.id), stylist=\(stylist.id), date=\(selectedDate)")
        do {
            // Pass the selected stylist ID to filter slots for that specific stylist
            let response = try await ClientService.shared.getAvailableSlots(
                locationId: location.id,
                serviceId: service.id,
                date: selectedDate,
                staffId: stylist.id
            )
            availableSlots = response.slots.filter { $0.available }
            print("DEBUG loadSlots: got \(availableSlots.count) available slots for \(stylist.displayName)")
        } catch {
            print("Error loading slots: \(error)")
            availableSlots = []
        }
        isLoadingSlots = false
    }

    private func createBooking() async {
        guard let location = selectedLocation,
              let stylist = selectedStylist,
              let slot = selectedSlot else { return }

        isBooking = true
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateString = dateFormatter.string(from: selectedDate)

        let request = ClientCreateAppointmentRequest(
            locationId: location.id,
            staffId: stylist.id,
            serviceIds: selectedServices.map { $0.id },
            scheduledStart: "\(dateString)T\(slot.time):00",
            notes: nil,
            paymentMethodId: nil
        )

        do {
            _ = try await ClientService.shared.createAppointment(request: request)
            bookingSuccess = true
            // Post notification to refresh appointments list
            NotificationCenter.default.post(name: .appointmentCreated, object: nil)
        } catch {
            errorMessage = "Failed to create booking"
            print("Error: \(error)")
        }
        isBooking = false
    }
}

// MARK: - Location Selection Step
struct LocationSelectionStep: View {
    let locations: [BookingLocation]
    @Binding var selectedLocation: BookingLocation?

    var body: some View {
        ScrollView {
            LazyVStack(spacing: Spacing.md) {
                ForEach(locations) { location in
                    Button(action: { selectedLocation = location }) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(location.name)
                                    .font(.appBody)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.charcoal)
                                Text(location.fullAddress)
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                                if let rating = location.rating {
                                    HStack(spacing: 4) {
                                        Image(systemName: "star.fill")
                                            .foregroundColor(.warning)
                                            .font(.caption)
                                        Text(String(format: "%.1f", rating))
                                            .font(.appCaption)
                                            .foregroundColor(.charcoal)
                                    }
                                }
                            }
                            Spacer()
                            if selectedLocation?.id == location.id {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.roseGold)
                            }
                        }
                        .padding()
                        .background(Color.cardBackground)
                        .cornerRadius(CornerRadius.md)
                        .overlay(
                            RoundedRectangle(cornerRadius: CornerRadius.md)
                                .stroke(selectedLocation?.id == location.id ? Color.roseGold : Color.clear, lineWidth: 2)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding()
        }
    }
}

// MARK: - Service Selection Step
struct ServiceSelectionStep: View {
    let services: [BookingService]
    @Binding var selectedServices: [BookingService]

    var body: some View {
        ScrollView {
            LazyVStack(spacing: Spacing.md) {
                ForEach(services) { service in
                    Button(action: { toggleService(service) }) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(service.name)
                                    .font(.appBody)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.charcoal)
                                if let desc = service.description {
                                    Text(desc)
                                        .font(.appCaption)
                                        .foregroundColor(.softGray)
                                        .lineLimit(2)
                                }
                                HStack {
                                    Text(service.formattedDuration)
                                        .font(.appCaption)
                                        .foregroundColor(.softGray)
                                    Text("•")
                                        .foregroundColor(.softGray)
                                    Text(service.formattedPrice)
                                        .font(.appCaption)
                                        .fontWeight(.semibold)
                                        .foregroundColor(.roseGold)
                                }
                            }
                            Spacer()
                            if selectedServices.contains(where: { $0.id == service.id }) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.roseGold)
                            } else {
                                Image(systemName: "circle")
                                    .foregroundColor(.softGray)
                            }
                        }
                        .padding()
                        .background(Color.cardBackground)
                        .cornerRadius(CornerRadius.md)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding()
        }
    }

    private func toggleService(_ service: BookingService) {
        if let index = selectedServices.firstIndex(where: { $0.id == service.id }) {
            selectedServices.remove(at: index)
        } else {
            selectedServices.append(service)
        }
    }
}

// MARK: - Stylist Selection Step
struct StylistSelectionStep: View {
    let stylists: [BookingStaff]
    @Binding var selectedStylist: BookingStaff?
    let isLoading: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                Text("Choose Your Stylist")
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                    .padding(.horizontal)

                if isLoading {
                    HStack {
                        Spacer()
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                        Text("Loading stylists...")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                        Spacer()
                    }
                    .padding()
                } else if stylists.isEmpty {
                    Text("No stylists available")
                        .font(.appBody)
                        .foregroundColor(.softGray)
                        .padding()
                } else {
                    LazyVStack(spacing: Spacing.md) {
                        ForEach(stylists) { stylist in
                            Button(action: { selectedStylist = stylist }) {
                                HStack(spacing: Spacing.md) {
                                    // Avatar
                                    if let photoUrl = stylist.photo, let url = URL(string: photoUrl) {
                                        AsyncImage(url: url) { image in
                                            image
                                                .resizable()
                                                .aspectRatio(contentMode: .fill)
                                        } placeholder: {
                                            Circle()
                                                .fill(Color.roseGold.opacity(0.2))
                                                .overlay(
                                                    Text(String(stylist.displayName.prefix(1)))
                                                        .font(.appTitle2)
                                                        .foregroundColor(.roseGold)
                                                )
                                        }
                                        .frame(width: 60, height: 60)
                                        .clipShape(Circle())
                                    } else {
                                        Circle()
                                            .fill(Color.roseGold.opacity(0.2))
                                            .frame(width: 60, height: 60)
                                            .overlay(
                                                Text(String(stylist.displayName.prefix(1)))
                                                    .font(.appTitle2)
                                                    .foregroundColor(.roseGold)
                                            )
                                    }

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(stylist.displayName)
                                            .font(.appBody)
                                            .fontWeight(.semibold)
                                            .foregroundColor(.charcoal)
                                        if let title = stylist.title {
                                            Text(title)
                                                .font(.appCaption)
                                                .foregroundColor(.softGray)
                                        }
                                    }

                                    Spacer()

                                    if selectedStylist?.id == stylist.id {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.roseGold)
                                            .font(.title2)
                                    } else {
                                        Image(systemName: "circle")
                                            .foregroundColor(.softGray)
                                            .font(.title2)
                                    }
                                }
                                .padding()
                                .background(selectedStylist?.id == stylist.id ? Color.roseGold.opacity(0.1) : Color.cardBackground)
                                .cornerRadius(CornerRadius.md)
                                .overlay(
                                    RoundedRectangle(cornerRadius: CornerRadius.md)
                                        .stroke(selectedStylist?.id == stylist.id ? Color.roseGold : Color.clear, lineWidth: 2)
                                )
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding()
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - Date & Time Selection Step (Simple - stylist already selected)
struct DateTimeSelectionStepSimple: View {
    @Binding var selectedDate: Date
    let availableSlots: [BookingTimeSlot]
    @Binding var selectedSlot: BookingTimeSlot?
    let isLoading: Bool
    let onDateChange: () async -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                // Date selection
                Text("Select Date")
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                    .padding(.horizontal)

                DatePicker("", selection: $selectedDate, in: Date()..., displayedComponents: .date)
                    .datePickerStyle(GraphicalDatePickerStyle())
                    .padding(.horizontal)
                    .onChange(of: selectedDate) {
                        selectedSlot = nil
                        Task { await onDateChange() }
                    }

                // Time slots
                Text("Available Times")
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                    .padding(.horizontal)

                if isLoading {
                    HStack {
                        Spacer()
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                        Text("Loading available times...")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                        Spacer()
                    }
                    .padding()
                } else if availableSlots.isEmpty {
                    Text("No available times for this date")
                        .font(.appBody)
                        .foregroundColor(.softGray)
                        .padding()
                } else {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 80))], spacing: 8) {
                        ForEach(availableSlots) { slot in
                            Button(action: {
                                selectedSlot = slot
                            }) {
                                Text(slot.displayTime)
                                    .font(.appCaption)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(selectedSlot?.id == slot.id ? Color.roseGold : Color.cardBackground)
                                    .foregroundColor(selectedSlot?.id == slot.id ? .white : .charcoal)
                                    .cornerRadius(6)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - Date & Time Selection Step (with staff selection - legacy)
struct DateTimeSelectionStep: View {
    @Binding var selectedDate: Date
    let availableSlots: [BookingTimeSlot]
    @Binding var selectedSlot: BookingTimeSlot?
    @Binding var selectedStaff: AvailableStaff?
    let isLoading: Bool
    let onDateChange: () async -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                // Date selection
                Text("Select Date")
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                    .padding(.horizontal)

                DatePicker("", selection: $selectedDate, in: Date()..., displayedComponents: .date)
                    .datePickerStyle(GraphicalDatePickerStyle())
                    .padding(.horizontal)
                    .onChange(of: selectedDate) {
                        selectedSlot = nil
                        selectedStaff = nil
                        Task { await onDateChange() }
                    }

                // Time slots
                Text("Available Times")
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                    .padding(.horizontal)

                if isLoading {
                    HStack {
                        Spacer()
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                        Text("Loading available times...")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                        Spacer()
                    }
                    .padding()
                } else if availableSlots.isEmpty {
                    Text("No available times for this date")
                        .font(.appBody)
                        .foregroundColor(.softGray)
                        .padding()
                } else {
                    let _ = print("DEBUG DateTimeSelectionStep: showing \(availableSlots.count) slots")
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 80))], spacing: 8) {
                        ForEach(availableSlots) { slot in
                            Button(action: {
                                print("DEBUG DateTimeSelectionStep: tapped slot \(slot.time), availableStaff count: \(slot.availableStaff.count)")
                                selectedSlot = slot
                                selectedStaff = nil  // Reset staff when time changes
                            }) {
                                Text(slot.displayTime)
                                    .font(.appCaption)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(selectedSlot?.id == slot.id ? Color.roseGold : Color.cardBackground)
                                    .foregroundColor(selectedSlot?.id == slot.id ? .white : .charcoal)
                                    .cornerRadius(6)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding(.horizontal)
                }

                // Debug: show selected slot info
                Text("Selected: \(selectedSlot?.time ?? "none") - Staff: \(selectedSlot?.availableStaff.count ?? 0)")
                    .font(.appCaption)
                    .foregroundColor(.red)
                    .padding(.horizontal)

                // Staff selection (only shown after selecting a time slot)
                if let slot = selectedSlot {
                    let _ = print("DEBUG DateTimeSelectionStep: selectedSlot=\(slot.time), staffCount=\(slot.availableStaff.count)")
                    Text("Select Stylist")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)
                        .padding(.horizontal)
                        .padding(.top, Spacing.md)

                    if slot.availableStaff.isEmpty {
                        let _ = print("DEBUG DateTimeSelectionStep: NO STAFF AVAILABLE")
                        Text("No stylists available for this time")
                            .font(.appBody)
                            .foregroundColor(.softGray)
                            .padding(.horizontal)
                    } else {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: Spacing.md) {
                                ForEach(slot.availableStaff) { staff in
                                    Button(action: { selectedStaff = staff }) {
                                        VStack(spacing: 8) {
                                            ZStack {
                                                Circle()
                                                    .fill(Color(hex: staff.color).opacity(0.2))
                                                    .frame(width: 60, height: 60)
                                                Text(staff.initials)
                                                    .font(.appTitle2)
                                                    .foregroundColor(Color(hex: staff.color))
                                            }
                                            .overlay(
                                                Circle()
                                                    .stroke(selectedStaff?.id == staff.id ? Color.roseGold : Color.clear, lineWidth: 3)
                                            )
                                            Text(staff.fullName)
                                                .font(.appCaption)
                                                .foregroundColor(.charcoal)
                                                .lineLimit(1)
                                        }
                                        .frame(width: 80)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - Booking Confirmation Step
struct BookingConfirmationStep: View {
    let location: BookingLocation?
    let services: [BookingService]
    let stylist: BookingStaff?
    let date: Date
    let slot: BookingTimeSlot?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                // Location
                VStack(alignment: .leading, spacing: 8) {
                    Label("Location", systemImage: "mappin.circle.fill")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    Text(location?.name ?? "")
                        .font(.appBody)
                        .foregroundColor(.charcoal)
                    Text(location?.fullAddress ?? "")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.cardBackground)
                .cornerRadius(CornerRadius.md)

                // Date & Time
                VStack(alignment: .leading, spacing: 8) {
                    Label("Date & Time", systemImage: "calendar")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    Text(date.formatted(date: .long, time: .omitted))
                        .font(.appBody)
                        .foregroundColor(.charcoal)
                    Text(slot?.displayTime ?? "")
                        .font(.appBody)
                        .foregroundColor(.charcoal)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.cardBackground)
                .cornerRadius(CornerRadius.md)

                // Services
                VStack(alignment: .leading, spacing: 8) {
                    Label("Services", systemImage: "scissors")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    ForEach(services) { service in
                        HStack {
                            Text(service.name)
                                .font(.appBody)
                                .foregroundColor(.charcoal)
                            Spacer()
                            Text(service.formattedPrice)
                                .font(.appBody)
                                .foregroundColor(.roseGold)
                        }
                    }
                    Divider()
                    HStack {
                        Text("Total")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)
                        Spacer()
                        Text(String(format: "$%.2f", services.reduce(0) { $0 + $1.price }))
                            .font(.appTitle2)
                            .foregroundColor(.roseGold)
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.cardBackground)
                .cornerRadius(CornerRadius.md)

                // Stylist
                if let stylist = stylist {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Stylist", systemImage: "person.fill")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                        Text(stylist.displayName)
                            .font(.appBody)
                            .foregroundColor(.charcoal)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.cardBackground)
                    .cornerRadius(CornerRadius.md)
                }
            }
            .padding()
        }
    }
}

// MARK: - Staff Portal Tab View (for STAFF role)
struct StaffPortalTabView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var selectedTab: StaffTab = .schedule
    @State private var showingLogoutAlert = false

    init() {
        #if os(iOS)
        // Configure tab bar appearance
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBackground

        let roseGoldColor = UIColor(Color.roseGold)
        appearance.stackedLayoutAppearance.selected.iconColor = roseGoldColor
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: roseGoldColor,
            .font: UIFont.systemFont(ofSize: 10, weight: .semibold)
        ]

        let softGrayColor = UIColor(Color.softGray)
        appearance.stackedLayoutAppearance.normal.iconColor = softGrayColor
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: softGrayColor,
            .font: UIFont.systemFont(ofSize: 10, weight: .medium)
        ]

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
        #endif
    }

    enum StaffTab: Int {
        case schedule = 0
        case clients = 1
        case earnings = 2
        case settings = 3
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            StaffScheduleView()
                .tabItem {
                    Label("My Schedule", systemImage: "calendar")
                }
                .tag(StaffTab.schedule)

            StaffClientsView()
                .tabItem {
                    Label("My Clients", systemImage: "person.2.fill")
                }
                .tag(StaffTab.clients)

            StaffEarningsView()
                .tabItem {
                    Label("My Earnings", systemImage: "dollarsign.circle.fill")
                }
                .tag(StaffTab.earnings)

            StaffSettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(StaffTab.settings)
        }
        .tint(.roseGold)
    }
}

// MARK: - Staff Schedule View
struct StaffScheduleView: View {
    @State private var staffProfile: StaffProfile?
    @State private var schedules: [StaffWorkingSchedule] = []
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var errorMessage: String?

    private let dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("My Schedule")
                        .font(.appTitle)
                        .foregroundColor(.charcoal)
                    Spacer()
                    Button(action: saveSchedule) {
                        HStack(spacing: 4) {
                            if isSaving {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.7)
                            } else {
                                Image(systemName: "checkmark")
                            }
                            Text(isSaving ? "Saving..." : "Save")
                        }
                        .font(.appCaption)
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.roseGold)
                        .cornerRadius(8)
                    }
                    .disabled(isSaving || staffProfile == nil)
                }
                .padding(.horizontal)
                .padding(.top)

                Text("Set your working hours for the week")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    .padding(.top, 4)

                if isLoading {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                    Spacer()
                } else if let error = errorMessage {
                    Spacer()
                    VStack(spacing: Spacing.md) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 50))
                            .foregroundColor(.warning)
                        Text(error)
                            .font(.appBody)
                            .foregroundColor(.softGray)
                            .multilineTextAlignment(.center)
                        Button("Retry") {
                            Task { await loadData() }
                        }
                        .foregroundColor(.roseGold)
                    }
                    .padding()
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: Spacing.md) {
                            ForEach(0..<7, id: \.self) { dayOfWeek in
                                DayScheduleCard(
                                    dayName: dayNames[dayOfWeek],
                                    dayOfWeek: dayOfWeek,
                                    shifts: shiftsForDay(dayOfWeek),
                                    onAddShift: { addShift(dayOfWeek: dayOfWeek) },
                                    onRemoveShift: { shiftIndex in removeShift(dayOfWeek: dayOfWeek, shiftIndex: shiftIndex) },
                                    onUpdateShift: { shiftIndex, startTime, endTime in updateShift(dayOfWeek: dayOfWeek, shiftIndex: shiftIndex, startTime: startTime, endTime: endTime) },
                                    onAddBreak: { shiftIndex in addBreak(dayOfWeek: dayOfWeek, shiftIndex: shiftIndex) },
                                    onRemoveBreak: { shiftIndex, breakIndex in removeBreak(dayOfWeek: dayOfWeek, shiftIndex: shiftIndex, breakIndex: breakIndex) },
                                    onUpdateBreak: { shiftIndex, breakIndex, startTime, endTime, label in updateBreak(dayOfWeek: dayOfWeek, shiftIndex: shiftIndex, breakIndex: breakIndex, startTime: startTime, endTime: endTime, label: label) }
                                )
                            }
                        }
                        .padding()
                    }
                }
            }
            .background(Color.screenBackground)
            .navigationBarHidden(true)
        }
        .task {
            await loadData()
        }
    }

    private func shiftsForDay(_ dayOfWeek: Int) -> [StaffWorkingSchedule] {
        schedules.filter { $0.dayOfWeek == dayOfWeek && $0.isWorking }
    }

    private func loadData() async {
        isLoading = true
        errorMessage = nil
        do {
            let profile = try await StaffService.shared.getMyProfile()
            staffProfile = profile
            let loadedSchedules = try await StaffService.shared.getWorkingSchedule(staffId: profile.id)
            schedules = loadedSchedules
        } catch {
            errorMessage = "Failed to load schedule"
            print("Error loading schedule: \(error)")
        }
        isLoading = false
    }

    private func saveSchedule() {
        guard let staffId = staffProfile?.id else { return }
        isSaving = true
        Task {
            do {
                let updatedSchedules = try await StaffService.shared.updateWorkingSchedule(staffId: staffId, schedules: schedules)
                schedules = updatedSchedules
            } catch {
                print("Error saving schedule: \(error)")
            }
            isSaving = false
        }
    }

    private func addShift(dayOfWeek: Int) {
        let newShift = StaffWorkingSchedule(
            id: UUID().uuidString,
            dayOfWeek: dayOfWeek,
            startTime: "09:00",
            endTime: "17:00",
            isWorking: true,
            breaks: []
        )
        schedules.append(newShift)
    }

    private func removeShift(dayOfWeek: Int, shiftIndex: Int) {
        let dayShifts = shiftsForDay(dayOfWeek)
        guard shiftIndex < dayShifts.count else { return }
        let shiftToRemove = dayShifts[shiftIndex]
        schedules.removeAll { $0.id == shiftToRemove.id }
    }

    private func updateShift(dayOfWeek: Int, shiftIndex: Int, startTime: String, endTime: String) {
        let dayShifts = shiftsForDay(dayOfWeek)
        guard shiftIndex < dayShifts.count else { return }
        let shiftToUpdate = dayShifts[shiftIndex]
        if let index = schedules.firstIndex(where: { $0.id == shiftToUpdate.id }) {
            schedules[index].startTime = startTime
            schedules[index].endTime = endTime
        }
    }

    private func addBreak(dayOfWeek: Int, shiftIndex: Int) {
        let dayShifts = shiftsForDay(dayOfWeek)
        guard shiftIndex < dayShifts.count else { return }
        let shiftToUpdate = dayShifts[shiftIndex]
        if let index = schedules.firstIndex(where: { $0.id == shiftToUpdate.id }) {
            schedules[index].breaks.append(ScheduleBreakInput())
        }
    }

    private func removeBreak(dayOfWeek: Int, shiftIndex: Int, breakIndex: Int) {
        let dayShifts = shiftsForDay(dayOfWeek)
        guard shiftIndex < dayShifts.count else { return }
        let shiftToUpdate = dayShifts[shiftIndex]
        if let index = schedules.firstIndex(where: { $0.id == shiftToUpdate.id }) {
            guard breakIndex < schedules[index].breaks.count else { return }
            schedules[index].breaks.remove(at: breakIndex)
        }
    }

    private func updateBreak(dayOfWeek: Int, shiftIndex: Int, breakIndex: Int, startTime: String, endTime: String, label: String?) {
        let dayShifts = shiftsForDay(dayOfWeek)
        guard shiftIndex < dayShifts.count else { return }
        let shiftToUpdate = dayShifts[shiftIndex]
        if let index = schedules.firstIndex(where: { $0.id == shiftToUpdate.id }) {
            guard breakIndex < schedules[index].breaks.count else { return }
            schedules[index].breaks[breakIndex].startTime = startTime
            schedules[index].breaks[breakIndex].endTime = endTime
            schedules[index].breaks[breakIndex].label = label
        }
    }
}

struct DayScheduleCard: View {
    let dayName: String
    let dayOfWeek: Int
    let shifts: [StaffWorkingSchedule]
    let onAddShift: () -> Void
    let onRemoveShift: (Int) -> Void
    let onUpdateShift: (Int, String, String) -> Void
    let onAddBreak: (Int) -> Void
    let onRemoveBreak: (Int, Int) -> Void
    let onUpdateBreak: (Int, Int, String, String, String?) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                Text(dayName)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                Spacer()
                Button(action: onAddShift) {
                    HStack(spacing: 4) {
                        Image(systemName: "plus")
                        Text("Add Shift")
                    }
                    .font(.appCaption)
                    .foregroundColor(.roseGold)
                }
            }

            if shifts.isEmpty {
                Text("No shifts - Day off")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
                    .padding(.vertical, Spacing.sm)
            } else {
                ForEach(Array(shifts.enumerated()), id: \.offset) { shiftIndex, shift in
                    ShiftEditorCard(
                        shift: shift,
                        shiftIndex: shiftIndex,
                        onRemove: { onRemoveShift(shiftIndex) },
                        onUpdateTime: { start, end in onUpdateShift(shiftIndex, start, end) },
                        onAddBreak: { onAddBreak(shiftIndex) },
                        onRemoveBreak: { breakIndex in onRemoveBreak(shiftIndex, breakIndex) },
                        onUpdateBreak: { breakIndex, start, end, label in onUpdateBreak(shiftIndex, breakIndex, start, end, label) }
                    )
                }
            }
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(CornerRadius.md)
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.md)
                .stroke(Color.softGray.opacity(0.2), lineWidth: 1)
        )
    }
}

struct ShiftEditorCard: View {
    let shift: StaffWorkingSchedule
    let shiftIndex: Int
    let onRemove: () -> Void
    let onUpdateTime: (String, String) -> Void
    let onAddBreak: () -> Void
    let onRemoveBreak: (Int) -> Void
    let onUpdateBreak: (Int, String, String, String?) -> Void

    @State private var startTime: String
    @State private var endTime: String

    init(shift: StaffWorkingSchedule, shiftIndex: Int, onRemove: @escaping () -> Void, onUpdateTime: @escaping (String, String) -> Void, onAddBreak: @escaping () -> Void, onRemoveBreak: @escaping (Int) -> Void, onUpdateBreak: @escaping (Int, String, String, String?) -> Void) {
        self.shift = shift
        self.shiftIndex = shiftIndex
        self.onRemove = onRemove
        self.onUpdateTime = onUpdateTime
        self.onAddBreak = onAddBreak
        self.onRemoveBreak = onRemoveBreak
        self.onUpdateBreak = onUpdateBreak
        _startTime = State(initialValue: shift.startTime)
        _endTime = State(initialValue: shift.endTime)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            // Shift time row
            HStack {
                Image(systemName: "clock")
                    .foregroundColor(.softGray)
                TextField("Start", text: $startTime)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .frame(width: 80)
                    .onChange(of: startTime) { onUpdateTime(startTime, endTime) }
                Text("to")
                    .foregroundColor(.softGray)
                TextField("End", text: $endTime)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .frame(width: 80)
                    .onChange(of: endTime) { onUpdateTime(startTime, endTime) }
                Spacer()
                Button(action: onRemove) {
                    Image(systemName: "trash")
                        .foregroundColor(.error)
                }
            }

            // Breaks section
            VStack(alignment: .leading, spacing: Spacing.sm) {
                HStack {
                    Text("Breaks")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    Spacer()
                    Button(action: onAddBreak) {
                        HStack(spacing: 2) {
                            Image(systemName: "plus")
                            Text("Add Break")
                        }
                        .font(.system(size: 11))
                        .foregroundColor(.roseGold)
                    }
                }

                if shift.breaks.isEmpty {
                    Text("No breaks scheduled")
                        .font(.system(size: 11))
                        .foregroundColor(.softGray)
                } else {
                    ForEach(Array(shift.breaks.enumerated()), id: \.offset) { breakIndex, breakItem in
                        BreakEditorRow(
                            breakItem: breakItem,
                            onRemove: { onRemoveBreak(breakIndex) },
                            onUpdate: { start, end, label in onUpdateBreak(breakIndex, start, end, label) }
                        )
                    }
                }
            }
            .padding(.leading, Spacing.lg)
            .padding(.top, Spacing.sm)
        }
        .padding()
        .background(Color.softGray.opacity(0.05))
        .cornerRadius(CornerRadius.sm)
    }
}

struct BreakEditorRow: View {
    let breakItem: ScheduleBreakInput
    let onRemove: () -> Void
    let onUpdate: (String, String, String?) -> Void

    @State private var startTime: String
    @State private var endTime: String
    @State private var label: String

    init(breakItem: ScheduleBreakInput, onRemove: @escaping () -> Void, onUpdate: @escaping (String, String, String?) -> Void) {
        self.breakItem = breakItem
        self.onRemove = onRemove
        self.onUpdate = onUpdate
        _startTime = State(initialValue: breakItem.startTime)
        _endTime = State(initialValue: breakItem.endTime)
        _label = State(initialValue: breakItem.label ?? "")
    }

    var body: some View {
        HStack(spacing: Spacing.sm) {
            TextField("Start", text: $startTime)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .frame(width: 70)
                .font(.system(size: 12))
                .onChange(of: startTime) { onUpdate(startTime, endTime, label.isEmpty ? nil : label) }
            Text("-")
                .foregroundColor(.softGray)
            TextField("End", text: $endTime)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .frame(width: 70)
                .font(.system(size: 12))
                .onChange(of: endTime) { onUpdate(startTime, endTime, label.isEmpty ? nil : label) }
            TextField("Label", text: $label)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .frame(width: 80)
                .font(.system(size: 12))
                .onChange(of: label) { onUpdate(startTime, endTime, label.isEmpty ? nil : label) }
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.error)
                    .font(.system(size: 16))
            }
        }
    }
}

struct StaffAppointmentCard: View {
    let appointment: StaffAppointmentItem

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack {
                Text(appointment.formattedTime)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                Spacer()
                Text(appointment.status.capitalized)
                    .font(.appCaption)
                    .foregroundColor(statusColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusColor.opacity(0.1))
                    .cornerRadius(8)
            }

            Text(appointment.client.name)
                .font(.appBody)
                .foregroundColor(.charcoal)

            if !appointment.services.isEmpty {
                Text(appointment.services.map { $0.name }.joined(separator: ", "))
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }

            if let phone = appointment.client.phone {
                HStack {
                    Image(systemName: "phone")
                        .font(.caption)
                    Text(phone)
                        .font(.appCaption)
                }
                .foregroundColor(.softGray)
            }
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(CornerRadius.md)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    private var statusColor: Color {
        switch appointment.status.lowercased() {
        case "confirmed": return .success
        case "pending": return .warning
        case "completed": return .roseGold
        case "cancelled", "no_show": return .error
        default: return .softGray
        }
    }
}

// MARK: - Staff Clients View
struct StaffClientsView: View {
    @State private var clientsData: StaffClientsResponse?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var searchText = ""

    var filteredClients: [StaffClientItem] {
        guard let clients = clientsData?.clients else { return [] }
        if searchText.isEmpty {
            return clients
        }
        return clients.filter { $0.fullName.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                Text("My Clients")
                    .font(.appTitle)
                    .foregroundColor(.charcoal)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    .padding(.top)

                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.softGray)
                    TextField("Search clients...", text: $searchText)
                        .font(.appBody)
                }
                .padding()
                .background(Color.cardBackground)
                .cornerRadius(CornerRadius.md)
                .padding(.horizontal)
                .padding(.top, Spacing.sm)

                if isLoading {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                    Spacer()
                } else if let error = errorMessage {
                    Spacer()
                    VStack(spacing: Spacing.md) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 50))
                            .foregroundColor(.warning)
                        Text(error)
                            .font(.appBody)
                            .foregroundColor(.softGray)
                            .multilineTextAlignment(.center)
                        Button("Retry") {
                            Task { await loadClients() }
                        }
                        .foregroundColor(.roseGold)
                    }
                    .padding()
                    Spacer()
                } else if filteredClients.isEmpty {
                    Spacer()
                    VStack(spacing: Spacing.md) {
                        Image(systemName: "person.2")
                            .font(.system(size: 60))
                            .foregroundColor(.softGray)
                        Text(searchText.isEmpty ? "No clients yet" : "No clients found")
                            .font(.appBody)
                            .foregroundColor(.softGray)
                    }
                    Spacer()
                } else {
                    // Client count
                    Text("\(filteredClients.count) client\(filteredClients.count == 1 ? "" : "s")")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                        .padding(.top, Spacing.sm)

                    ScrollView {
                        LazyVStack(spacing: Spacing.md) {
                            ForEach(filteredClients) { client in
                                NavigationLink(destination: StaffClientDetailView(client: client)) {
                                    StaffClientCard(client: client)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding()
                    }
                }
            }
            .background(Color.screenBackground)
            .navigationBarHidden(true)
        }
        .task {
            await loadClients()
        }
    }

    private func loadClients() async {
        isLoading = true
        errorMessage = nil
        do {
            clientsData = try await StaffService.shared.getMyClients()
        } catch {
            errorMessage = "Failed to load clients"
            print("Error loading clients: \(error)")
        }
        isLoading = false
    }
}

struct StaffClientCard: View {
    let client: StaffClientItem

    var body: some View {
        HStack(spacing: Spacing.md) {
            // Avatar
            ZStack {
                Circle()
                    .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                    .frame(width: 50, height: 50)
                Text(client.initials)
                    .font(.appHeadline)
                    .foregroundColor(.roseGold)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(client.fullName)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)

                HStack(spacing: Spacing.sm) {
                    if let lastVisit = client.lastVisit {
                        Text("Last visit: \(formatDate(lastVisit))")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                    }
                    Text("•")
                        .foregroundColor(.softGray)
                    Text("\(client.totalVisits) visit\(client.totalVisits == 1 ? "" : "s")")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }

                Text(client.phone)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .foregroundColor(.softGray)
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(CornerRadius.md)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Staff Client Detail View
struct StaffClientDetailView: View {
    let client: StaffClientItem
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Client Header
                VStack(spacing: Spacing.md) {
                    // Avatar
                    ZStack {
                        Circle()
                            .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                            .frame(width: 100, height: 100)
                        Text(client.initials)
                            .font(.appTitle)
                            .foregroundColor(.roseGold)
                    }

                    Text(client.fullName)
                        .font(.appTitle2)
                        .foregroundColor(.charcoal)
                }
                .padding(.top, Spacing.lg)

                // Contact Info Card
                VStack(alignment: .leading, spacing: Spacing.md) {
                    HStack {
                        Image(systemName: "person.text.rectangle")
                            .foregroundColor(.roseGold)
                        Text("Contact Information")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)
                        Spacer()
                    }

                    VStack(spacing: Spacing.sm) {
                        HStack(spacing: Spacing.md) {
                            Image(systemName: "phone.fill")
                                .foregroundColor(.softGray)
                                .frame(width: 24)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Phone")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                                Text(client.phone)
                                    .font(.appBody)
                                    .foregroundColor(.charcoal)
                            }
                            Spacer()
                            #if os(iOS)
                            Button {
                                if let url = URL(string: "tel:\(client.phone)") {
                                    UIApplication.shared.open(url)
                                }
                            } label: {
                                Image(systemName: "phone.circle.fill")
                                    .font(.system(size: 32))
                                    .foregroundColor(.roseGold)
                            }
                            #endif
                        }

                        if let email = client.email {
                            Divider()
                            HStack(spacing: Spacing.md) {
                                Image(systemName: "envelope.fill")
                                    .foregroundColor(.softGray)
                                    .frame(width: 24)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Email")
                                        .font(.appCaption)
                                        .foregroundColor(.softGray)
                                    Text(email)
                                        .font(.appBody)
                                        .foregroundColor(.charcoal)
                                }
                                Spacer()
                                #if os(iOS)
                                Button {
                                    if let url = URL(string: "mailto:\(email)") {
                                        UIApplication.shared.open(url)
                                    }
                                } label: {
                                    Image(systemName: "envelope.circle.fill")
                                        .font(.system(size: 32))
                                        .foregroundColor(.roseGold)
                                }
                                #endif
                            }
                        }
                    }
                }
                .padding()
                .background(Color.cardBackground)
                .cornerRadius(CornerRadius.md)
                .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                .padding(.horizontal)

                // Visit Stats Card
                VStack(alignment: .leading, spacing: Spacing.md) {
                    HStack {
                        Image(systemName: "chart.bar.fill")
                            .foregroundColor(.roseGold)
                        Text("Visit History")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)
                        Spacer()
                    }

                    HStack(spacing: Spacing.lg) {
                        VStack {
                            Text("\(client.totalVisits)")
                                .font(.appTitle)
                                .foregroundColor(.roseGold)
                            Text("Total Visits")
                                .font(.appCaption)
                                .foregroundColor(.softGray)
                        }
                        .frame(maxWidth: .infinity)

                        Divider()
                            .frame(height: 50)

                        VStack {
                            if let lastVisit = client.lastVisit {
                                Text(formatDate(lastVisit))
                                    .font(.appBody)
                                    .foregroundColor(.charcoal)
                            } else {
                                Text("N/A")
                                    .font(.appBody)
                                    .foregroundColor(.softGray)
                            }
                            Text("Last Visit")
                                .font(.appCaption)
                                .foregroundColor(.softGray)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .padding()
                .background(Color.cardBackground)
                .cornerRadius(CornerRadius.md)
                .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                .padding(.horizontal)

                // Quick Actions
                #if os(iOS)
                VStack(spacing: Spacing.sm) {
                    Button {
                        if let url = URL(string: "sms:\(client.phone)") {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        HStack {
                            Image(systemName: "message.fill")
                            Text("Send Text Message")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.roseGold)
                        .foregroundColor(.white)
                        .cornerRadius(CornerRadius.md)
                    }
                }
                .padding(.horizontal)
                #endif

                Spacer()
            }
        }
        .background(Color.screenBackground)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button {
                    dismiss()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                        Text("Back")
                    }
                    .foregroundColor(.roseGold)
                }
            }
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Staff Earnings View
struct StaffEarningsView: View {
    @State private var earningsData: StaffEarningsResponse?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Header
                    Text("My Earnings")
                        .font(.appTitle)
                        .foregroundColor(.charcoal)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)

                    if isLoading {
                        Spacer()
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                        Spacer()
                    } else if let error = errorMessage {
                        Spacer()
                        VStack(spacing: Spacing.md) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 50))
                                .foregroundColor(.warning)
                            Text(error)
                                .font(.appBody)
                                .foregroundColor(.softGray)
                                .multilineTextAlignment(.center)
                            Button("Retry") {
                                Task { await loadEarnings() }
                            }
                            .foregroundColor(.roseGold)
                        }
                        .padding()
                        Spacer()
                    } else if let data = earningsData {
                        // Earnings summary cards (matching JS layout)
                        VStack(spacing: Spacing.md) {
                            HStack(spacing: Spacing.md) {
                                EarningsCardWithSubtitle(
                                    title: "This Month",
                                    amount: formatCurrency(data.thisMonth),
                                    subtitle: monthChangeText(data: data),
                                    icon: "dollarsign.circle.fill",
                                    color: .success
                                )
                                EarningsCardWithSubtitle(
                                    title: "This Week",
                                    amount: formatCurrency(data.thisWeek),
                                    subtitle: nil,
                                    icon: "calendar",
                                    color: .blue
                                )
                            }
                            HStack(spacing: Spacing.md) {
                                EarningsCardWithSubtitle(
                                    title: "Appointments",
                                    amount: "\(data.completedAppointments)",
                                    subtitle: "Completed this month",
                                    icon: "clock.fill",
                                    color: .deepRose
                                )
                                EarningsCardWithSubtitle(
                                    title: "Avg/Appt",
                                    amount: formatCurrency(data.averagePerAppointment),
                                    subtitle: nil,
                                    icon: "chart.line.uptrend.xyaxis",
                                    color: .champagneGold
                                )
                            }
                        }
                        .padding(.horizontal)

                        // Recent Transactions
                        if !data.recentTransactions.isEmpty {
                            VStack(alignment: .leading, spacing: Spacing.md) {
                                Text("Recent Transactions")
                                    .font(.appHeadline)
                                    .foregroundColor(.charcoal)
                                    .padding(.horizontal)

                                ForEach(data.recentTransactions) { transaction in
                                    StaffTransactionRow(transaction: transaction)
                                }
                            }
                            .padding(.top, Spacing.md)
                        }
                    }
                }
                .padding(.vertical)
            }
            .background(Color.screenBackground)
            .navigationBarHidden(true)
            .refreshable {
                await loadEarnings()
            }
        }
        .task {
            await loadEarnings()
        }
    }

    private func loadEarnings() async {
        isLoading = true
        errorMessage = nil
        do {
            earningsData = try await StaffService.shared.getMyEarnings()
        } catch {
            errorMessage = "Failed to load earnings"
            print("Error loading earnings: \(error)")
        }
        isLoading = false
    }

    private func formatCurrency(_ amount: Double) -> String {
        String(format: "$%.2f", amount)
    }

    private func monthChangeText(data: StaffEarningsResponse) -> String {
        guard data.lastMonth > 0 else { return "+0% vs last month" }
        let change = ((data.thisMonth - data.lastMonth) / data.lastMonth) * 100
        let sign = change >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.1f", change))% vs last month"
    }
}

struct EarningsCardWithSubtitle: View {
    let title: String
    let amount: String
    let subtitle: String?
    let icon: String
    let color: Color

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
                Text(amount)
                    .font(.appTitle2)
                    .foregroundColor(.charcoal)
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.system(size: 10))
                        .foregroundColor(.softGray)
                }
            }
            Spacer()
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(color.opacity(0.15))
                    .frame(width: 48, height: 48)
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(color)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(CornerRadius.md)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

struct StaffTransactionRow: View {
    let transaction: StaffTransactionItem

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(transaction.service)
                    .font(.appBody)
                    .foregroundColor(.charcoal)
                HStack(spacing: Spacing.sm) {
                    Text(transaction.client)
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    Text("•")
                        .foregroundColor(.softGray)
                    Text(transaction.formattedDate)
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
            }

            Spacer()

            Text(transaction.formattedAmount)
                .font(.appHeadline)
                .foregroundColor(.success)
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(CornerRadius.md)
        .padding(.horizontal)
    }
}

struct EarningsCard: View {
    let title: String
    let amount: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Text(title)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }
            Text(amount)
                .font(.appTitle2)
                .foregroundColor(.charcoal)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(CornerRadius.md)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Staff Settings View
struct StaffSettingsView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var showingLogoutAlert = false
    @State private var profile: StaffProfile?
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var errorMessage: String?

    // Track if we opened Stripe to reload on return
    @State private var pendingStripeReload = false

    // Editable fields
    @State private var displayName = ""
    @State private var bio = ""
    @State private var phone = ""

    // Payout settings
    @State private var payoutSettings: PayoutSettingsResponse?
    @State private var showBankForm = false
    @State private var isSavingBank = false
    @State private var showRemoveBankAlert = false

    // Bank form fields
    @State private var bankAccountHolder = ""
    @State private var bankName = ""
    @State private var bankRoutingNumber = ""
    @State private var bankAccountNumber = ""
    @State private var bankAccountType = "checking"

    // Stripe Connect
    @State private var stripeStatus: StripeConnectStatusResponse?
    @State private var isConnectingStripe = false
    @State private var stripeError: String?

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Header
                    Text("My Settings")
                        .font(.appTitle)
                        .foregroundColor(.charcoal)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)

                    if isLoading {
                        Spacer()
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                        Spacer()
                    } else if let error = errorMessage {
                        VStack(spacing: Spacing.md) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 50))
                                .foregroundColor(.warning)
                            Text(error)
                                .font(.appBody)
                                .foregroundColor(.softGray)
                            Button("Retry") {
                                Task { await loadData() }
                            }
                            .foregroundColor(.roseGold)
                        }
                        .padding()
                    } else {
                        // Profile Card
                        VStack(alignment: .leading, spacing: Spacing.md) {
                            HStack {
                                Image(systemName: "person.circle")
                                    .foregroundColor(.roseGold)
                                Text("Profile Information")
                                    .font(.appHeadline)
                                    .foregroundColor(.charcoal)
                                Spacer()
                            }

                            // Read-only info
                            VStack(spacing: Spacing.sm) {
                                ProfileInfoRow(icon: "envelope", label: "Email", value: profile?.user.email ?? "")
                                ProfileInfoRow(icon: "person", label: "Full Name", value: profile?.fullName ?? "")
                                if let title = profile?.title {
                                    ProfileInfoRow(icon: "briefcase", label: "Title", value: title)
                                }
                            }
                            .padding()
                            .background(Color.softGray.opacity(0.1))
                            .cornerRadius(CornerRadius.md)

                            // Editable fields
                            VStack(alignment: .leading, spacing: Spacing.md) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Display Name")
                                        .font(.appCaption)
                                        .foregroundColor(.softGray)
                                    TextField("Name shown to clients", text: $displayName)
                                        .textFieldStyle(RoundedBorderTextFieldStyle())
                                }

                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Phone Number")
                                        .font(.appCaption)
                                        .foregroundColor(.softGray)
                                    TextField("Your contact number", text: $phone)
                                        .textFieldStyle(RoundedBorderTextFieldStyle())
                                        .keyboardType(.phonePad)
                                }

                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Bio")
                                        .font(.appCaption)
                                        .foregroundColor(.softGray)
                                    TextEditor(text: $bio)
                                        .frame(minHeight: 80)
                                        .padding(4)
                                        .background(Color.cardBackground)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 8)
                                                .stroke(Color.softGray.opacity(0.3), lineWidth: 1)
                                        )
                                    Text("This will be shown on your profile when clients book with you")
                                        .font(.system(size: 10))
                                        .foregroundColor(.softGray)
                                }
                            }

                            Button(action: saveProfile) {
                                HStack {
                                    if isSaving {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                            .scaleEffect(0.8)
                                    } else {
                                        Image(systemName: "checkmark")
                                    }
                                    Text(isSaving ? "Saving..." : "Save Changes")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.roseGold)
                                .foregroundColor(.white)
                                .cornerRadius(CornerRadius.md)
                            }
                            .disabled(isSaving)
                        }
                        .padding()
                        .background(Color.cardBackground)
                        .cornerRadius(CornerRadius.md)
                        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                        .padding(.horizontal)

                        // Payout Settings Card
                        VStack(alignment: .leading, spacing: Spacing.md) {
                            HStack {
                                Image(systemName: "creditcard")
                                    .foregroundColor(.roseGold)
                                Text("Payout Settings")
                                    .font(.appHeadline)
                                    .foregroundColor(.charcoal)
                                Spacer()
                            }

                            Text("Choose how you want to receive your earnings")
                                .font(.appCaption)
                                .foregroundColor(.softGray)

                            // Stripe Connect Option
                            VStack(alignment: .leading, spacing: Spacing.md) {
                                HStack(alignment: .top, spacing: Spacing.md) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(Color.purple.opacity(0.15))
                                            .frame(width: 44, height: 44)
                                        Image(systemName: "bolt.fill")
                                            .foregroundColor(.purple)
                                    }

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Stripe Connect")
                                            .font(.appBody)
                                            .foregroundColor(.charcoal)
                                        Text("Receive automatic payouts directly to your bank account")
                                            .font(.appCaption)
                                            .foregroundColor(.softGray)
                                    }
                                    Spacer()
                                }

                                // Show connection status or connect button
                                if stripeStatus?.connected == true {
                                    HStack(spacing: 4) {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.success)
                                        Text("Connected and ready for payouts")
                                            .font(.appCaption)
                                            .foregroundColor(.success)
                                    }
                                } else {
                                    // Show error if any
                                    if let error = stripeError {
                                        Text(error)
                                            .font(.appCaption)
                                            .foregroundColor(.error)
                                            .padding(.bottom, 4)
                                    }

                                    Button(action: connectWithStripe) {
                                        HStack {
                                            if isConnectingStripe {
                                                ProgressView()
                                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                                    .scaleEffect(0.8)
                                            } else {
                                                Image(systemName: "link")
                                            }
                                            Text(isConnectingStripe ? "Connecting..." : "Connect with Stripe")
                                        }
                                        .font(.appCaption)
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 10)
                                        .background(Color.purple)
                                        .cornerRadius(8)
                                    }
                                    .disabled(isConnectingStripe)
                                }
                            }
                            .padding()
                            .background(Color.softGray.opacity(0.05))
                            .cornerRadius(CornerRadius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: CornerRadius.md)
                                    .stroke(Color.softGray.opacity(0.2), lineWidth: 1)
                            )

                            // Bank Account Option
                            VStack(alignment: .leading, spacing: Spacing.md) {
                                HStack(alignment: .top, spacing: Spacing.md) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(Color.blue.opacity(0.15))
                                            .frame(width: 44, height: 44)
                                        Image(systemName: "building.columns")
                                            .foregroundColor(.blue)
                                    }

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Bank Account")
                                            .font(.appBody)
                                            .foregroundColor(.charcoal)
                                        Text("Add your bank details for manual payouts")
                                            .font(.appCaption)
                                            .foregroundColor(.softGray)
                                    }

                                    Spacer()

                                    if payoutSettings?.bankAccount == nil && !showBankForm {
                                        Button("Add") {
                                            showBankForm = true
                                        }
                                        .font(.appCaption)
                                        .foregroundColor(.roseGold)
                                    }
                                }

                                // Show existing bank account
                                if let bankAccount = payoutSettings?.bankAccount {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(bankAccount.bankName ?? "Bank")
                                                .font(.appBody)
                                                .foregroundColor(.charcoal)
                                            Text("\(bankAccount.accountType ?? "Account") •••• \(bankAccount.last4 ?? "")")
                                                .font(.appCaption)
                                                .foregroundColor(.softGray)
                                            Text(bankAccount.holderName ?? "")
                                                .font(.appCaption)
                                                .foregroundColor(.softGray)
                                        }
                                        Spacer()
                                        Button {
                                            showRemoveBankAlert = true
                                        } label: {
                                            Image(systemName: "trash")
                                                .foregroundColor(.error)
                                        }
                                    }
                                    .padding()
                                    .background(Color.softGray.opacity(0.1))
                                    .cornerRadius(CornerRadius.sm)
                                }

                                // Bank Form
                                if showBankForm {
                                    VStack(alignment: .leading, spacing: Spacing.md) {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("Account Holder Name")
                                                .font(.appCaption)
                                                .foregroundColor(.softGray)
                                            TextField("Full name on account", text: $bankAccountHolder)
                                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                        }

                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("Bank Name")
                                                .font(.appCaption)
                                                .foregroundColor(.softGray)
                                            TextField("e.g., Chase, Bank of America", text: $bankName)
                                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                        }

                                        HStack(spacing: Spacing.md) {
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text("Routing Number")
                                                    .font(.appCaption)
                                                    .foregroundColor(.softGray)
                                                TextField("9 digits", text: $bankRoutingNumber)
                                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                                    .keyboardType(.numberPad)
                                            }

                                            VStack(alignment: .leading, spacing: 4) {
                                                Text("Account Number")
                                                    .font(.appCaption)
                                                    .foregroundColor(.softGray)
                                                TextField("Account number", text: $bankAccountNumber)
                                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                                    .keyboardType(.numberPad)
                                            }
                                        }

                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("Account Type")
                                                .font(.appCaption)
                                                .foregroundColor(.softGray)
                                            Picker("Account Type", selection: $bankAccountType) {
                                                Text("Checking").tag("checking")
                                                Text("Savings").tag("savings")
                                            }
                                            .pickerStyle(SegmentedPickerStyle())
                                        }

                                        HStack(spacing: Spacing.md) {
                                            Button(action: saveBankAccount) {
                                                HStack {
                                                    if isSavingBank {
                                                        ProgressView()
                                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                                            .scaleEffect(0.8)
                                                    }
                                                    Text(isSavingBank ? "Saving..." : "Save Bank Account")
                                                }
                                                .frame(maxWidth: .infinity)
                                                .padding()
                                                .background(Color.roseGold)
                                                .foregroundColor(.white)
                                                .cornerRadius(CornerRadius.md)
                                            }
                                            .disabled(isSavingBank || bankAccountHolder.isEmpty || bankRoutingNumber.isEmpty || bankAccountNumber.isEmpty)

                                            Button("Cancel") {
                                                showBankForm = false
                                                clearBankForm()
                                            }
                                            .foregroundColor(.softGray)
                                        }
                                    }
                                    .padding()
                                    .background(Color.softGray.opacity(0.05))
                                    .cornerRadius(CornerRadius.md)
                                }
                            }
                            .padding()
                            .background(Color.softGray.opacity(0.05))
                            .cornerRadius(CornerRadius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: CornerRadius.md)
                                    .stroke(Color.softGray.opacity(0.2), lineWidth: 1)
                            )

                            // Current payout method indicator
                            if payoutSettings?.stripeConnected == true || payoutSettings?.bankAccount != nil {
                                HStack(spacing: Spacing.sm) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.success)
                                    Text("Current payout method: \(currentPayoutMethodText)")
                                        .font(.appCaption)
                                        .foregroundColor(.success)
                                }
                                .padding()
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.success.opacity(0.1))
                                .cornerRadius(CornerRadius.md)
                            }
                        }
                        .padding()
                        .background(Color.cardBackground)
                        .cornerRadius(CornerRadius.md)
                        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                        .padding(.horizontal)

                        // Sign Out Section
                        VStack(spacing: Spacing.md) {
                            Button {
                                showingLogoutAlert = true
                            } label: {
                                HStack {
                                    Image(systemName: "rectangle.portrait.and.arrow.right")
                                    Text("Sign Out")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .foregroundColor(.error)
                                .background(Color.error.opacity(0.1))
                                .cornerRadius(CornerRadius.md)
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .background(Color.screenBackground)
            .navigationBarHidden(true)
            .alert("Sign Out", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    Task {
                        await authManager.logout()
                    }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
            .alert("Remove Bank Account", isPresented: $showRemoveBankAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Remove", role: .destructive) {
                    Task { await removeBankAccount() }
                }
            } message: {
                Text("Are you sure you want to remove your bank account?")
            }
        }
        .task {
            await loadData()
        }
        #if os(iOS)
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
            // Reload Stripe status when app becomes active after opening Stripe
            if pendingStripeReload {
                pendingStripeReload = false
                Task {
                    await reloadStripeStatus()
                }
            }
        }
        #endif
    }

    private var currentPayoutMethodText: String {
        if let method = payoutSettings?.payoutMethod {
            switch method {
            case "stripe_connect": return "Stripe Connect (automatic)"
            case "bank_transfer": return "Bank Transfer (manual)"
            default: return "Manual"
            }
        }
        return "Manual"
    }

    private func loadData() async {
        isLoading = true
        errorMessage = nil
        do {
            async let profileTask = StaffService.shared.getMyProfile()
            async let payoutTask = StaffService.shared.getPayoutSettings()
            async let stripeTask = StaffService.shared.getStripeConnectStatus()

            let (loadedProfile, loadedPayout, loadedStripe) = try await (profileTask, payoutTask, stripeTask)
            profile = loadedProfile
            payoutSettings = loadedPayout
            stripeStatus = loadedStripe
            displayName = loadedProfile.displayName ?? loadedProfile.fullName
            bio = loadedProfile.bio ?? ""
            phone = loadedProfile.user.phone ?? ""
        } catch {
            errorMessage = "Failed to load settings"
            print("Error loading data: \(error)")
        }
        isLoading = false
    }

    private func connectWithStripe() {
        isConnectingStripe = true
        stripeError = nil
        Task {
            do {
                let response = try await StaffService.shared.createStripeConnectLink()
                if let url = response.url, let stripeURL = URL(string: url) {
                    // Mark for reload when returning from Safari
                    pendingStripeReload = true
                    // Open Stripe onboarding in Safari
                    #if os(iOS)
                    await MainActor.run {
                        UIApplication.shared.open(stripeURL)
                    }
                    #endif
                } else if let error = response.error {
                    stripeError = response.message ?? error
                }
            } catch {
                stripeError = "Failed to connect with Stripe"
                print("Error connecting Stripe: \(error)")
            }
            isConnectingStripe = false
        }
    }

    private func reloadStripeStatus() async {
        do {
            stripeStatus = try await StaffService.shared.getStripeConnectStatus()
            payoutSettings = try await StaffService.shared.getPayoutSettings()
        } catch {
            print("Error reloading Stripe status: \(error)")
        }
    }

    private func saveProfile() {
        isSaving = true
        Task {
            do {
                let updatedProfile = try await StaffService.shared.updateMyProfile(
                    displayName: displayName.isEmpty ? nil : displayName,
                    bio: bio.isEmpty ? nil : bio,
                    phone: phone.isEmpty ? nil : phone
                )
                profile = updatedProfile
            } catch {
                print("Error saving profile: \(error)")
            }
            isSaving = false
        }
    }

    private func saveBankAccount() {
        isSavingBank = true
        Task {
            do {
                _ = try await StaffService.shared.updatePayoutSettings(
                    bankAccountHolder: bankAccountHolder,
                    bankName: bankName,
                    bankRoutingNumber: bankRoutingNumber,
                    bankAccountNumber: bankAccountNumber,
                    bankAccountType: bankAccountType
                )
                payoutSettings = try await StaffService.shared.getPayoutSettings()
                showBankForm = false
                clearBankForm()
            } catch {
                print("Error saving bank account: \(error)")
            }
            isSavingBank = false
        }
    }

    private func removeBankAccount() async {
        do {
            try await StaffService.shared.removeBankAccount()
            payoutSettings = try await StaffService.shared.getPayoutSettings()
        } catch {
            print("Error removing bank account: \(error)")
        }
    }

    private func clearBankForm() {
        bankAccountHolder = ""
        bankName = ""
        bankRoutingNumber = ""
        bankAccountNumber = ""
        bankAccountType = "checking"
    }
}

struct ProfileInfoRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: Spacing.sm) {
            Image(systemName: icon)
                .foregroundColor(.softGray)
                .frame(width: 20)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
                Text(value)
                    .font(.appBody)
                    .foregroundColor(.charcoal)
            }
            Spacer()
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager.shared)
        .environmentObject(AppState())
}
