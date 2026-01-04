import SwiftUI

struct SalesCRMView: View {
    @StateObject private var viewModel = SalesCRMViewModel()
    @State private var selectedTab = 0
    @State private var showingAddDeal = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab Selector
                Picker("", selection: $selectedTab) {
                    Text("Pipeline").tag(0)
                    Text("Activities").tag(1)
                    Text("Deals").tag(2)
                }
                .pickerStyle(.segmented)
                .padding()

                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxHeight: .infinity)
                } else {
                    TabView(selection: $selectedTab) {
                        PipelineTab(stages: viewModel.pipelineStages)
                            .tag(0)
                        ActivitiesTab(activities: viewModel.activities)
                            .tag(1)
                        DealsTab(deals: viewModel.deals)
                            .tag(2)
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))
                }
            }
            .navigationTitle("Sales CRM")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddDeal = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                await viewModel.loadData()
            }
            .sheet(isPresented: $showingAddDeal) {
                AddDealView {
                    Task { await viewModel.loadData() }
                }
            }
        }
        .task {
            await viewModel.loadData()
        }
    }
}

struct PipelineTab: View {
    let stages: [PipelineStage]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                ForEach(stages) { stage in
                    PipelineStageCard(stage: stage)
                }
            }
            .padding()
        }
    }
}

