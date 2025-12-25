import Foundation

struct Staff: Codable, Identifiable {
    let id: String
    let userId: String
    let businessId: String
    let firstName: String
    let lastName: String
    let email: String
    let phone: String?
    let profileImage: String?
    let title: String?
    let bio: String?
    let employmentType: EmploymentType
    let compensationType: CompensationType
    let hourlyRate: Double?
    let commissionRate: Double?
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date

    var fullName: String {
        "\(firstName) \(lastName)"
    }

    var initials: String {
        let first = firstName.prefix(1)
        let last = lastName.prefix(1)
        return "\(first)\(last)".uppercased()
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
