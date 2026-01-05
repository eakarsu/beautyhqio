import Foundation

actor StaffService {
    static let shared = StaffService()
    private init() {}

    func getStaff(isActive: Bool = true) async throws -> [Staff] {
        let queryItems = [URLQueryItem(name: "isActive", value: String(isActive))]
        return try await APIClient.shared.get("/staff", queryItems: queryItems)
    }

    func getStaffMember(id: String) async throws -> Staff {
        try await APIClient.shared.get("/staff/\(id)")
    }

    func getStaffByService(serviceId: String) async throws -> [Staff] {
        try await APIClient.shared.get("/staff/by-service/\(serviceId)")
    }

    // MARK: - Staff Portal (for logged-in staff user)

    /// Get current staff's schedule for a specific date
    func getMySchedule(date: Date? = nil) async throws -> StaffScheduleResponse {
        var queryItems: [URLQueryItem]? = nil
        if let date = date {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            queryItems = [URLQueryItem(name: "date", value: formatter.string(from: date))]
        }
        return try await APIClient.shared.get("/staff/me/schedule", queryItems: queryItems)
    }

    /// Get clients the current staff has served
    func getMyClients() async throws -> StaffClientsResponse {
        return try await APIClient.shared.get("/staff/me/clients")
    }

    /// Get current staff's earnings
    func getMyEarnings() async throws -> StaffEarningsResponse {
        return try await APIClient.shared.get("/staff/me/earnings")
    }

    /// Get current staff's profile
    func getMyProfile() async throws -> StaffProfile {
        return try await APIClient.shared.get("/staff/me")
    }

    /// Update current staff's profile
    func updateMyProfile(displayName: String?, bio: String?, phone: String?) async throws -> StaffProfile {
        let body = StaffProfileUpdateRequest(displayName: displayName, bio: bio, phone: phone)
        return try await APIClient.shared.patch("/staff/me", body: body)
    }

    /// Get payout settings
    func getPayoutSettings() async throws -> PayoutSettingsResponse {
        return try await APIClient.shared.get("/staff/me/payout-settings")
    }

    /// Update payout settings (add bank account)
    func updatePayoutSettings(bankAccountHolder: String, bankName: String, bankRoutingNumber: String, bankAccountNumber: String, bankAccountType: String) async throws -> PayoutSettingsUpdateResponse {
        let body = PayoutSettingsUpdateRequest(
            payoutMethod: "bank_transfer",
            bankAccountHolder: bankAccountHolder,
            bankName: bankName,
            bankRoutingNumber: bankRoutingNumber,
            bankAccountNumber: bankAccountNumber,
            bankAccountType: bankAccountType
        )
        return try await APIClient.shared.put("/staff/me/payout-settings", body: body)
    }

    /// Remove bank account
    func removeBankAccount() async throws {
        let _: EmptyResponse = try await APIClient.shared.delete("/staff/me/payout-settings")
    }

    /// Get staff working schedule (for editing)
    func getWorkingSchedule(staffId: String) async throws -> [StaffWorkingSchedule] {
        return try await APIClient.shared.get("/staff/\(staffId)/schedule")
    }

    /// Update staff working schedule
    func updateWorkingSchedule(staffId: String, schedules: [StaffWorkingSchedule]) async throws -> [StaffWorkingSchedule] {
        let body = StaffScheduleUpdateRequest(schedules: schedules)
        return try await APIClient.shared.put("/staff/\(staffId)/schedule", body: body)
    }

    /// Get Stripe Connect status
    func getStripeConnectStatus() async throws -> StripeConnectStatusResponse {
        return try await APIClient.shared.get("/staff/me/stripe-connect")
    }

    /// Create Stripe Connect onboarding link
    func createStripeConnectLink() async throws -> StripeConnectLinkResponse {
        return try await APIClient.shared.post("/staff/me/stripe-connect", body: EmptyRequest())
    }

    /// Disconnect Stripe account
    func disconnectStripe() async throws {
        let _: EmptyResponse = try await APIClient.shared.delete("/staff/me/stripe-connect")
    }
}

// MARK: - Stripe Connect

struct StripeConnectStatusResponse: Codable {
    let connected: Bool
    let accountId: String?
    let status: String?
    let chargesEnabled: Bool?
    let payoutsEnabled: Bool?
    let detailsSubmitted: Bool?
}

struct StripeConnectLinkResponse: Codable {
    let url: String?
    let error: String?
    let message: String?
    let connectRequired: Bool?
}

struct StaffProfileUpdateRequest: Encodable {
    let displayName: String?
    let bio: String?
    let phone: String?
}

