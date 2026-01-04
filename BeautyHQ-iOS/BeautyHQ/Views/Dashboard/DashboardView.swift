import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var viewModel = DashboardViewModel()
    @State private var showingNewBooking = false
    @State private var showingAddClient = false
    @State private var showingPOS = false
    @State private var selectedTab: Int = 0

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Gradient Header
                    headerSection

                    // Stats Grid
                    statsGrid
                        .padding(.horizontal, Spacing.lg)

                    // Quick Actions
                    quickActions
                        .padding(.horizontal, Spacing.lg)

                    // Upcoming Appointments
                    upcomingAppointments
                        .padding(.horizontal, Spacing.lg)
                }
                .padding(.bottom, Spacing.xl)
            }
            .background(Color.screenBackground)
            .refreshable {
                await viewModel.loadData()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Text("Dashboard")
                        .font(.appTitle2)
                        .foregroundColor(.charcoal)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: NotificationsView()) {
                        Image(systemName: "bell.fill")
                            .foregroundStyle(LinearGradient.roseGoldGradient)
                    }
                }
            }
        }
        .task {
            await viewModel.loadData()
        }
        .sheet(isPresented: $showingNewBooking) {
            AddAppointmentView {
                Task { await viewModel.loadData() }
            }
        }
        .sheet(isPresented: $showingAddClient) {
            AddClientView {
                Task { await viewModel.loadData() }
            }
        }
        .sheet(isPresented: $showingPOS) {
            NewSaleView()
        }
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(greeting)
                .font(.appLargeTitle)
                .foregroundColor(.white)
            Text("Here's your salon overview")
                .font(.appSubheadline)
                .foregroundColor(.white.opacity(0.9))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.xl)
        .padding(.top, Spacing.lg)
        .background(
            LinearGradient.roseGoldGradient
                .ignoresSafeArea(edges: .top)
        )
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        let name = authManager.currentUser?.firstName ?? "there"

        switch hour {
        case 0..<12: return "Good morning, \(name)!"
        case 12..<17: return "Good afternoon, \(name)!"
        default: return "Good evening, \(name)!"
        }
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: Spacing.md) {
            DashboardStatCard(
                title: "Today's Appts",
                value: "\(viewModel.stats?.todayAppointments ?? 0)",
                icon: "calendar",
                gradient: .roseGoldGradient
            )
            DashboardStatCard(
                title: "Today's Revenue",
                value: viewModel.stats?.formattedTodayRevenue ?? "$0",
                icon: "dollarsign.circle.fill",
                gradient: .successGradient
            )
            DashboardStatCard(
                title: "Staff On Duty",
                value: "\(viewModel.stats?.staffOnDuty ?? 0)",
                icon: "person.2.fill",
                gradient: .deepRoseGradient
            )
            DashboardStatCard(
                title: "Total Clients",
                value: "\(viewModel.stats?.totalClients ?? 0)",
                icon: "person.badge.plus",
                gradient: .goldGradient
            )
        }
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Quick Actions")
                .font(.appTitle3)
                .foregroundColor(.charcoal)

            HStack(spacing: Spacing.lg) {
                AppQuickAction(icon: "plus", label: "New Booking", color: .roseGold) {
                    showingNewBooking = true
                }
                AppQuickAction(icon: "person.badge.plus", label: "Add Client", color: .deepRose) {
                    showingAddClient = true
                }
                AppQuickAction(icon: "creditcard.fill", label: "Checkout", color: .success) {
                    showingPOS = true
                }
                NavigationLink(destination: CalendarView()) {
                    VStack(spacing: Spacing.sm) {
                        Image(systemName: "calendar")
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(width: 50, height: 50)
                            .background(Color.champagneGold)
                            .clipShape(Circle())
                            .shadow(color: Color.champagneGold.opacity(0.3), radius: 6, x: 0, y: 3)
                        Text("Schedule")
                            .font(.appCaption)
                            .foregroundColor(.charcoal)
                    }
                }
            }
        }
    }

    private var upcomingAppointments: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            AppSectionHeader(title: "Today's Appointments", subtitle: nil) {
                // Navigate to appointments
            }
            .padding(.horizontal, -Spacing.lg)

            if viewModel.todayAppointments.isEmpty {
                AppEmptyState(
                    icon: "calendar.badge.clock",
                    title: "No Appointments",
                    message: "You have no appointments scheduled for today"
                )
                .cardStyle()
            } else {
                VStack(spacing: Spacing.sm) {
                    ForEach(viewModel.todayAppointments) { appointment in
                        DashboardAppointmentRow(appointment: appointment)
                    }
                }
            }
        }
    }
}

