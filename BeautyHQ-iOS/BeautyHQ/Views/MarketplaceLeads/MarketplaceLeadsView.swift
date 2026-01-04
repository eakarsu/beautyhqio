import SwiftUI

struct MarketplaceLeadsView: View {
    @StateObject private var viewModel = MarketplaceLeadsViewModel()
    @State private var selectedFilter = "All"

    let filters = ["All", "New", "Viewed", "Booking", "Booked", "Completed"]

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    AppLoadingView()
                } else if viewModel.leads.isEmpty {
                    EmptyLeadsView()
                } else {
                    VStack(spacing: 0) {
                        // Stats Summary
                        LeadsStatsBar(stats: viewModel.stats)
                            .padding(.horizontal, Spacing.lg)
                            .padding(.top, Spacing.md)

                        // Filter Pills
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: Spacing.sm) {
                                ForEach(filters, id: \.self) { filter in
                                    AppFilterChip(
                                        label: filter,
                                        isSelected: selectedFilter == filter
                                    ) {
                                        selectedFilter = filter
                                    }
                                }
                            }
                            .padding(.horizontal, Spacing.lg)
                            .padding(.vertical, Spacing.md)
                        }

                        // Leads List
                        ScrollView {
                            VStack(spacing: Spacing.sm) {
                                ForEach(filteredLeads) { lead in
                                    MarketplaceLeadRow(lead: lead)
                                }
                            }
                            .padding(.horizontal, Spacing.lg)
                            .padding(.bottom, Spacing.xl)
                        }
                    }
                    .background(Color.screenBackground)
                }
            }
            .navigationTitle("Marketplace Leads")
            .refreshable {
                await viewModel.loadLeads()
            }
        }
        .task {
            await viewModel.loadLeads()
        }
    }

    var filteredLeads: [MarketplaceLead] {
        if selectedFilter == "All" { return viewModel.leads }
        return viewModel.leads.filter { lead in
            switch selectedFilter {
            case "New": return lead.status == "NEW"
            case "Viewed": return lead.status == "VIEWED_PROFILE"
            case "Booking": return lead.status == "STARTED_BOOKING"
            case "Booked": return lead.status == "BOOKED"
            case "Completed": return lead.status == "COMPLETED"
            default: return true
            }
        }
    }
}

// MARK: - Stats Bar
struct LeadsStatsBar: View {
    let stats: LeadsStats?

    var body: some View {
        HStack(spacing: Spacing.lg) {
            LeadStatItem(value: "\(stats?.total ?? 0)", label: "Total", gradient: .roseGoldGradient)
            LeadStatItem(value: "\(stats?.new ?? 0)", label: "New", gradient: .deepRoseGradient)
            LeadStatItem(value: "\(stats?.booked ?? 0)", label: "Booked", gradient: .goldGradient)
            LeadStatItem(value: "\(stats?.completed ?? 0)", label: "Completed", gradient: .successGradient)
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .appShadow(.soft)
    }
}

struct LeadStatItem: View {
    let value: String
    let label: String
    let gradient: LinearGradient

