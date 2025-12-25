import Foundation

// MARK: - User
struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String
    let phone: String?
    let image: String?
    let role: UserRole
    let businessId: String?
    let staffId: String?
    let createdAt: Date
    let updatedAt: Date

    var firstName: String {
        name.components(separatedBy: " ").first ?? name
    }

    var initials: String {
        let components = name.components(separatedBy: " ")
        let first = components.first?.prefix(1) ?? ""
        let last = components.count > 1 ? components.last?.prefix(1) ?? "" : ""
        return "\(first)\(last)".uppercased()
    }
}

enum UserRole: String, Codable, CaseIterable {
    case owner = "OWNER"
    case manager = "MANAGER"
    case receptionist = "RECEPTIONIST"
    case staff = "STAFF"

    var displayName: String {
        switch self {
        case .owner: return "Owner"
        case .manager: return "Manager"
        case .receptionist: return "Receptionist"
        case .staff: return "Staff"
        }
    }
}

// MARK: - Auth Responses
struct AuthResponse: Codable {
    let user: User
    let token: String
    let refreshToken: String
}

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct RegisterRequest: Codable {
    let email: String
    let password: String
    let name: String
    let businessName: String?
    let phone: String?
}
