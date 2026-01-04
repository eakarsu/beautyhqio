import SwiftUI

struct StaffView: View {
    @StateObject private var viewModel = StaffViewModel()
    @State private var showingAddStaff = false
    @State private var selectedStaff: Staff?

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    AppLoadingView()
                } else if viewModel.staffMembers.isEmpty {
                    EmptyStaffView()
                } else {
                    ScrollView {
                        VStack(spacing: Spacing.lg) {
                            // Stats Summary
                            StaffStatsCard(
                                total: viewModel.staffMembers.count,
                                active: viewModel.staffMembers.filter { $0.isActive }.count
                            )
                            .padding(.horizontal, Spacing.lg)

                            // Staff List
                            VStack(spacing: Spacing.sm) {
                                ForEach(viewModel.staffMembers) { staff in
                                    Button {
                                        selectedStaff = staff
                                    } label: {
                                        StaffRow(staff: staff)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal, Spacing.lg)
                        }
                        .padding(.vertical, Spacing.lg)
                    }
                    .background(Color.screenBackground)
                }
            }
            .navigationTitle("Staff")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddStaff = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundStyle(LinearGradient.roseGoldGradient)
                    }
                }
            }
            .refreshable {
                await viewModel.loadStaff()
            }
            .sheet(isPresented: $showingAddStaff) {
                AddStaffView {
                    Task { await viewModel.loadStaff() }
                }
            }
        }
        .task {
            await viewModel.loadStaff()
        }
        .sheet(item: $selectedStaff) { staff in
            StaffDetailView(staff: staff)
        }
    }
}

struct StaffStatsCard: View {
    let total: Int
    let active: Int

    var body: some View {
        HStack(spacing: Spacing.xl) {
            VStack(spacing: Spacing.xs) {
                Text("\(total)")
                    .font(.appTitle)
                    .foregroundStyle(LinearGradient.roseGoldGradient)
                Text("Total Staff")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }
            .frame(maxWidth: .infinity)

            VStack(spacing: Spacing.xs) {
                Text("\(active)")
                    .font(.appTitle)
                    .foregroundColor(.success)
                Text("Active")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }
            .frame(maxWidth: .infinity)

            VStack(spacing: Spacing.xs) {
                Text("\(total - active)")
                    .font(.appTitle)
                    .foregroundColor(.softGray)
                Text("Inactive")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }
            .frame(maxWidth: .infinity)
        }
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
        .appShadow(.soft)
    }
}

struct StaffRow: View {
    let staff: Staff

    var staffColor: Color {
        if let colorHex = staff.color {
            return Color(hex: colorHex)
        }
        return .roseGold
    }

    var body: some View {
        HStack(spacing: Spacing.md) {
            // Avatar with staff color
            ZStack {
                Circle()
                    .fill(staffColor.opacity(0.2))
                    .frame(width: 50, height: 50)

                Text(staff.initials)
                    .font(.appHeadline)
                    .foregroundColor(staffColor)
            }

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(staff.fullName)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                Text(staff.title ?? "Staff Member")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }

            Spacer()

            if staff.isActive {
                AppStatusBadge(text: "Active", status: "ACTIVE")
            } else {
                AppStatusBadge(text: "Inactive", color: .softGray)
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.softGray)
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .appShadow(.soft)
    }
}

struct StaffDetailView: View {
    let staff: Staff
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = StaffDetailViewModel()
    @State private var selectedTab = 0