// MARK: - Staff Profile Response

struct StaffProfile: Codable {
    let id: String
    let displayName: String?
    let title: String?
    let bio: String?
    let phone: String?
    let color: String?
    let user: StaffProfileUser
    let location: StaffProfileLocation?

    var fullName: String {
        "\(user.firstName) \(user.lastName)"
    }

    var initials: String {
        let first = user.firstName.prefix(1)
        let last = user.lastName.prefix(1)
        return "\(first)\(last)".uppercased()
    }
}

struct StaffProfileUser: Codable {
    let firstName: String
    let lastName: String
    let email: String
    let phone: String?
}

struct StaffProfileLocation: Codable {
    let id: String
    let name: String
}

// MARK: - Staff Schedule Response

struct StaffScheduleResponse: Codable {
    let date: String
    let appointments: [StaffAppointmentItem]
    let schedule: StaffDaySchedule?
}

struct StaffAppointmentItem: Codable, Identifiable {
    let id: String
    let time: Date
    let endTime: Date
    let status: String
    let client: StaffAppointmentClient
    let services: [StaffAppointmentService]

    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: time)
    }
}

struct StaffAppointmentClient: Codable {
    let id: String?
    let name: String
    let phone: String?
}

struct StaffAppointmentService: Codable {
    let name: String
    let duration: Int
}

struct StaffDaySchedule: Codable {
    let isWorking: Bool
    let startTime: String
    let endTime: String
    let breaks: [StaffBreakItem]
}

struct StaffBreakItem: Codable {
    let startTime: String
    let endTime: String
    let label: String?
}

// MARK: - Staff Clients Response

struct StaffClientsResponse: Codable {
    let clients: [StaffClientItem]
}

struct StaffClientItem: Codable, Identifiable {
    let id: String
    let firstName: String
    let lastName: String
    let email: String?
    let phone: String
    let lastVisit: Date?
    let totalVisits: Int

    var fullName: String {
        "\(firstName) \(lastName)"
    }

    var initials: String {
        let first = firstName.prefix(1)
        let last = lastName.prefix(1)
        return "\(first)\(last)".uppercased()
    }
}

// MARK: - Staff Earnings Response

struct StaffEarningsResponse: Codable {
    let totalEarnings: Double
    let thisMonth: Double
    let lastMonth: Double
    let thisWeek: Double
    let completedAppointments: Int
    let averagePerAppointment: Double
    let recentTransactions: [StaffTransactionItem]
}

struct StaffTransactionItem: Codable, Identifiable {
    let id: String
    let date: Date
    let service: String
    let amount: Double
    let client: String

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }

    var formattedAmount: String {
        String(format: "$%.2f", amount)
    }
}

// MARK: - Payout Settings

struct PayoutSettingsResponse: Codable {
    let payoutMethod: String
    let bankAccount: BankAccountInfo?
    let stripeConnected: Bool
}

struct BankAccountInfo: Codable {
    let holderName: String?
    let bankName: String?
    let last4: String?
    let accountType: String?
}

struct PayoutSettingsUpdateRequest: Encodable {
    let payoutMethod: String
    let bankAccountHolder: String
    let bankName: String
    let bankRoutingNumber: String
    let bankAccountNumber: String
    let bankAccountType: String
}

struct PayoutSettingsUpdateResponse: Codable {
    let success: Bool
    let payoutMethod: String?
    let bankAccount: BankAccountInfo?
}

// Using EmptyResponse from AuthManager.swift

// MARK: - Working Schedule (for editing)

struct StaffWorkingSchedule: Codable, Identifiable {
    var id: String?
    var dayOfWeek: Int
    var startTime: String
    var endTime: String
    var isWorking: Bool
    var breaks: [ScheduleBreakInput]

    init(id: String? = nil, dayOfWeek: Int, startTime: String = "09:00", endTime: String = "17:00", isWorking: Bool = true, breaks: [ScheduleBreakInput] = []) {
        self.id = id
        self.dayOfWeek = dayOfWeek
        self.startTime = startTime
        self.endTime = endTime
        self.isWorking = isWorking
        self.breaks = breaks
    }
}

struct ScheduleBreakInput: Codable, Identifiable {
    var id: String?
    var startTime: String
    var endTime: String
    var label: String?

    init(id: String? = nil, startTime: String = "12:00", endTime: String = "13:00", label: String? = nil) {
        self.id = id ?? UUID().uuidString
        self.startTime = startTime
        self.endTime = endTime
        self.label = label
    }
}

struct StaffScheduleUpdateRequest: Encodable {
    let schedules: [StaffWorkingSchedule]
}
