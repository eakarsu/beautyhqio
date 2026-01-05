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
    let isClient: Bool?
    let createdAt: Date
    let updatedAt: Date

    var firstName: String {
        name.components(separatedBy: " ").first ?? name
    }

    var lastName: String {
        let components = name.components(separatedBy: " ")
        return components.count > 1 ? components.dropFirst().joined(separator: " ") : ""
    }

    var initials: String {
        let components = name.components(separatedBy: " ")
        let first = components.first?.prefix(1) ?? ""
        let last = components.count > 1 ? components.last?.prefix(1) ?? "" : ""
        return "\(first)\(last)".uppercased()
    }
}

enum UserRole: String, Codable, CaseIterable {
    case platformAdmin = "PLATFORM_ADMIN"  // Platform owner - sees all salons, revenues, subscribers
    case owner = "OWNER"                    // Salon owner - full access to their salon only
    case manager = "MANAGER"                // Day-to-day operations
    case receptionist = "RECEPTIONIST"      // Front desk & check-in
    case staff = "STAFF"                    // Service providers/stylists
    case client = "CLIENT"                  // Customer - books appointments, pays for services

    var displayName: String {
        switch self {
        case .platformAdmin: return "Platform Admin"
        case .owner: return "Owner"
        case .manager: return "Manager"
        case .receptionist: return "Receptionist"
        case .staff: return "Staff"
        case .client: return "Client"
        }
    }

    /// Returns true if this role has administrative privileges (can manage staff, view reports, etc.)
    var isAdmin: Bool {
        switch self {
        case .platformAdmin, .owner, .manager:
            return true
        case .receptionist, .staff, .client:
            return false
        }
    }

    /// Returns true if this role is a staff member (works at the salon)
    var isStaffMember: Bool {
        switch self {
        case .owner, .manager, .receptionist, .staff:
            return true
        case .platformAdmin, .client:
            return false
        }
    }

    /// Returns true if this role can access the business dashboard
    var canAccessDashboard: Bool {
        switch self {
        case .platformAdmin, .owner, .manager, .receptionist, .staff:
            return true
        case .client:
            return false
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
