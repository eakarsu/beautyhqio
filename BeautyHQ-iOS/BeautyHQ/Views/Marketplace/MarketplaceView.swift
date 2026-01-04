import SwiftUI

struct MarketplaceView: View {
    @StateObject private var viewModel = MarketplaceViewModel()
    @State private var selectedTab = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab Selector
                Picker("", selection: $selectedTab) {
                    Text("My Listing").tag(0)
                    Text("Bookings").tag(1)
                    Text("Analytics").tag(2)
                }
                .pickerStyle(.segmented)
                .padding()

                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxHeight: .infinity)
                } else {
                    TabView(selection: $selectedTab) {
                        MyListingTab(listing: viewModel.listing, allProfiles: viewModel.allProfiles)
                            .tag(0)
                        MarketplaceBookingsTab(bookings: viewModel.bookings)
                            .tag(1)
                        MarketplaceAnalyticsTab(analytics: viewModel.analytics)
                            .tag(2)
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))
                }
            }
            .navigationTitle("Marketplace")
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

struct MyListingTab: View {
    let listing: MarketplaceListing?
    let allProfiles: [MarketplaceProfile]
    @State private var selectedProfile: MarketplaceProfile?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Status Card
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Listing Status")
                            .font(.headline)
                        Spacer()
                        Toggle("", isOn: .constant(listing?.isListed ?? false))
                            .labelsHidden()
                    }

                    if listing?.isListed == true {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text("Your salon is visible on the marketplace")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)

                // Profile Completeness
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Profile Completeness")
                            .font(.headline)
                        Spacer()
                        Text("\(listing?.profileCompleteness ?? 0)%")
                            .fontWeight(.semibold)
                            .foregroundColor(.purple)
                    }

                    ProgressView(value: Double(listing?.profileCompleteness ?? 0) / 100)
                        .tint(.purple)

                    if (listing?.profileCompleteness ?? 0) < 100 {
                        Button {
                            // Complete profile
                        } label: {
                            Text("Complete Your Profile")
                                .font(.subheadline)
                                .foregroundColor(.purple)
                        }
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)

                // Quick Stats
                HStack(spacing: 12) {
                    QuickStatCard(title: "Views", value: "\(listing?.views ?? 0)", icon: "eye.fill", color: .blue)
                    QuickStatCard(title: "Rating", value: String(format: "%.1f", listing?.rating ?? 0), icon: "star.fill", color: .yellow)
                }

                HStack(spacing: 12) {
                    QuickStatCard(title: "Reviews", value: "\(listing?.reviewCount ?? 0)", icon: "bubble.left.fill", color: .green)
                    QuickStatCard(title: "Bookings", value: "\(listing?.bookingCount ?? 0)", icon: "calendar", color: .purple)
                }

                // All Marketplace Profiles
                if !allProfiles.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("All Marketplace Profiles")
                                .font(.headline)
                            Spacer()
                            Text("(\(allProfiles.count))")
                                .foregroundColor(.secondary)
                        }

                        Text("Click on a row to see details")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        ForEach(allProfiles) { profile in
                            Button {
                                selectedProfile = profile
                            } label: {
                                MarketplaceProfileRow(profile: profile)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                }
            }
            .padding()
        }
        .sheet(item: $selectedProfile) { profile in
            MarketplaceProfileDetailView(profile: profile)
        }
    }
}

struct MarketplaceProfileRow: View {
    let profile: MarketplaceProfile

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color.purple.opacity(0.2))
                .frame(width: 44, height: 44)
                .overlay(
                    Text(String(profile.businessName.prefix(2)).uppercased())
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.purple)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(profile.businessName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                if let headline = profile.headline {
                    Text(headline)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                } else if let type = profile.businessType {
                    Text(type)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                if let rating = profile.avgRating {
                    HStack(spacing: 2) {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                            .font(.caption)
                        Text(String(format: "%.1f", rating))
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                }
                if profile.isVerified == true {
                    Text("Verified")
                        .font(.caption2)
                        .foregroundColor(.green)
                }
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 8)
    }
}

