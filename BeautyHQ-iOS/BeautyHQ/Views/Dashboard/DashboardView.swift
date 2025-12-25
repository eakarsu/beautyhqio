import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var viewModel = DashboardViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    headerSection

                    // Stats Grid
                    statsGrid

                    // Quick Actions
                    quickActions

                    // Upcoming Appointments
                    upcomingAppointments
                }
                .padding()
            }
            .refreshable {
                await viewModel.loadData()
            }
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        // Notifications
                    } label: {
                        Image(systemName: "bell.fill")
                            .foregroundColor(.primary)
                    }
                }
            }
        }
        .task {
            await viewModel.loadData()
        }
    }

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(greeting)
                    .font(.title)
                    .fontWeight(.bold)
                Text("Here's your salon overview")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
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
        ], spacing: 12) {
            StatCard(
                title: "Today's Appts",
                value: "\(viewModel.stats?.todayAppointments ?? 0)",
                icon: "calendar",
                color: .purple
            )
            StatCard(
                title: "Today's Revenue",
                value: viewModel.stats?.formattedTodayRevenue ?? "$0",
                icon: "dollarsign.circle.fill",
                color: .green
            )
            StatCard(
                title: "This Week",
                value: viewModel.stats?.formattedWeeklyRevenue ?? "$0",
                icon: "chart.line.uptrend.xyaxis",
                color: .pink
            )
            StatCard(
                title: "New Clients",
                value: "\(viewModel.stats?.newClients ?? 0)",
                icon: "person.badge.plus",
                color: .blue
            )
        }
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            HStack(spacing: 16) {
                QuickActionButton(title: "New Booking", icon: "plus", color: .purple) {
                    // New booking
                }
                QuickActionButton(title: "Add Client", icon: "person.badge.plus", color: .pink) {
                    // Add client
                }
                QuickActionButton(title: "Checkout", icon: "creditcard.fill", color: .green) {
                    // Checkout
                }
                QuickActionButton(title: "Schedule", icon: "calendar", color: .blue) {
                    // Schedule
                }
            }
        }
    }

    private var upcomingAppointments: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Upcoming Appointments")
                    .font(.headline)
                Spacer()
                Button("See All") {
                    // Navigate to appointments
                }
                .font(.subheadline)
                .foregroundColor(.purple)
            }

            if viewModel.upcomingAppointments.isEmpty {
                EmptyStateCard(
                    icon: "calendar",
                    message: "No upcoming appointments"
                )
            } else {
                ForEach(viewModel.upcomingAppointments) { appointment in
                    AppointmentRow(appointment: appointment)
                }
            }
        }
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 40, height: 40)
                .background(color.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 10))

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 50, height: 50)
                    .background(color.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                Text(title)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Empty State Card
struct EmptyStateCard: View {
    let icon: String
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.largeTitle)
                .foregroundColor(.gray)
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Appointment Row
struct AppointmentRow: View {
    let appointment: Appointment

    var body: some View {
        HStack(spacing: 12) {
            // Time
            VStack(spacing: 2) {
                Text(appointment.startTime, style: .time)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(relativeDay)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .frame(width: 60)

            Divider()
                .frame(height: 40)

            // Client & Service
            VStack(alignment: .leading, spacing: 4) {
                Text(appointment.client?.fullName ?? "Unknown")
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(appointment.service?.name ?? "Service")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Status
            StatusBadge(status: appointment.status)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.03), radius: 4, y: 1)
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
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundColor(status.color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(status.color.opacity(0.15))
            .clipShape(Capsule())
    }
}

#Preview {
    DashboardView()
        .environmentObject(AuthManager.shared)
}
