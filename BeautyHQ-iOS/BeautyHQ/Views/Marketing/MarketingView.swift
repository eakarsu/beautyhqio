import SwiftUI

struct MarketingView: View {
    @StateObject private var viewModel = MarketingViewModel()
    @State private var selectedTab = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab Selector
                Picker("", selection: $selectedTab) {
                    Text("Campaigns").tag(0)
                    Text("Templates").tag(1)
                    Text("Analytics").tag(2)
                }
                .pickerStyle(.segmented)
                .padding()

                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxHeight: .infinity)
                } else {
                    TabView(selection: $selectedTab) {
                        CampaignsTab(campaigns: viewModel.campaigns)
                            .tag(0)
                        TemplatesTab(templates: viewModel.templates)
                            .tag(1)
                        AnalyticsTab(analytics: viewModel.analytics)
                            .tag(2)
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))
                }
            }
            .navigationTitle("Marketing")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        // Create campaign
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                await viewModel.loadData()
            }
        }
        .task {
            await viewModel.loadData()
        }
    }
}

struct CampaignsTab: View {
    let campaigns: [Campaign]

    var body: some View {
        if campaigns.isEmpty {
            VStack(spacing: 16) {
                Image(systemName: "megaphone")
                    .font(.system(size: 50))
                    .foregroundColor(.gray)
                Text("No Campaigns")
                    .font(.title2)
                    .fontWeight(.semibold)
                Text("Create your first marketing campaign")
                    .foregroundColor(.secondary)
            }
        } else {
            List(campaigns) { campaign in
                CampaignRow(campaign: campaign)
            }
            .listStyle(.plain)
        }
    }
}

struct CampaignRow: View {
    let campaign: Campaign

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(campaign.name)
                    .font(.headline)
                Spacer()
                StatusBadgeView(status: campaign.status)
            }

            Text(campaign.type)
                .font(.caption)
                .foregroundColor(.secondary)

            HStack(spacing: 16) {
                Label("\(campaign.sent)", systemImage: "paperplane")
                Label("\(campaign.opened)", systemImage: "envelope.open")
                Label("\(campaign.clicked)", systemImage: "hand.tap")
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

struct StatusBadgeView: View {
    let status: String

    var color: Color {
        switch status.lowercased() {
        case "active": return .green
        case "draft": return .gray
        case "completed": return .blue
        case "paused": return .orange
        default: return .gray
        }
    }

    var body: some View {
        Text(status)
            .font(.caption)
            .foregroundColor(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .cornerRadius(8)
    }
}

struct TemplatesTab: View {
    let templates: [MarketingTemplate]

    var body: some View {
        if templates.isEmpty {
            VStack(spacing: 16) {
                Image(systemName: "doc.text")
                    .font(.system(size: 50))
                    .foregroundColor(.gray)
                Text("No Templates")
                    .font(.title2)
                    .fontWeight(.semibold)
            }
        } else {
            List(templates) { template in
                VStack(alignment: .leading, spacing: 4) {
                    Text(template.name)
                        .font(.headline)
                    Text(template.type)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .listStyle(.plain)
        }
    }
}

struct AnalyticsTab: View {
    let analytics: MarketingAnalytics?

    var body: some View {
        List {
            Section("Overview") {
                HStack {
                    AnalyticCard(title: "Total Sent", value: "\(analytics?.totalSent ?? 0)")
                    AnalyticCard(title: "Open Rate", value: analytics?.openRate ?? "0%")
                }
                HStack {
                    AnalyticCard(title: "Click Rate", value: analytics?.clickRate ?? "0%")
                    AnalyticCard(title: "Conversions", value: "\(analytics?.conversions ?? 0)")
                }
            }
        }
        .listStyle(.insetGrouped)
    }
}

struct AnalyticCard: View {
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 8) {
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Models
struct Campaign: Identifiable, Codable {
    let id: String
    let name: String
    let type: String
    let status: String
    let subject: String?
    let content: String?
    let sentCount: Int?
    let openCount: Int?
    let clickCount: Int?
    let scheduledAt: Date?
    let sentAt: Date?

    // Convenience for views
    var sent: Int { sentCount ?? 0 }
    var opened: Int { openCount ?? 0 }
    var clicked: Int { clickCount ?? 0 }
}

struct MarketingTemplate: Identifiable, Codable {
    let id: String
    let name: String
    let type: String
}

struct MarketingAnalytics: Codable {
    let totalSent: Int
    let openRate: String
    let clickRate: String
    let conversions: Int
}

@MainActor
class MarketingViewModel: ObservableObject {
    @Published var campaigns: [Campaign] = []
    @Published var templates: [MarketingTemplate] = []
    @Published var analytics: MarketingAnalytics?
    @Published var isLoading = false

    func loadData() async {
        isLoading = true
        do {
            campaigns = try await APIClient.shared.get("/marketing/campaigns")
            // Calculate analytics from campaigns
            let totalSent = campaigns.reduce(0) { $0 + $1.sent }
            let totalOpened = campaigns.reduce(0) { $0 + $1.opened }
            let totalClicked = campaigns.reduce(0) { $0 + $1.clicked }
            let openRate = totalSent > 0 ? "\(Int(Double(totalOpened) / Double(totalSent) * 100))%" : "0%"
            let clickRate = totalSent > 0 ? "\(Int(Double(totalClicked) / Double(totalSent) * 100))%" : "0%"
            analytics = MarketingAnalytics(totalSent: totalSent, openRate: openRate, clickRate: clickRate, conversions: totalClicked)
        } catch {
            print("Failed to load campaigns: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    MarketingView()
}
