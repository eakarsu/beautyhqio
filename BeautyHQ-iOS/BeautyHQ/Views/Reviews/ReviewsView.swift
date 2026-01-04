import SwiftUI

struct ReviewsView: View {
    @StateObject private var viewModel = ReviewsViewModel()
    @State private var filterRating: Int? = nil

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    List {
                        // Stats Section
                        Section {
                            ReviewStatsCard(stats: viewModel.stats)
                        }

                        // Filter
                        Section {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ReviewFilterChip(title: "All", isSelected: filterRating == nil) {
                                        filterRating = nil
                                    }
                                    ForEach([5, 4, 3, 2, 1], id: \.self) { rating in
                                        ReviewFilterChip(title: "\(rating) Star", isSelected: filterRating == rating) {
                                            filterRating = rating
                                        }
                                    }
                                }
                            }
                        }

                        // Reviews List
                        Section("Recent Reviews") {
                            if filteredReviews.isEmpty {
                                Text("No reviews yet")
                                    .foregroundColor(.secondary)
                            } else {
                                ForEach(filteredReviews) { review in
                                    ReviewRow(review: review)
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Reviews")
            .refreshable {
                await viewModel.loadData()
            }
        }
        .task {
            await viewModel.loadData()
        }
    }

    var filteredReviews: [Review] {
        guard let rating = filterRating else { return viewModel.reviews }
        return viewModel.reviews.filter { $0.rating == rating }
    }
}

struct ReviewStatsCard: View {
    let stats: ReviewStats?

    var body: some View {
        VStack(spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading) {
                    Text(String(format: "%.1f", stats?.averageRating ?? 0))
                        .font(.system(size: 48, weight: .bold))
                    HStack(spacing: 2) {
                        ForEach(1...5, id: \.self) { star in
                            Image(systemName: star <= Int(stats?.averageRating ?? 0) ? "star.fill" : "star")
                                .foregroundColor(.yellow)
                        }
                    }
                    Text("\(stats?.totalReviews ?? 0) reviews")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    RatingBar(label: "5", percentage: stats?.fiveStarPercent ?? 0)
                    RatingBar(label: "4", percentage: stats?.fourStarPercent ?? 0)
                    RatingBar(label: "3", percentage: stats?.threeStarPercent ?? 0)
                    RatingBar(label: "2", percentage: stats?.twoStarPercent ?? 0)
                    RatingBar(label: "1", percentage: stats?.oneStarPercent ?? 0)
                }
            }
        }
        .padding(.vertical, 8)
    }
}

struct RatingBar: View {
    let label: String
    let percentage: Double

    var body: some View {
        HStack(spacing: 4) {
            Text(label)
                .font(.caption)
                .frame(width: 12)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                    Rectangle()
                        .fill(Color.yellow)
                        .frame(width: geo.size.width * percentage / 100)
                }
            }
            .frame(width: 100, height: 8)
            .cornerRadius(4)
        }
    }
}

struct ReviewFilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.purple : Color.gray.opacity(0.2))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(16)
        }
    }
}

struct ReviewRow: View {
    let review: Review

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Circle()
                    .fill(Color.purple.opacity(0.2))
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text(review.clientInitials)
                            .font(.subheadline)
                            .foregroundColor(.purple)
                    )

                VStack(alignment: .leading) {
                    Text(review.clientName)
                        .font(.headline)
                    HStack(spacing: 2) {
                        ForEach(1...5, id: \.self) { star in
                            Image(systemName: star <= review.rating ? "star.fill" : "star")
                                .font(.caption)
                                .foregroundColor(.yellow)
                        }
                    }
                }

                Spacer()

                Text(review.date, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if let comment = review.comment {
                Text(comment)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            if let reply = review.reply {
                HStack {
                    Rectangle()
                        .fill(Color.purple)
                        .frame(width: 3)
                    Text(reply)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.leading, 8)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Models
struct ReviewStats: Codable {
    let averageRating: Double
    let totalReviews: Int
    let fiveStarPercent: Double
    let fourStarPercent: Double
    let threeStarPercent: Double
    let twoStarPercent: Double
    let oneStarPercent: Double
}

struct ReviewClient: Codable {
    let firstName: String
    let lastName: String
    let email: String?
}

struct Review: Identifiable, Codable {
    let id: String
    let clientId: String?
    let rating: Int
    let comment: String?
    let response: String?
    let source: String?
    let isPublic: Bool?
    let createdAt: Date?
    let client: ReviewClient?

    var clientName: String {
        guard let client = client else { return "Anonymous" }
        return "\(client.firstName) \(client.lastName)"
    }

    var clientInitials: String {
        guard let client = client else { return "?" }
        let first = client.firstName.prefix(1)
        let last = client.lastName.prefix(1)
        return "\(first)\(last)".uppercased()
    }

    var date: Date {
        createdAt ?? Date()
    }

    var reply: String? {
        response
    }
}

@MainActor
class ReviewsViewModel: ObservableObject {
    @Published var stats: ReviewStats?
    @Published var reviews: [Review] = []
    @Published var isLoading = false

    func loadData() async {
        isLoading = true
        do {
            reviews = try await APIClient.shared.get("/reviews")
            // Calculate stats from reviews
            let total = reviews.count
            if total > 0 {
                let avgRating = Double(reviews.reduce(0) { $0 + $1.rating }) / Double(total)
                let fiveStar = Double(reviews.filter { $0.rating == 5 }.count) / Double(total) * 100
                let fourStar = Double(reviews.filter { $0.rating == 4 }.count) / Double(total) * 100
                let threeStar = Double(reviews.filter { $0.rating == 3 }.count) / Double(total) * 100
                let twoStar = Double(reviews.filter { $0.rating == 2 }.count) / Double(total) * 100
                let oneStar = Double(reviews.filter { $0.rating == 1 }.count) / Double(total) * 100
                stats = ReviewStats(
                    averageRating: avgRating,
                    totalReviews: total,
                    fiveStarPercent: fiveStar,
                    fourStarPercent: fourStar,
                    threeStarPercent: threeStar,
                    twoStarPercent: twoStar,
                    oneStarPercent: oneStar
                )
            }
        } catch {
            print("Failed to load reviews: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    ReviewsView()
}
