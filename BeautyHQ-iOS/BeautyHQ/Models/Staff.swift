import Foundation

// Nested User object from backend
struct StaffUser: Codable, Hashable {
    let id: String
    let firstName: String
    let lastName: String
    let email: String
    let phone: String?
    let role: String?
    let avatar: String?
    let isActive: Bool?
}

struct Staff: Codable, Identifiable, Hashable {
    let id: String
    let userId: String
    let locationId: String?
    let displayName: String?
    let title: String?
    let bio: String?
    let color: String?
    let specialties: [String]?
    let employmentType: EmploymentType?
    let payType: CompensationType?
    let hourlyRate: Double?
    let commissionPct: Double?
    let isActive: Bool
    let user: StaffUser?

    // Custom decoder for Prisma Decimal fields
    enum CodingKeys: String, CodingKey {
        case id, userId, locationId, displayName, title, bio, color
        case specialties, employmentType, payType, hourlyRate, commissionPct
        case isActive, user
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        userId = try container.decode(String.self, forKey: .userId)
        locationId = try container.decodeIfPresent(String.self, forKey: .locationId)
        displayName = try container.decodeIfPresent(String.self, forKey: .displayName)
        title = try container.decodeIfPresent(String.self, forKey: .title)
        bio = try container.decodeIfPresent(String.self, forKey: .bio)
        color = try container.decodeIfPresent(String.self, forKey: .color)
        specialties = try container.decodeIfPresent([String].self, forKey: .specialties)
        employmentType = try container.decodeIfPresent(EmploymentType.self, forKey: .employmentType)
        payType = try container.decodeIfPresent(CompensationType.self, forKey: .payType)
        hourlyRate = try container.decodeFlexibleDoubleIfPresent(forKey: .hourlyRate)
        commissionPct = try container.decodeFlexibleDoubleIfPresent(forKey: .commissionPct)
        isActive = try container.decode(Bool.self, forKey: .isActive)
        user = try container.decodeIfPresent(StaffUser.self, forKey: .user)
    }

    var fullName: String {
        if let displayName = displayName, !displayName.isEmpty {
            return displayName
        }
        guard let user = user else { return "Staff Member" }
        return "\(user.firstName) \(user.lastName)"
    }

    var email: String {
        user?.email ?? ""
    }

    var phone: String? {
        user?.phone
    }

    var initials: String {
        if let displayName = displayName, !displayName.isEmpty {
            let parts = displayName.split(separator: " ")
            let first = parts.first?.prefix(1) ?? ""
            let last = parts.count > 1 ? parts.last?.prefix(1) ?? "" : ""
            return "\(first)\(last)".uppercased()
        }
        guard let user = user else { return "?" }
        let first = user.firstName.prefix(1)
        let last = user.lastName.prefix(1)
        return "\(first)\(last)".uppercased()
    }

    // Convenience for views
    var compensationType: CompensationType {
        payType ?? .hourly
    }

    // Hashable conformance
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: Staff, rhs: Staff) -> Bool {
        lhs.id == rhs.id
    }
}

enum EmploymentType: String, Codable, CaseIterable {
    case employee = "EMPLOYEE"
    case boothRenter = "BOOTH_RENTER"
    case contractor = "CONTRACTOR"

    var displayName: String {
        switch self {
        case .employee: return "Employee"
        case .boothRenter: return "Booth Renter"
        case .contractor: return "Contractor"
        }
    }
}

enum CompensationType: String, Codable, CaseIterable {
    case hourly = "HOURLY"
    case commission = "COMMISSION"
    case salary = "SALARY"
    case hybrid = "HYBRID"

    var displayName: String {
        switch self {
        case .hourly: return "Hourly"
        case .commission: return "Commission"
        case .salary: return "Salary"
        case .hybrid: return "Hybrid"
        }
    }
}
