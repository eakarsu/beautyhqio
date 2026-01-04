import SwiftUI

struct LoyaltyView: View {
    @StateObject private var viewModel = LoyaltyViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    List {
                        // Program Overview
                        Section {
                            LoyaltyProgramCard(program: viewModel.program)
                        }

                        // Top Members
                        Section("Top Members") {
                            if viewModel.topMembers.isEmpty {
                                Text("No loyalty members yet")
                                    .foregroundColor(.secondary)
                            } else {
                                ForEach(viewModel.topMembers) { member in
                                    LoyaltyMemberRow(member: member)
                                }
                            }
                        }

                        // Recent Rewards
                        Section("Recent Rewards") {
                            if viewModel.recentRewards.isEmpty {
                                Text("No rewards redeemed yet")
                                    .foregroundColor(.secondary)
                            } else {
                                ForEach(viewModel.recentRewards) { reward in
                                    RewardRow(reward: reward)
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Loyalty Program")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        // Settings
                    } label: {
                        Image(systemName: "gearshape")
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

struct LoyaltyProgramCard: View {
    let program: LoyaltyProgram?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "star.circle.fill")
                    .font(.title)
                    .foregroundColor(.yellow)
                Text(program?.name ?? "Loyalty Program")
                    .font(.title2)
                    .fontWeight(.bold)
            }

            HStack(spacing: 24) {
                VStack {
                    Text("\(program?.totalMembers ?? 0)")
                        .font(.title)
                        .fontWeight(.bold)
                    Text("Members")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                VStack {
                    Text("\(program?.pointsIssued ?? 0)")
                        .font(.title)
                        .fontWeight(.bold)
                    Text("Points Issued")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                VStack {
                    Text("\(program?.rewardsRedeemed ?? 0)")
                        .font(.title)
                        .fontWeight(.bold)
                    Text("Redeemed")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 8)
    }
}

struct LoyaltyMemberRow: View {
    let member: LoyaltyMember

    var body: some View {
        HStack {
            Circle()
                .fill(Color.purple.opacity(0.2))
                .frame(width: 40, height: 40)
                .overlay(
                    Text(member.initials)
                        .font(.subheadline)
                        .foregroundColor(.purple)
                )

            VStack(alignment: .leading) {
                Text(member.name)
                    .font(.headline)
                Text("\(member.points) points")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(member.tier)
                .font(.caption)
                .foregroundColor(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(tierColor(member.tier))
                .cornerRadius(8)
        }
    }

    func tierColor(_ tier: String) -> Color {
        switch tier.lowercased() {
        case "gold": return .yellow
        case "silver": return .gray
        case "platinum": return .purple
        default: return .blue
        }
    }
}

struct RewardRow: View {
    let reward: LoyaltyReward

    var body: some View {
        HStack {
            Image(systemName: "gift.fill")
                .foregroundColor(.pink)

            VStack(alignment: .leading) {
                Text(reward.name)
                    .font(.headline)
                Text(reward.redeemedBy)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text("-\(reward.pointsCost) pts")
                .font(.subheadline)
                .foregroundColor(.red)
        }
    }
}

// MARK: - Models
struct LoyaltyAccountClient: Codable {
    let id: String
    let firstName: String
    let lastName: String
}

struct LoyaltyAccount: Identifiable, Codable {
    let id: String
    let pointsBalance: Int
    let lifetimePoints: Int
    let tier: String?
    let client: LoyaltyAccountClient?

    var name: String {
        guard let client = client else { return "Unknown" }
        return "\(client.firstName) \(client.lastName)"
    }

    var initials: String {
        guard let client = client else { return "?" }
        let first = client.firstName.prefix(1)
        let last = client.lastName.prefix(1)
        return "\(first)\(last)".uppercased()
    }
}

struct LoyaltyRewardItem: Identifiable, Codable {
    let id: String
    let name: String
    let pointsCost: Int
    let description: String?
    let isActive: Bool?
}

struct LoyaltyProgramResponse: Codable {
    let id: String
    let name: String
    let pointsPerDollar: Int?
    let isActive: Bool?
    let rewards: [LoyaltyRewardItem]?
    let accounts: [LoyaltyAccount]?

    enum CodingKeys: String, CodingKey {
        case id, name, pointsPerDollar, isActive, rewards, accounts
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        isActive = try container.decodeIfPresent(Bool.self, forKey: .isActive)
        rewards = try container.decodeIfPresent([LoyaltyRewardItem].self, forKey: .rewards)
        accounts = try container.decodeIfPresent([LoyaltyAccount].self, forKey: .accounts)

        // pointsPerDollar is returned as string by Prisma
        if let intValue = try? container.decode(Int.self, forKey: .pointsPerDollar) {
            pointsPerDollar = intValue
        } else if let stringValue = try? container.decode(String.self, forKey: .pointsPerDollar),
                  let intValue = Int(stringValue) {
            pointsPerDollar = intValue
        } else {
            pointsPerDollar = nil
        }
    }
}

struct LoyaltyProgram: Codable {
    let name: String
    let totalMembers: Int
    let pointsIssued: Int
    let rewardsRedeemed: Int
}

struct LoyaltyMember: Identifiable, Codable {
    let id: String
    let name: String
    let points: Int
    let tier: String

    var initials: String {
        let parts = name.components(separatedBy: " ")
        return parts.map { String($0.prefix(1)) }.joined().uppercased()
    }
}

struct LoyaltyReward: Identifiable, Codable {
    let id: String
    let name: String
    let pointsCost: Int
    let redeemedBy: String
}

@MainActor
class LoyaltyViewModel: ObservableObject {
    @Published var program: LoyaltyProgram?
    @Published var topMembers: [LoyaltyMember] = []
    @Published var recentRewards: [LoyaltyReward] = []
    @Published var isLoading = false

    func loadData() async {
        isLoading = true
        do {
            // API now returns first loyalty program if no businessId provided
            let response: LoyaltyProgramResponse? = try await APIClient.shared.get("/loyalty")

            if let response = response {
                let accounts = response.accounts ?? []
                let totalPoints = accounts.reduce(0) { $0 + $1.lifetimePoints }

                program = LoyaltyProgram(
                    name: response.name,
                    totalMembers: accounts.count,
                    pointsIssued: totalPoints,
                    rewardsRedeemed: 0
                )

                // Convert accounts to members for display
                topMembers = accounts.prefix(10).map { account in
                    LoyaltyMember(
                        id: account.id,
                        name: account.name,
                        points: account.pointsBalance,
                        tier: account.tier ?? "Bronze"
                    )
                }

                // Convert rewards
                recentRewards = (response.rewards ?? []).prefix(5).map { reward in
                    LoyaltyReward(
                        id: reward.id,
                        name: reward.name,
                        pointsCost: reward.pointsCost,
                        redeemedBy: ""
                    )
                }
            }
        } catch {
            print("Failed to load loyalty program: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    LoyaltyView()
}