    var body: some View {
        VStack(spacing: Spacing.xs) {
            Text(value)
                .font(.appTitle3)
                .foregroundStyle(gradient)
            Text(label)
                .font(.appCaption2)
                .foregroundColor(.softGray)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Lead Row
struct MarketplaceLeadRow: View {
    let lead: MarketplaceLead

    var statusColor: Color {
        switch lead.status {
        case "NEW": return .roseGold
        case "VIEWED_PROFILE": return .deepRose
        case "STARTED_BOOKING": return .warning
        case "BOOKED": return .champagneGold
        case "COMPLETED": return .success
        case "CANCELLED", "NO_SHOW": return .error
        default: return .softGray
        }
    }

    var statusLabel: String {
        switch lead.status {
        case "NEW": return "New"
        case "VIEWED_PROFILE": return "Viewed"
        case "STARTED_BOOKING": return "Started Booking"
        case "BOOKED": return "Booked"
        case "COMPLETED": return "Completed"
        case "CANCELLED": return "Cancelled"
        case "NO_SHOW": return "No Show"
        default: return lead.status
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            // Header with client info and status
            HStack {
                // Client Avatar
                ZStack {
                    Circle()
                        .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                        .frame(width: 44, height: 44)

                    if let client = lead.client {
                        Text(String(client.firstName?.prefix(1) ?? "") + String(client.lastName?.prefix(1) ?? ""))
                            .font(.appHeadline)
                            .foregroundColor(.roseGold)
                    } else {
                        Image(systemName: "person.fill")
                            .foregroundColor(.roseGold)
                    }
                }

                VStack(alignment: .leading, spacing: Spacing.xs) {
                    if let client = lead.client {
                        Text("\(client.firstName ?? "") \(client.lastName ?? "")")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)
                        if let email = client.email {
                            Text(email)
                                .font(.appCaption)
                                .foregroundColor(.softGray)
                        }
                    } else {
                        Text("Anonymous Visitor")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)
                        Text("Session: \(lead.sessionId.prefix(12))...")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                    }
                }

                Spacer()

                // Status Badge
                Text(statusLabel)
                    .font(.appCaption2)
                    .foregroundColor(statusColor)
                    .padding(.horizontal, Spacing.sm)
                    .padding(.vertical, 4)
                    .background(statusColor.opacity(0.15))
                    .clipShape(Capsule())
            }

            // Source and search query
            HStack(spacing: Spacing.md) {
                Label(formatSource(lead.source), systemImage: sourceIcon(lead.source))
                    .font(.appCaption)
                    .foregroundColor(.softGray)

                if let query = lead.searchQuery {
                    Text("• \"\(query)\"")
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .lineLimit(1)
                }
            }

            // UTM Data if available
            if lead.utmSource != nil || lead.utmCampaign != nil {
                HStack(spacing: Spacing.sm) {
                    if let utmSource = lead.utmSource {
                        Text(utmSource)
                            .font(.appCaption2)
                            .foregroundColor(.charcoal)
                            .padding(.horizontal, Spacing.sm)
                            .padding(.vertical, 2)
                            .background(Color.blushPink.opacity(0.3))
                            .clipShape(Capsule())
                    }
                    if let utmMedium = lead.utmMedium {
                        Text(utmMedium)
                            .font(.appCaption2)
                            .foregroundColor(.charcoal)
                            .padding(.horizontal, Spacing.sm)
                            .padding(.vertical, 2)
                            .background(Color.blushPink.opacity(0.3))
                            .clipShape(Capsule())
                    }
                    if let campaign = lead.utmCampaign {
                        Text(campaign)
                            .font(.appCaption2)
                            .foregroundColor(.charcoal)
                            .padding(.horizontal, Spacing.sm)
                            .padding(.vertical, 2)
                            .background(Color.champagneGold.opacity(0.2))
                            .clipShape(Capsule())
                    }
                }
            }

            // Commission info for completed leads
            if lead.status == "COMPLETED", let commission = lead.commissionAmount {
                HStack {
                    Image(systemName: "dollarsign.circle.fill")
                        .foregroundColor(.champagneGold)
                    Text("Commission: $\(String(format: "%.2f", commission))")
                        .font(.appSubheadline)
                        .foregroundColor(.champagneGold)

                    if lead.commissionPaidAt != nil {
                        Text("• Paid")
                            .font(.appCaption)
                            .foregroundColor(.success)
                    }
                }
            }

            // Timeline
            HStack(spacing: Spacing.lg) {
                if let viewedAt = lead.viewedAt {
                    TimelineItem(label: "Viewed", date: viewedAt)
                }
                if let bookedAt = lead.bookedAt {
                    TimelineItem(label: "Booked", date: bookedAt)
                }
                if let completedAt = lead.completedAt {
                    TimelineItem(label: "Completed", date: completedAt)
                }
                Spacer()
                Text(lead.createdAt, style: .relative)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }

            // Action Buttons for leads with client info
            if let client = lead.client {
                HStack(spacing: Spacing.md) {
                    if let phone = client.phone {
                        Button {
                            if let url = URL(string: "tel:\(phone)") {
                                UIApplication.shared.open(url)
                            }
                        } label: {
                            Label("Call", systemImage: "phone.fill")
                                .font(.appCaption)
                                .foregroundColor(.success)
                                .padding(.horizontal, Spacing.md)
                                .padding(.vertical, Spacing.sm)
                                .background(Color.success.opacity(0.15))
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous))
                        }
                    }

                    if let email = client.email {
                        Button {
                            if let url = URL(string: "mailto:\(email)") {
                                UIApplication.shared.open(url)
                            }
                        } label: {
                            Label("Email", systemImage: "envelope.fill")
                                .font(.appCaption)
                                .foregroundColor(.roseGold)
                                .padding(.horizontal, Spacing.md)
                                .padding(.vertical, Spacing.sm)
                                .background(Color.roseGold.opacity(0.15))
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous))
                        }
                    }

                    if lead.status == "STARTED_BOOKING" || lead.status == "VIEWED_PROFILE" {
                        Button {
                            // Follow up action
                        } label: {
                            Label("Follow Up", systemImage: "arrow.turn.up.right")
                                .font(.appCaption)
                                .foregroundColor(.deepRose)
                                .padding(.horizontal, Spacing.md)
                                .padding(.vertical, Spacing.sm)
                                .background(Color.deepRose.opacity(0.15))
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous))
                        }
                    }
                }
            }
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .appShadow(.soft)
    }

    private func formatSource(_ source: String) -> String {
        switch source {
        case "MARKETPLACE_SEARCH": return "Search"
        case "MARKETPLACE_BROWSE": return "Browse"
        case "GOOGLE_ORGANIC": return "Google"
        case "FACEBOOK_ADS": return "Facebook"
        case "REFERRAL_LINK": return "Referral"
        default: return source
        }
    }

    private func sourceIcon(_ source: String) -> String {
        switch source {
        case "MARKETPLACE_SEARCH": return "magnifyingglass"
        case "MARKETPLACE_BROWSE": return "square.grid.2x2"
        case "GOOGLE_ORGANIC": return "globe"
        case "FACEBOOK_ADS": return "megaphone"
        case "REFERRAL_LINK": return "link"
        default: return "globe"
        }
    }
}

