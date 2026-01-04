import SwiftUI

struct GiftCardsView: View {
    @StateObject private var viewModel = GiftCardsViewModel()
    @State private var showingCreateGiftCard = false

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    List {
                        // Stats Section
                        Section {
                            GiftCardStatsView(stats: viewModel.stats)
                        }

                        // Active Gift Cards
                        Section("Active Gift Cards") {
                            if viewModel.giftCards.isEmpty {
                                Text("No gift cards issued yet")
                                    .foregroundColor(.secondary)
                            } else {
                                ForEach(viewModel.giftCards) { card in
                                    GiftCardRow(giftCard: card)
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Gift Cards")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingCreateGiftCard = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                await viewModel.loadData()
            }
            .sheet(isPresented: $showingCreateGiftCard) {
                AddGiftCardView {
                    Task { await viewModel.loadData() }
                }
            }
        }
        .task {
            await viewModel.loadData()
        }
    }
}

struct GiftCardStatsView: View {
    let stats: GiftCardStats?

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: "giftcard.fill")
                    .font(.title)
                    .foregroundColor(.pink)
                Text("Gift Card Summary")
                    .font(.headline)
                Spacer()
            }

            HStack(spacing: 24) {
                GiftCardStatItem(value: "\(stats?.totalIssued ?? 0)", label: "Issued")
                GiftCardStatItem(value: stats?.totalValue ?? "$0", label: "Total Value")
                GiftCardStatItem(value: stats?.redeemed ?? "$0", label: "Redeemed")
            }
        }
        .padding(.vertical, 8)
    }
}

struct GiftCardStatItem: View {
    let value: String
    let label: String

    var body: some View {
        VStack {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct GiftCardRow: View {
    let giftCard: GiftCard

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(giftCard.code)
                    .font(.headline)
                    .fontDesign(.monospaced)
                Text("Purchased by \(giftCard.purchasedByName)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(giftCard.formattedBalance)
                    .font(.headline)
                    .foregroundColor(.green)
                Text("of \(giftCard.formattedOriginal)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Models
struct GiftCardStats: Codable {
    let totalIssued: Int
    let totalValue: String
    let redeemed: String
}

struct GiftCardClient: Codable {
    let id: String
    let firstName: String
    let lastName: String
}

struct GiftCard: Identifiable, Codable {
    let id: String
    let code: String
    let initialBalance: Double
    let currentBalance: Double
    let status: String?
    let recipientName: String?
    let recipientEmail: String?
    let message: String?
    let isDigital: Bool?
    let purchasedAt: Date?
    let expiresAt: Date?
    let purchasedBy: GiftCardClient?

    // Custom decoder to handle Prisma Decimal (returns string)
    enum CodingKeys: String, CodingKey {
        case id, code, initialBalance, currentBalance, status
        case recipientName, recipientEmail, message, isDigital
        case purchasedAt, expiresAt, purchasedBy
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        code = try container.decode(String.self, forKey: .code)
        initialBalance = try container.decodeFlexibleDouble(forKey: .initialBalance)
        currentBalance = try container.decodeFlexibleDouble(forKey: .currentBalance)
        status = try container.decodeIfPresent(String.self, forKey: .status)
        recipientName = try container.decodeIfPresent(String.self, forKey: .recipientName)
        recipientEmail = try container.decodeIfPresent(String.self, forKey: .recipientEmail)
        message = try container.decodeIfPresent(String.self, forKey: .message)
        isDigital = try container.decodeIfPresent(Bool.self, forKey: .isDigital)
        purchasedAt = try container.decodeIfPresent(Date.self, forKey: .purchasedAt)
        expiresAt = try container.decodeIfPresent(Date.self, forKey: .expiresAt)
        purchasedBy = try container.decodeIfPresent(GiftCardClient.self, forKey: .purchasedBy)
    }

    var formattedBalance: String {
        "$\(String(format: "%.2f", currentBalance))"
    }

    var formattedOriginal: String {
        "$\(String(format: "%.2f", initialBalance))"
    }

    var purchasedByName: String {
        if let client = purchasedBy {
            return "\(client.firstName) \(client.lastName)"
        }
        return recipientName ?? "Unknown"
    }
}

@MainActor
class GiftCardsViewModel: ObservableObject {
    @Published var stats: GiftCardStats?
    @Published var giftCards: [GiftCard] = []
    @Published var isLoading = false

    func loadData() async {
        isLoading = true
        do {
            giftCards = try await APIClient.shared.get("/gift-cards")
            // Calculate stats from gift cards
            let total = giftCards.count
            let totalValue = giftCards.reduce(0.0) { $0 + $1.initialBalance }
            let redeemed = giftCards.reduce(0.0) { $0 + ($1.initialBalance - $1.currentBalance) }
            stats = GiftCardStats(
                totalIssued: total,
                totalValue: "$\(String(format: "%.0f", totalValue))",
                redeemed: "$\(String(format: "%.0f", redeemed))"
            )
        } catch {
            print("Failed to load gift cards: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    GiftCardsView()
}