struct PipelineStageCard: View {
    let stage: PipelineStage

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Circle()
                    .fill(stage.color)
                    .frame(width: 12, height: 12)
                Text(stage.name)
                    .font(.headline)
                Spacer()
                Text("\(stage.count)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Text(stage.value)
                .font(.title2)
                .fontWeight(.bold)

            if !stage.deals.isEmpty {
                ForEach(stage.deals) { deal in
                    HStack {
                        Text(deal.name)
                            .font(.subheadline)
                        Spacer()
                        Text(deal.value)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
}

struct ActivitiesTab: View {
    let activities: [CRMActivity]

    var body: some View {
        if activities.isEmpty {
            VStack(spacing: 16) {
                Image(systemName: "clock")
                    .font(.system(size: 50))
                    .foregroundColor(.gray)
                Text("No Recent Activities")
                    .font(.title2)
                    .fontWeight(.semibold)
            }
            .frame(maxHeight: .infinity)
        } else {
            List(activities) { activity in
                ActivityRow(activity: activity)
            }
            .listStyle(.plain)
        }
    }
}

struct ActivityRow: View {
    let activity: CRMActivity

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: activity.icon)
                .foregroundColor(activity.iconColor)
                .frame(width: 36, height: 36)
                .background(activity.iconColor.opacity(0.15))
                .cornerRadius(8)

            VStack(alignment: .leading, spacing: 4) {
                Text(activity.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(activity.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(activity.time, style: .relative)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

struct DealsTab: View {
    let deals: [Deal]

    var body: some View {
        if deals.isEmpty {
            VStack(spacing: 16) {
                Image(systemName: "briefcase")
                    .font(.system(size: 50))
                    .foregroundColor(.gray)
                Text("No Deals")
                    .font(.title2)
                    .fontWeight(.semibold)
            }
            .frame(maxHeight: .infinity)
        } else {
            List(deals) { deal in
                DealRow(deal: deal)
            }
            .listStyle(.plain)
        }
    }
}

struct DealRow: View {
    let deal: Deal

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(deal.name)
                    .font(.headline)
                Spacer()
                Text(deal.value)
                    .fontWeight(.semibold)
                    .foregroundColor(.green)
            }

            HStack {
                Label(deal.contact, systemImage: "person")
                Spacer()
                Text(deal.stage)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.purple.opacity(0.15))
                    .foregroundColor(.purple)
                    .cornerRadius(8)
            }
            .font(.caption)
            .foregroundColor(.secondary)

            ProgressView(value: deal.probability / 100)
                .tint(.purple)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Models
struct PipelineStage: Identifiable {
    let id: String
    let name: String
    let count: Int
    let value: String
    let color: Color
    let deals: [Deal]
}

struct Deal: Identifiable, Codable {
    let id: String
    let name: String
    let value: String
    let contact: String
    let stage: String
    let probability: Double
}

struct CRMActivity: Identifiable {
    let id: String
    let title: String
    let description: String
    let icon: String
    let iconColor: Color
    let time: Date
}

// CRM API Response
struct CRMLeadsResponse: Codable {
    let leads: [CRMLead]
    let stats: CRMStats
}

struct CRMLead: Identifiable, Codable {
    let id: String
    let businessName: String?
    let contactName: String?
    let contactEmail: String?
    let contactPhone: String?
    let status: String
    let source: String?
    let notes: String?
    let estimatedValue: Double?
    let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, businessName, contactName, contactEmail, contactPhone
        case status, source, notes, estimatedValue, createdAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        businessName = try container.decodeIfPresent(String.self, forKey: .businessName)
        contactName = try container.decodeIfPresent(String.self, forKey: .contactName)
        contactEmail = try container.decodeIfPresent(String.self, forKey: .contactEmail)
        contactPhone = try container.decodeIfPresent(String.self, forKey: .contactPhone)
        status = try container.decode(String.self, forKey: .status)
        source = try container.decodeIfPresent(String.self, forKey: .source)
        notes = try container.decodeIfPresent(String.self, forKey: .notes)
        estimatedValue = try container.decodeFlexibleDoubleIfPresent(forKey: .estimatedValue)
        createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt)
    }
}

struct CRMStats: Codable {
    let total: Int
    let new: Int
    let contacted: Int
    let demoScheduled: Int
    let trial: Int
    let converted: Int
    let lost: Int
}

@MainActor
class SalesCRMViewModel: ObservableObject {
    @Published var pipelineStages: [PipelineStage] = []
    @Published var activities: [CRMActivity] = []
    @Published var deals: [Deal] = []
    @Published var isLoading = false

    func loadData() async {
        isLoading = true
        do {
            let response: CRMLeadsResponse = try await APIClient.shared.get("/crm/leads")

            // Build pipeline stages from stats
            pipelineStages = [
                PipelineStage(id: "new", name: "New", count: response.stats.new, value: "", color: .blue, deals: []),
                PipelineStage(id: "contacted", name: "Contacted", count: response.stats.contacted, value: "", color: .orange, deals: []),
                PipelineStage(id: "demo", name: "Demo Scheduled", count: response.stats.demoScheduled, value: "", color: .purple, deals: []),
                PipelineStage(id: "trial", name: "Trial", count: response.stats.trial, value: "", color: .cyan, deals: []),
                PipelineStage(id: "converted", name: "Converted", count: response.stats.converted, value: "", color: .green, deals: []),
                PipelineStage(id: "lost", name: "Lost", count: response.stats.lost, value: "", color: .red, deals: [])
            ]

            // Convert leads to deals
            deals = response.leads.map { lead in
                Deal(
                    id: lead.id,
                    name: lead.businessName ?? lead.contactName ?? "Unknown",
                    value: lead.estimatedValue.map { "$\(String(format: "%.0f", $0))" } ?? "",
                    contact: lead.contactName ?? lead.contactEmail ?? "",
                    stage: lead.status.capitalized,
                    probability: statusToProbability(lead.status)
                )
            }
        } catch {
            print("Failed to load CRM data: \(error)")
            // Show empty pipeline stages
            pipelineStages = [
                PipelineStage(id: "new", name: "New", count: 0, value: "", color: .blue, deals: []),
                PipelineStage(id: "contacted", name: "Contacted", count: 0, value: "", color: .orange, deals: []),
                PipelineStage(id: "demo", name: "Demo Scheduled", count: 0, value: "", color: .purple, deals: []),
                PipelineStage(id: "converted", name: "Converted", count: 0, value: "", color: .green, deals: [])
            ]
        }
        isLoading = false
    }

    private func statusToProbability(_ status: String) -> Double {
        switch status.lowercased() {
        case "new": return 10
        case "contacted": return 25
        case "demo_scheduled": return 50
        case "trial": return 75
        case "converted": return 100
        case "lost": return 0
        default: return 20
        }
    }
}

// MARK: - Add Deal View
struct AddDealView: View {
    let onSave: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var dealName = ""
    @State private var contactName = ""
    @State private var value = ""
    @State private var selectedStage = "New"

    let stages = ["New", "Contacted", "Demo Scheduled", "Trial", "Converted"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Deal Information") {
                    TextField("Deal Name", text: $dealName)
                    TextField("Contact Name", text: $contactName)
                    TextField("Value ($)", text: $value)
                        .keyboardType(.decimalPad)
                }

                Section("Stage") {
                    Picker("Select Stage", selection: $selectedStage) {
                        ForEach(stages, id: \.self) { stage in
                            Text(stage).tag(stage)
                        }
                    }
                }
            }
            .navigationTitle("Add Deal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave()
                        dismiss()
                    }
                    .disabled(dealName.isEmpty)
                }
            }
        }
    }
}

#Preview {
    SalesCRMView()
}
