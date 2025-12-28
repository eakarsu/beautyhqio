import Foundation

struct Service: Codable, Identifiable, Hashable {
    let id: String
    let businessId: String?
    let categoryId: String?
    let name: String
    let description: String?
    let duration: Int
    let price: Double
    let priceType: PricingType?
    let color: String?
    let allowOnline: Bool?
    let sortOrder: Int?
    let isActive: Bool?
    let category: ServiceCategory?

    // Custom decoder to handle Prisma Decimal (returns string)
    enum CodingKeys: String, CodingKey {
        case id, businessId, categoryId, name, description, duration, price
        case priceType, color, allowOnline, sortOrder, isActive, category
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        businessId = try container.decodeIfPresent(String.self, forKey: .businessId)
        categoryId = try container.decodeIfPresent(String.self, forKey: .categoryId)
        name = try container.decode(String.self, forKey: .name)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        duration = try container.decode(Int.self, forKey: .duration)
        price = try container.decodeFlexibleDouble(forKey: .price)
        priceType = try container.decodeIfPresent(PricingType.self, forKey: .priceType)
        color = try container.decodeIfPresent(String.self, forKey: .color)
        allowOnline = try container.decodeIfPresent(Bool.self, forKey: .allowOnline)
        sortOrder = try container.decodeIfPresent(Int.self, forKey: .sortOrder)
        isActive = try container.decodeIfPresent(Bool.self, forKey: .isActive)
        category = try container.decodeIfPresent(ServiceCategory.self, forKey: .category)
    }

    // Convenience for backward compatibility
    var pricingType: PricingType { priceType ?? .fixed }

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

struct ServiceCategory: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let description: String?
    let color: String?
    let icon: String?
    let sortOrder: Int?
    let isActive: Bool?
}