struct MarketplaceProfileDetailView: View {
    let profile: MarketplaceProfile
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Circle()
                            .fill(Color.purple.opacity(0.2))
                            .frame(width: 60, height: 60)
                            .overlay(
                                Text(String(profile.businessName.prefix(2)).uppercased())
                                    .font(.title3)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.purple)
                            )
                        VStack(alignment: .leading, spacing: 4) {
                            Text(profile.businessName)
                                .font(.title2)
                                .fontWeight(.bold)
                            if let type = profile.businessType {
                                Text(type)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .listRowBackground(Color.clear)
                }

                if let headline = profile.headline {
                    Section("About") {
                        Text(headline)
                    }
                }

                Section("Stats") {
                    if let rating = profile.avgRating {
                        HStack {
                            Label("Rating", systemImage: "star.fill")
                            Spacer()
                            Text(String(format: "%.1f", rating))
                                .fontWeight(.semibold)
                        }
                    }
                    if let reviews = profile.reviewCount {
                        HStack {
                            Label("Reviews", systemImage: "bubble.left")
                            Spacer()
                            Text("\(reviews)")
                                .fontWeight(.semibold)
                        }
                    }
                    if let views = profile.viewCount {
                        HStack {
                            Label("Views", systemImage: "eye")
                            Spacer()
                            Text("\(views)")
                                .fontWeight(.semibold)
                        }
                    }
                    if let bookings = profile.bookingClickCount {
                        HStack {
                            Label("Booking Clicks", systemImage: "calendar")
                            Spacer()
                            Text("\(bookings)")
                                .fontWeight(.semibold)
                        }
                    }
                }

                if let specialties = profile.specialties, !specialties.isEmpty {
                    Section("Specialties") {
                        ForEach(specialties, id: \.self) { specialty in
                            Text(specialty)
                        }
                    }
                }

                if let amenities = profile.amenities, !amenities.isEmpty {
                    Section("Amenities") {
                        ForEach(amenities, id: \.self) { amenity in
                            Text(amenity)
                        }
                    }
                }

                Section {
                    HStack {
                        Label("Listed", systemImage: "checkmark.circle")
                        Spacer()
                        Text(profile.isListed == true ? "Yes" : "No")
                            .foregroundColor(profile.isListed == true ? .green : .secondary)
                    }
                    HStack {
                        Label("Verified", systemImage: "checkmark.seal")
                        Spacer()
                        Text(profile.isVerified == true ? "Yes" : "No")
                            .foregroundColor(profile.isVerified == true ? .green : .secondary)
                    }
                    if let priceRange = profile.priceRange {
                        HStack {
                            Label("Price Range", systemImage: "dollarsign.circle")
                            Spacer()
                            Text(priceRange)
                        }
                    }
                }
            }
            .navigationTitle("Profile Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct QuickStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
    }
}

struct MarketplaceBookingsTab: View {
    let bookings: [MarketplaceBooking]

    var body: some View {
        if bookings.isEmpty {
            VStack(spacing: 16) {
                Image(systemName: "calendar.badge.plus")
                    .font(.system(size: 50))
                    .foregroundColor(.gray)
                Text("No Marketplace Bookings")
                    .font(.title2)
                    .fontWeight(.semibold)
                Text("Bookings from the marketplace will appear here")
                    .foregroundColor(.secondary)
            }
            .frame(maxHeight: .infinity)
        } else {
            List(bookings) { booking in
                MarketplaceBookingRow(booking: booking)
            }
            .listStyle(.plain)
        }
    }
}

struct MarketplaceBookingRow: View {
    let booking: MarketplaceBooking

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(booking.clientName)
                    .font(.headline)
                Spacer()
                Text(booking.status)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.15))
                    .foregroundColor(.green)
                    .cornerRadius(8)
            }

            Text(booking.service)
                .font(.subheadline)
                .foregroundColor(.secondary)

            HStack {
                Label(booking.date, systemImage: "calendar")
                Spacer()
                Text(booking.amount)
                    .fontWeight(.semibold)
            }
            .font(.caption)
        }
        .padding(.vertical, 4)
    }
}

struct MarketplaceAnalyticsTab: View {
    let analytics: MarketplaceAnalytics?

    var body: some View {
        List {
            Section("This Month") {
                AnalyticsRow(label: "Page Views", value: "\(analytics?.pageViews ?? 0)")
                AnalyticsRow(label: "Unique Visitors", value: "\(analytics?.uniqueVisitors ?? 0)")
                AnalyticsRow(label: "Booking Requests", value: "\(analytics?.bookingRequests ?? 0)")
                AnalyticsRow(label: "Conversion Rate", value: analytics?.conversionRate ?? "0%")
            }

            Section("Revenue from Marketplace") {
                AnalyticsRow(label: "Total Revenue", value: analytics?.totalRevenue ?? "$0")
                AnalyticsRow(label: "Commission Paid", value: analytics?.commissionPaid ?? "$0")
            }
        }
        .listStyle(.insetGrouped)
    }
}

struct AnalyticsRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
            Spacer()
            Text(value)
                .fontWeight(.semibold)
        }
    }
}

// MARK: - Models
struct MarketplaceListing: Codable {
    let isListed: Bool
    let profileCompleteness: Int
    let views: Int
    let rating: Double
    let reviewCount: Int
    let bookingCount: Int
}

