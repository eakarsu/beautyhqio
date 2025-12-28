import Foundation

struct Client: Codable, Identifiable, Hashable {
    let id: String
    let firstName: String
    let lastName: String
    let email: String?
    let phone: String
    let mobile: String?
    let birthday: Date?
    let notes: String?
    let status: String?
    let createdAt: Date
    let updatedAt: Date

    // Computed fields from backend
    let lastVisit: Date?
    let totalVisits: Int?
    let totalSpent: Double?
    let loyaltyPoints: Int?
    let loyaltyTier: String?

    var fullName: String {
        "\(firstName) \(lastName)"
    }

    var initials: String {
        let first = firstName.prefix(1)
        let last = lastName.prefix(1)
        return "\(first)\(last)".uppercased()
    }

    var formattedPhone: String {
        let cleaned = phone.filter { $0.isNumber }
        guard cleaned.count == 10 else { return phone }
        let areaCode = cleaned.prefix(3)
        let middle = cleaned.dropFirst(3).prefix(3)
        let last = cleaned.suffix(4)
        return "(\(areaCode)) \(middle)-\(last)"
    }

    // Make Hashable work with just id
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: Client, rhs: Client) -> Bool {
        lhs.id == rhs.id
    }
}

enum Gender: String, Codable, CaseIterable {
    case male = "MALE"
    case female = "FEMALE"
    case nonBinary = "NON_BINARY"
    case preferNotToSay = "PREFER_NOT_TO_SAY"

    var displayName: String {
        switch self {
        case .male: return "Male"
        case .female: return "Female"
        case .nonBinary: return "Non-binary"
        case .preferNotToSay: return "Prefer not to say"
        }
    }
}

// MARK: - Client Requests
struct CreateClientRequest: Codable {
    let firstName: String
    let lastName: String
    let email: String?
    let phone: String
    let mobile: String?
    let birthday: Date?
    let notes: String?
}