// MARK: - Dashboard Stat Card
struct DashboardStatCard: View {
    let title: String
    let value: String
    let icon: String
    let gradient: LinearGradient

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Image(systemName: icon)
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(gradient)
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                .shadow(color: .roseGold.opacity(0.3), radius: 6, x: 0, y: 3)

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(value)
                    .font(.appTitle2)
                    .foregroundColor(.charcoal)

                Text(title)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardStyle()
    }
}

// MARK: - Dashboard Appointment Row
struct DashboardAppointmentRow: View {
    let appointment: DashboardAppointment

    var body: some View {
        HStack(spacing: Spacing.md) {
            // Rose Gold accent line
            RoundedRectangle(cornerRadius: 2)
                .fill(LinearGradient.roseGoldGradient)
                .frame(width: 4)

            // Time
            VStack(spacing: 2) {
                Text(appointment.time, style: .time)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                Text("Today")
                    .font(.appCaption2)
                    .foregroundColor(.softGray)
            }
            .frame(width: 60)

            AppDivider()
                .frame(width: 1, height: 40)

            // Client & Service
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(appointment.client)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                Text(appointment.service)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }

            Spacer()

            // Status
            AppStatusBadge(text: appointment.status.capitalized, status: appointment.status)
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .appShadow(.soft)
    }
}

// MARK: - Appointment Row (for full Appointment model)
struct AppointmentRow: View {
    let appointment: Appointment

    var body: some View {
        HStack(spacing: Spacing.md) {
            // Rose Gold accent line
            RoundedRectangle(cornerRadius: 2)
                .fill(LinearGradient.roseGoldGradient)
                .frame(width: 4)

            // Time
            VStack(spacing: 2) {
                Text(appointment.startTime, style: .time)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                Text(relativeDay)
                    .font(.appCaption2)
                    .foregroundColor(.softGray)
            }
            .frame(width: 60)

            AppDivider()
                .frame(width: 1, height: 40)

            // Client & Service
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(appointment.client?.fullName ?? "Unknown")
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                Text(appointment.service?.name ?? "Service")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }

            Spacer()

            // Status
            StatusBadge(status: appointment.status)
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .appShadow(.soft)
    }

    private var relativeDay: String {
        if Calendar.current.isDateInToday(appointment.startTime) {
            return "Today"
        } else if Calendar.current.isDateInTomorrow(appointment.startTime) {
            return "Tomorrow"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "E"
            return formatter.string(from: appointment.startTime)
        }
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let status: AppointmentStatus

    var body: some View {
        Text(status.displayName)
            .font(.appCaption)
            .fontWeight(.medium)
            .foregroundColor(Color.statusColor(for: status.rawValue))
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, Spacing.xs)
            .background(Color.statusColor(for: status.rawValue).opacity(0.15))
            .clipShape(Capsule())
    }
}

// Legacy support
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        DashboardStatCard(
            title: title,
            value: value,
            icon: icon,
            gradient: LinearGradient(colors: [color, color.opacity(0.8)], startPoint: .topLeading, endPoint: .bottomTrailing)
        )
    }
}

struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        AppQuickAction(icon: icon, label: title, color: color, action: action)
    }
}

struct EmptyStateCard: View {
    let icon: String
    let message: String

    var body: some View {
        AppEmptyState(icon: icon, title: "No Data", message: message)
    }
}

// MARK: - Notifications View
struct NotificationsView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AppEmptyState(
                    icon: "bell.slash",
                    title: "No Notifications",
                    message: "You're all caught up! Check back later for updates."
                )
                .cardStyle()
                .padding(.horizontal, Spacing.lg)
            }
            .padding(.vertical, Spacing.lg)
        }
        .background(Color.screenBackground)
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    DashboardView()
        .environmentObject(AuthManager.shared)
}