struct TimelineItem: View {
    let label: String
    let date: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.appCaption2)
                .foregroundColor(.softGray)
            Text(date, style: .date)
                .font(.appCaption2)
                .foregroundColor(.charcoal)
        }
    }
}

struct EmptyLeadsView: View {
    var body: some View {
        AppEmptyState(
            icon: "person.crop.circle.badge.questionmark",
            title: "No Leads Yet",
            message: "Leads from the marketplace will appear here when customers view your profile or start bookings"
        )
        .frame(maxHeight: .infinity)
        .background(Color.screenBackground)
    }
}

// MARK: - Models
struct MarketplaceLead: Identifiable, Codable {
    let id: String
    let sessionId: String
    let source: String
    let status: String
    let utmSource: String?
    let utmMedium: String?
    let utmCampaign: String?
    let searchQuery: String?
    let viewedAt: Date?
    let bookedAt: Date?
    let completedAt: Date?
    let commissionRate: Double?
    let commissionAmount: Double?
    let commissionPaidAt: Date?
    let createdAt: Date
    let client: LeadClient?
    let location: LeadLocation?
    let appointment: LeadAppointment?

    enum CodingKeys: String, CodingKey {
        case id, sessionId, source, status
        case utmSource, utmMedium, utmCampaign, searchQuery
        case viewedAt, bookedAt, completedAt
        case commissionRate, commissionAmount, commissionPaidAt
        case createdAt, client, location, appointment
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        sessionId = try container.decode(String.self, forKey: .sessionId)
        source = try container.decode(String.self, forKey: .source)
        status = try container.decode(String.self, forKey: .status)
        utmSource = try container.decodeIfPresent(String.self, forKey: .utmSource)
        utmMedium = try container.decodeIfPresent(String.self, forKey: .utmMedium)
        utmCampaign = try container.decodeIfPresent(String.self, forKey: .utmCampaign)
        searchQuery = try container.decodeIfPresent(String.self, forKey: .searchQuery)
        viewedAt = try container.decodeIfPresent(Date.self, forKey: .viewedAt)
        bookedAt = try container.decodeIfPresent(Date.self, forKey: .bookedAt)
        completedAt = try container.decodeIfPresent(Date.self, forKey: .completedAt)
        commissionRate = try container.decodeFlexibleDoubleIfPresent(forKey: .commissionRate)
        commissionAmount = try container.decodeFlexibleDoubleIfPresent(forKey: .commissionAmount)
        commissionPaidAt = try container.decodeIfPresent(Date.self, forKey: .commissionPaidAt)
        createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt) ?? Date()
        client = try container.decodeIfPresent(LeadClient.self, forKey: .client)
        location = try container.decodeIfPresent(LeadLocation.self, forKey: .location)
        appointment = try container.decodeIfPresent(LeadAppointment.self, forKey: .appointment)
    }
}

struct LeadClient: Codable {
    let id: String
    let firstName: String?
    let lastName: String?
    let email: String?
    let phone: String?
}

struct LeadLocation: Codable {
    let id: String
    let name: String?
}

struct LeadAppointment: Codable {
    let id: String
    let scheduledStart: Date?
    let status: String?
}

struct LeadsStats: Codable {
    let total: Int
    let new: Int
    let viewed: Int
    let startedBooking: Int
    let booked: Int
    let completed: Int
    let cancelled: Int
    let noShow: Int
}

struct MarketplaceLeadsResponse: Codable {
    let leads: [MarketplaceLead]
    let total: Int
    let page: Int
    let limit: Int
    let totalPages: Int
}

// MARK: - ViewModel
@MainActor
class MarketplaceLeadsViewModel: ObservableObject {
    @Published var leads: [MarketplaceLead] = []
    @Published var stats: LeadsStats?
    @Published var isLoading = false

    func loadLeads() async {
        isLoading = true
        do {
            // Load leads from the correct endpoint
            let response: MarketplaceLeadsResponse = try await APIClient.shared.get("/business/leads")
            leads = response.leads

            // Calculate stats from leads
            let total = response.total
            let new = leads.filter { $0.status == "NEW" }.count
            let viewed = leads.filter { $0.status == "VIEWED_PROFILE" }.count
            let startedBooking = leads.filter { $0.status == "STARTED_BOOKING" }.count
            let booked = leads.filter { $0.status == "BOOKED" }.count
            let completed = leads.filter { $0.status == "COMPLETED" }.count
            let cancelled = leads.filter { $0.status == "CANCELLED" }.count
            let noShow = leads.filter { $0.status == "NO_SHOW" }.count

            stats = LeadsStats(
                total: total,
                new: new,
                viewed: viewed,
                startedBooking: startedBooking,
                booked: booked,
                completed: completed,
                cancelled: cancelled,
                noShow: noShow
            )
        } catch {
            print("Failed to load marketplace leads: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    MarketplaceLeadsView()
}