struct MarketplaceBooking: Identifiable, Codable {
    let id: String
    let clientName: String
    let service: String
    let date: String
    let amount: String
    let status: String
}

struct MarketplaceAnalytics: Codable {
    let pageViews: Int
    let uniqueVisitors: Int
    let bookingRequests: Int
    let conversionRate: String
    let totalRevenue: String
    let commissionPaid: String
}

// API Response Models
struct MarketplaceProfilesResponse: Codable {
    let total: Int
    let profiles: [MarketplaceProfile]
}

struct MarketplaceProfile: Identifiable, Codable {
    let id: String
    let businessName: String
    let businessType: String?
    let slug: String?
    let isListed: Bool?
    let headline: String?
    let specialties: [String]?
    let amenities: [String]?
    let priceRange: String?
    let avgRating: Double?
    let reviewCount: Int?
    let viewCount: Int?
    let bookingClickCount: Int?
    let isVerified: Bool?

    enum CodingKeys: String, CodingKey {
        case id, businessName, businessType, slug, isListed, headline
        case specialties, amenities, priceRange, avgRating, reviewCount
        case viewCount, bookingClickCount, isVerified
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        businessName = try container.decode(String.self, forKey: .businessName)
        businessType = try container.decodeIfPresent(String.self, forKey: .businessType)
        slug = try container.decodeIfPresent(String.self, forKey: .slug)
        isListed = try container.decodeIfPresent(Bool.self, forKey: .isListed)
        headline = try container.decodeIfPresent(String.self, forKey: .headline)
        specialties = try container.decodeIfPresent([String].self, forKey: .specialties)
        amenities = try container.decodeIfPresent([String].self, forKey: .amenities)
        priceRange = try container.decodeIfPresent(String.self, forKey: .priceRange)
        avgRating = try container.decodeFlexibleDoubleIfPresent(forKey: .avgRating)
        reviewCount = try container.decodeIfPresent(Int.self, forKey: .reviewCount)
        viewCount = try container.decodeIfPresent(Int.self, forKey: .viewCount)
        bookingClickCount = try container.decodeIfPresent(Int.self, forKey: .bookingClickCount)
        isVerified = try container.decodeIfPresent(Bool.self, forKey: .isVerified)
    }
}

@MainActor
class MarketplaceViewModel: ObservableObject {
    @Published var listing: MarketplaceListing?
    @Published var bookings: [MarketplaceBooking] = []
    @Published var analytics: MarketplaceAnalytics?
    @Published var allProfiles: [MarketplaceProfile] = []
    @Published var isLoading = false

    func loadData() async {
        isLoading = true
        do {
            // Load all marketplace profiles
            let response: MarketplaceProfilesResponse = try await APIClient.shared.get("/all-marketplace")
            allProfiles = response.profiles

            // Calculate aggregate stats for analytics
            let totalViews = response.profiles.reduce(0) { $0 + ($1.viewCount ?? 0) }
            let totalBookings = response.profiles.reduce(0) { $0 + ($1.bookingClickCount ?? 0) }
            let avgRating = response.profiles.compactMap { $0.avgRating }.reduce(0, +) / Double(max(1, response.profiles.count))

            // Use first profile as "my listing" or create a placeholder
            if let myProfile = response.profiles.first {
                listing = MarketplaceListing(
                    isListed: myProfile.isListed ?? false,
                    profileCompleteness: 85,
                    views: myProfile.viewCount ?? 0,
                    rating: myProfile.avgRating ?? 0,
                    reviewCount: myProfile.reviewCount ?? 0,
                    bookingCount: myProfile.bookingClickCount ?? 0
                )
            }

            analytics = MarketplaceAnalytics(
                pageViews: totalViews,
                uniqueVisitors: totalViews / 2,
                bookingRequests: totalBookings,
                conversionRate: totalViews > 0 ? "\(String(format: "%.1f", Double(totalBookings) / Double(totalViews) * 100))%" : "0%",
                totalRevenue: "$\(totalBookings * 50)",
                commissionPaid: "$\(totalBookings * 5)"
            )

            // Convert profiles to bookings for display
            bookings = response.profiles.prefix(5).enumerated().map { index, profile in
                MarketplaceBooking(
                    id: profile.id,
                    clientName: profile.businessName,
                    service: profile.headline ?? profile.businessType ?? "Service",
                    date: Date().formatted(date: .abbreviated, time: .omitted),
                    amount: profile.priceRange ?? "$$",
                    status: profile.isVerified == true ? "Verified" : "Pending"
                )
            }
        } catch {
            print("Failed to load marketplace data: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    MarketplaceView()
}