    var staffColor: Color {
        if let colorHex = staff.color {
            return Color(hex: colorHex)
        }
        return .roseGold
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Profile Header
                    VStack(spacing: Spacing.md) {
                        ZStack {
                            Circle()
                                .fill(staffColor.opacity(0.2))
                                .frame(width: 100, height: 100)

                            Text(staff.initials)
                                .font(.system(size: 36, weight: .bold, design: .rounded))
                                .foregroundColor(staffColor)
                        }

                        Text(staff.fullName)
                            .font(.appTitle2)
                            .foregroundColor(.charcoal)

                        Text(staff.title ?? "Staff Member")
                            .font(.appSubheadline)
                            .foregroundColor(.softGray)

                        if staff.isActive {
                            AppStatusBadge(text: "Active", status: "ACTIVE")
                        }
                    }
                    .padding(.vertical, Spacing.lg)

                    // Performance Stats
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Performance")
                            .font(.appTitle3)
                            .foregroundColor(.charcoal)
                            .padding(.horizontal, Spacing.lg)

                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: Spacing.md) {
                            StaffStatCard(
                                title: "Today's Appts",
                                value: "\(viewModel.stats?.appointmentsToday ?? 0)",
                                icon: "calendar",
                                gradient: .roseGoldGradient
                            )
                            StaffStatCard(
                                title: "This Week",
                                value: "\(viewModel.stats?.appointmentsWeek ?? 0)",
                                icon: "calendar.badge.clock",
                                gradient: .deepRoseGradient
                            )
                            StaffStatCard(
                                title: "Monthly Revenue",
                                value: viewModel.formattedMonthlyRevenue,
                                icon: "dollarsign.circle.fill",
                                gradient: .successGradient
                            )
                            StaffStatCard(
                                title: "Clients Served",
                                value: "\(viewModel.stats?.clientsServed ?? 0)",
                                icon: "person.2.fill",
                                gradient: .goldGradient
                            )
                        }
                        .padding(.horizontal, Spacing.lg)
                    }

                    // Contact Info
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Contact")
                            .font(.appTitle3)
                            .foregroundColor(.charcoal)

                        VStack(spacing: Spacing.sm) {
                            AppMetricRow(
                                label: "Email",
                                value: staff.email,
                                icon: "envelope"
                            )
                            if let phone = staff.phone {
                                AppDivider()
                                AppMetricRow(
                                    label: "Phone",
                                    value: phone,
                                    icon: "phone"
                                )
                            }
                        }
                        .padding(Spacing.md)
                        .background(Color.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                        .appShadow(.soft)
                    }
                    .padding(.horizontal, Spacing.lg)

                    // Employment Info
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Employment")
                            .font(.appTitle3)
                            .foregroundColor(.charcoal)

                        VStack(spacing: Spacing.sm) {
                            AppMetricRow(
                                label: "Type",
                                value: staff.employmentType?.displayName ?? "Not set",
                                icon: "briefcase"
                            )
                            AppDivider()
                            AppMetricRow(
                                label: "Compensation",
                                value: staff.compensationType.displayName,
                                icon: "dollarsign.circle"
                            )
                            if let hourlyRate = staff.hourlyRate, hourlyRate > 0 {
                                AppDivider()
                                AppMetricRow(
                                    label: "Hourly Rate",
                                    value: "$\(String(format: "%.2f", hourlyRate))",
                                    icon: "clock"
                                )
                            }
                            if let commissionPct = staff.commissionPct, commissionPct > 0 {
                                AppDivider()
                                AppMetricRow(
                                    label: "Commission",
                                    value: "\(String(format: "%.0f", commissionPct))%",
                                    icon: "percent"
                                )
                            }
                        }
                        .padding(Spacing.md)
                        .background(Color.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                        .appShadow(.soft)
                    }
                    .padding(.horizontal, Spacing.lg)

                    // Specialties
                    if let specialties = staff.specialties, !specialties.isEmpty {
                        VStack(alignment: .leading, spacing: Spacing.md) {
                            Text("Specialties")
                                .font(.appTitle3)
                                .foregroundColor(.charcoal)

                            FlowLayout(spacing: Spacing.sm) {
                                ForEach(specialties, id: \.self) { specialty in
                                    Text(specialty)
                                        .font(.appCaption)
                                        .foregroundColor(.roseGold)
                                        .padding(.horizontal, Spacing.md)
                                        .padding(.vertical, Spacing.sm)
                                        .background(Color.roseGold.opacity(0.15))
                                        .clipShape(Capsule())
                                }
                            }
                        }
                        .padding(.horizontal, Spacing.lg)
                    }

                    // Bio
                    if let bio = staff.bio, !bio.isEmpty {
                        VStack(alignment: .leading, spacing: Spacing.md) {
                            Text("About")
                                .font(.appTitle3)
                                .foregroundColor(.charcoal)

                            Text(bio)
                                .font(.appBody)
                                .foregroundColor(.charcoal)
                                .padding(Spacing.md)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.cardBackground)
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                                .appShadow(.soft)
                        }
                        .padding(.horizontal, Spacing.lg)
                    }
                }
                .padding(.bottom, Spacing.xl)
            }
            .background(Color.screenBackground)
            .navigationTitle("Staff Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(.roseGold)
                }
            }
        }
        .task {
            await viewModel.loadPerformance(staffId: staff.id)
        }
    }
}

