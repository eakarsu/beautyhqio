import Foundation

struct Service: Codable, Identifiable {
    let id: String
    let businessId: String
    let categoryId: String?
    let name: String
    let description: String?
    let duration: Int
    let price: Double
    let pricingType: PricingType
    let depositAmount: Double?
    let bufferTime: Int?
    let isActive: Bool
    let category: ServiceCategory?
    let createdAt: Date
    let updatedAt: Date

    var formattedPrice: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: price)) ?? "$\(price)"
    }

    var formattedDuration: String {
        if duration < 60 {
            return "\(duration) min"
        }
        let hours = duration / 60
        let minutes = duration % 60
        if minutes == 0 {
            return "\(hours) hr"
        }
        return "\(hours) hr \(minutes) min"
    }
}

enum PricingType: String, Codable, CaseIterable {
    case fixed = "FIXED"
    case startingAt = "STARTING_AT"
    case variable = "VARIABLE"
    case consultation = "CONSULTATION"

    var displayName: String {
        switch self {
        case .fixed: return "Fixed"
        case .startingAt: return "Starting At"
        case .variable: return "Variable"
        case .consultation: return "Consultation"
        }
    }
}

struct ServiceCategory: Codable, Identifiable {
    let id: String
    let businessId: String
    let name: String
    let description: String?
    let color: String?
    let icon: String?
    let sortOrder: Int
    let isActive: Bool
}
