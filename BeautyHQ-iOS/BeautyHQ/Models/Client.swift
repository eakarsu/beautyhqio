import Foundation

struct Client: Codable, Identifiable {
    let id: String
    let businessId: String
    let firstName: String
    let lastName: String?
    let email: String?
    let phone: String?
    let profileImage: String?
    let dateOfBirth: Date?
    let gender: Gender?
    let notes: String?
    let loyaltyPoints: Int
    let totalSpent: Double
    let visitCount: Int
    let lastVisit: Date?
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date

    var fullName: String {
        [firstName, lastName].compactMap { $0 }.joined(separator: " ")
    }

    var initials: String {
        let first = firstName.prefix(1)
        let last = lastName?.prefix(1) ?? ""
        return "\(first)\(last)".uppercased()
    }

    var formattedPhone: String? {
        guard let phone = phone else { return nil }
        let cleaned = phone.filter { $0.isNumber }
        guard cleaned.count == 10 else { return phone }
        let areaCode = cleaned.prefix(3)
        let middle = cleaned.dropFirst(3).prefix(3)
        let last = cleaned.suffix(4)
        return "(\(areaCode)) \(middle)-\(last)"
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
    let lastName: String?
    let email: String?
    let phone: String?
    let dateOfBirth: Date?
    let gender: Gender?
    let notes: String?
}