struct StaffStatCard: View {
    let title: String
    let value: String
    let icon: String
    let gradient: LinearGradient

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 40, height: 40)
                .background(gradient)
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous))

            Text(value)
                .font(.appTitle3)
                .foregroundColor(.charcoal)

            Text(title)
                .font(.appCaption)
                .foregroundColor(.softGray)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .appShadow(.soft)
    }
}

// Simple flow layout for specialties
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var height: CGFloat = 0
        var rowWidth: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if rowWidth + size.width > width {
                height += rowHeight + spacing
                rowWidth = size.width + spacing
                rowHeight = size.height
            } else {
                rowWidth += size.width + spacing
                rowHeight = max(rowHeight, size.height)
            }
        }
        height += rowHeight
        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: .unspecified)
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

struct EmptyStaffView: View {
    var body: some View {
        AppEmptyState(
            icon: "person.3",
            title: "No Staff Members",
            message: "Add your team members to manage schedules"
        )
        .frame(maxHeight: .infinity)
        .background(Color.screenBackground)
    }
}

// MARK: - ViewModels

@MainActor
class StaffViewModel: ObservableObject {
    @Published var staffMembers: [Staff] = []
    @Published var isLoading = false

    func loadStaff() async {
        isLoading = true
        do {
            staffMembers = try await APIClient.shared.get("/staff")
        } catch {
            print("Failed to load staff: \(error)")
        }
        isLoading = false
    }
}

struct StaffPerformanceStats: Codable {
    let appointmentsToday: Int
    let appointmentsWeek: Int
    let revenueToday: Double
    let revenueWeek: Double
    let revenueMonth: Double
    let clientsServed: Int
    let avgServiceTime: Int?

    enum CodingKeys: String, CodingKey {
        case appointmentsToday, appointmentsWeek, revenueToday, revenueWeek, revenueMonth, clientsServed, avgServiceTime
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        appointmentsToday = try container.decodeIfPresent(Int.self, forKey: .appointmentsToday) ?? 0
        appointmentsWeek = try container.decodeIfPresent(Int.self, forKey: .appointmentsWeek) ?? 0
        revenueToday = try container.decodeFlexibleDoubleIfPresent(forKey: .revenueToday) ?? 0
        revenueWeek = try container.decodeFlexibleDoubleIfPresent(forKey: .revenueWeek) ?? 0
        revenueMonth = try container.decodeFlexibleDoubleIfPresent(forKey: .revenueMonth) ?? 0
        clientsServed = try container.decodeIfPresent(Int.self, forKey: .clientsServed) ?? 0
        avgServiceTime = try container.decodeIfPresent(Int.self, forKey: .avgServiceTime)
    }
}

@MainActor
class StaffDetailViewModel: ObservableObject {
    @Published var stats: StaffPerformanceStats?
    @Published var isLoading = false

    var formattedMonthlyRevenue: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: stats?.revenueMonth ?? 0)) ?? "$0"
    }

    func loadPerformance(staffId: String) async {
        isLoading = true
        do {
            stats = try await APIClient.shared.get("/reports/staff-performance?staffId=\(staffId)")
        } catch {
            print("Failed to load staff performance: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    StaffView()
}
