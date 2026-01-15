import Foundation

// Response model matching backend format
struct ClientsResponse: Decodable {
    let clients: [Client]
    let pagination: ClientsPagination
}

struct ClientsPagination: Decodable {
    let page: Int
    let limit: Int
    let total: Int
    let totalPages: Int
}

actor ClientService {
    static let shared = ClientService()
    private init() {}

    func getClients(search: String? = nil, page: Int = 1, pageSize: Int = 50) async throws -> ClientsResponse {
        var queryItems = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(pageSize))
        ]

        if let search = search, !search.isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: search))
        }

        return try await APIClient.shared.get("/clients", queryItems: queryItems)
    }

    func getClient(id: String) async throws -> Client {
        try await APIClient.shared.get("/clients/\(id)")
    }

    func searchClients(query: String) async throws -> [Client] {
        let queryItems = [URLQueryItem(name: "q", value: query)]
        return try await APIClient.shared.get("/clients/search", queryItems: queryItems)
    }

    func createClient(_ request: CreateClientRequest) async throws -> Client {
        try await APIClient.shared.post("/clients", body: request)
    }

    func updateClient(id: String, _ request: CreateClientRequest) async throws -> Client {
        try await APIClient.shared.patch("/clients/\(id)", body: request)
    }

    func deleteClient(id: String) async throws {
        let _: SuccessResponse = try await APIClient.shared.delete("/clients/\(id)")
    }

    func getClientAppointments(clientId: String, limit: Int = 10) async throws -> [Appointment] {
        let queryItems = [URLQueryItem(name: "limit", value: String(limit))]
        return try await APIClient.shared.get("/clients/\(clientId)/appointments", queryItems: queryItems)
    }

    func getClientTransactions(clientId: String, limit: Int = 10) async throws -> [Transaction] {
        let queryItems = [URLQueryItem(name: "limit", value: String(limit))]
        return try await APIClient.shared.get("/clients/\(clientId)/transactions", queryItems: queryItems)
    }

    // MARK: - Client Portal (for logged-in client user)

    /// Get current client's appointments
    func getMyAppointments() async throws -> ClientAppointmentsResponse {
        let wrapper: AppointmentsWrapper = try await APIClient.shared.get("/client/appointments")
        let now = Date()
        let upcoming = wrapper.appointments.filter { $0.scheduledStart > now && $0.status != "CANCELLED" && $0.status != "COMPLETED" }
        let past = wrapper.appointments.filter { $0.scheduledStart <= now || $0.status == "CANCELLED" || $0.status == "COMPLETED" }
        return ClientAppointmentsResponse(upcoming: upcoming, past: past)
    }

    /// Get single appointment detail
    func getMyAppointment(id: String) async throws -> ClientAppointmentDetail {
        let wrapper: AppointmentDetailWrapper = try await APIClient.shared.get("/client/appointments/\(id)")
        return wrapper.appointment
    }

    /// Cancel an appointment
    func cancelMyAppointment(id: String) async throws -> ClientAppointmentDetail {
        let body = ClientCancelAppointmentRequest(status: "CANCELLED")
        let wrapper: AppointmentDetailWrapper = try await APIClient.shared.patch("/client/appointments/\(id)", body: body)
        return wrapper.appointment
    }

    /// Reschedule an appointment
    func rescheduleAppointment(id: String, newDate: Date, newTime: String) async throws {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: newDate)
        let body = RescheduleAppointmentRequest(action: "reschedule", scheduledStart: "\(dateString)T\(newTime):00")
        let _: RescheduleAppointmentResponse = try await APIClient.shared.patch("/client/appointments/\(id)", body: body)
    }

    /// Delete an appointment
    func deleteMyAppointment(id: String) async throws {
        let _: SuccessResponse = try await APIClient.shared.delete("/appointments/\(id)")
    }

    /// Get current client's profile
    func getMyProfile() async throws -> ClientPortalProfile {
        let wrapper: ProfileWrapper = try await APIClient.shared.get("/client/profile")
        return wrapper.profile
    }

    /// Update current client's profile
    func updateMyProfile(firstName: String, lastName: String, phone: String?, birthday: Date?) async throws -> ClientPortalProfile {
        var birthdayString: String? = nil
        if let birthday = birthday {
            let formatter = ISO8601DateFormatter()
            birthdayString = formatter.string(from: birthday)
        }
        let body = UpdateClientProfileRequest(firstName: firstName, lastName: lastName, phone: phone, birthday: birthdayString)
        let wrapper: ProfileWrapper = try await APIClient.shared.put("/client/profile", body: body)
        return wrapper.profile
    }

    /// Get saved payment methods
    func getMyPaymentMethods() async throws -> [ClientPaymentMethod] {
        let wrapper: PaymentMethodsWrapper = try await APIClient.shared.get("/client/payment-methods")
        return wrapper.paymentMethods
    }

    /// Create setup intent for adding new card
    func createPaymentSetupIntent() async throws -> SetupIntentResponse {
        try await APIClient.shared.post("/client/payment-methods", body: EmptyRequest())
    }

    /// Set a payment method as default
    func setDefaultPaymentMethod(id: String) async throws -> SetDefaultPaymentResponse {
        try await APIClient.shared.post("/client/payment-methods/\(id)/default", body: EmptyRequest())
    }

    /// Delete a payment method
    func deletePaymentMethod(id: String) async throws {
        let _: EmptyResponse = try await APIClient.shared.delete("/client/payment-methods/\(id)")
    }

    /// Get payment history
    func getMyPaymentHistory() async throws -> [ClientPaymentHistoryItem] {
        let wrapper: PaymentHistoryWrapper = try await APIClient.shared.get("/client/payment-history")
        return wrapper.payments
    }

    /// Get loyalty account
    func getMyLoyaltyAccount() async throws -> ClientLoyaltyAccount {
        let wrapper: LoyaltyWrapper = try await APIClient.shared.get("/client/loyalty")
        return wrapper.account
    }

    /// Get available rewards
    func getAvailableRewards() async throws -> [ClientReward] {
        let wrapper: RewardsWrapper = try await APIClient.shared.get("/client/rewards")
        return wrapper.rewards
    }

    /// Redeem a reward
    func redeemReward(id: String) async throws -> RedeemRewardResponse {
        try await APIClient.shared.post("/client/rewards/\(id)/redeem", body: EmptyRequest())
    }

    /// Get locations for booking
    func getBookingLocations() async throws -> [BookingLocation] {
        try await APIClient.shared.get("/locations", queryItems: [URLQueryItem(name: "isActive", value: "true")])
    }

    /// Get services for a location
    func getLocationServices(locationId: String) async throws -> [BookingService] {
        try await APIClient.shared.get("/locations/\(locationId)/services")
    }

    /// Get staff for a location
    func getLocationStaff(locationId: String, serviceId: String?) async throws -> [BookingStaff] {
        var queryItems: [URLQueryItem] = []
        if let serviceId = serviceId {
            queryItems.append(URLQueryItem(name: "serviceId", value: serviceId))
        }
        print("DEBUG getLocationStaff: calling /locations/\(locationId)/staff")
        let result: [BookingStaff] = try await APIClient.shared.get("/locations/\(locationId)/staff", queryItems: queryItems.isEmpty ? nil : queryItems)
        print("DEBUG getLocationStaff: received \(result.count) staff")
        for member in result {
            print("DEBUG getLocationStaff: - \(member.displayName) (id: \(member.id))")
        }
        return result
    }

    /// Get available time slots (matches web booking flow - no staff required upfront)
    func getAvailableSlots(locationId: String, serviceId: String, date: Date, staffId: String? = nil) async throws -> BookingAvailabilityResponse {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: date)
        var queryItems = [
            URLQueryItem(name: "locationId", value: locationId),
            URLQueryItem(name: "serviceId", value: serviceId),
            URLQueryItem(name: "date", value: dateString)
        ]
        if let staffId = staffId {
            queryItems.append(URLQueryItem(name: "staffId", value: staffId))
        }
        print("DEBUG getAvailableSlots: calling API with date=\(dateString)")
        let response: BookingAvailabilityResponse = try await APIClient.shared.get("/booking/availability", queryItems: queryItems)
        print("DEBUG getAvailableSlots: got \(response.slots.count) slots")
        for slot in response.slots.prefix(2) {
            print("DEBUG getAvailableSlots: slot \(slot.time) available=\(slot.available) staffCount=\(slot.availableStaff.count)")
            for staff in slot.availableStaff.prefix(2) {
                print("DEBUG getAvailableSlots:   - \(staff.firstName) \(staff.lastName)")
            }
        }
        return response
    }

    /// Create a new appointment
    func createAppointment(request: ClientCreateAppointmentRequest) async throws -> CreateAppointmentResponse {
        try await APIClient.shared.post("/appointments", body: request)
    }
}

// MARK: - Client Portal Request Models

struct ClientCancelAppointmentRequest: Encodable {
    let status: String
}

struct UpdateClientProfileRequest: Encodable {
    let firstName: String
    let lastName: String
    let phone: String?
    let birthday: String?
}

struct RescheduleAppointmentRequest: Encodable {
    let action: String
    let scheduledStart: String
}

struct RescheduleAppointmentResponse: Codable {
    let success: Bool
    let appointment: RescheduledAppointment?
}

struct RescheduledAppointment: Codable {
    let id: String
    let scheduledStart: Date
    let scheduledEnd: Date
    let status: String
}

struct SuccessResponse: Codable {
    let success: Bool
}

// MARK: - Client Portal Response Models

// Wrapper types for API responses
struct AppointmentsWrapper: Codable {
    let appointments: [ClientPortalAppointment]
}

struct AppointmentDetailWrapper: Codable {
    let appointment: ClientAppointmentDetail
}

struct ProfileWrapper: Codable {
    let profile: ClientPortalProfile
}

struct LoyaltyWrapper: Codable {
    let account: ClientLoyaltyAccount
}

struct RewardsWrapper: Codable {
    let rewards: [ClientReward]
}

struct PaymentMethodsWrapper: Codable {
    let paymentMethods: [ClientPaymentMethod]
}

struct PaymentHistoryWrapper: Codable {
    let payments: [ClientPaymentHistoryItem]
}

struct ClientAppointmentsResponse: Codable {
    let upcoming: [ClientPortalAppointment]
    let past: [ClientPortalAppointment]
}

struct ClientPortalAppointment: Codable, Identifiable {
    let id: String
    let scheduledStart: Date
    let scheduledEnd: Date
    let status: String
    let notes: String?
    let salon: ClientAppointmentSalon
    let services: [ClientAppointmentService]
    let staff: ClientAppointmentStaff?
    let locationId: String

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: scheduledStart)
    }

    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: scheduledStart)
    }

    var totalPrice: Double {
        services.reduce(0) { $0 + $1.price }
    }

    var totalDuration: Int {
        services.reduce(0) { $0 + $1.duration }
    }

    var statusColor: String {
        switch status.uppercased() {
        case "COMPLETED": return "success"
        case "CANCELLED": return "error"
        case "CONFIRMED": return "success"
        case "PENDING", "BOOKED": return "warning"
        default: return "softGray"
        }
    }
}

struct ClientAppointmentDetail: Codable, Identifiable {
    let id: String
    let scheduledStart: Date
    let scheduledEnd: Date
    let status: String
    let notes: String?
    let salon: ClientAppointmentSalon
    let services: [ClientAppointmentService]
    let staff: ClientAppointmentStaff?
    let locationId: String

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        return formatter.string(from: scheduledStart)
    }

    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return "\(formatter.string(from: scheduledStart)) - \(formatter.string(from: scheduledEnd))"
    }

    var totalPrice: Double {
        services.reduce(0) { $0 + $1.price }
    }

    var totalDuration: Int {
        services.reduce(0) { $0 + $1.duration }
    }

    var isUpcoming: Bool {
        scheduledStart > Date() && status != "CANCELLED" && status != "COMPLETED"
    }
}

struct ClientAppointmentSalon: Codable {
    let name: String
    let phone: String?
    let address: String
    let city: String
    let state: String

    var fullAddress: String {
        "\(address), \(city), \(state)"
    }
}

struct ClientAppointmentService: Codable, Identifiable {
    let id: String
    let name: String
    let duration: Int
    let price: Double

    var formattedPrice: String {
        String(format: "$%.2f", price)
    }

    var formattedDuration: String {
        "\(duration) min"
    }
}

struct ClientAppointmentStaff: Codable {
    let id: String
    let displayName: String
    let photo: String?
}

// MARK: - Profile Models

struct ClientPortalProfile: Codable {
    let id: String
    let firstName: String
    let lastName: String
    let email: String
    let phone: String?
    let birthday: Date?

    var fullName: String {
        "\(firstName) \(lastName)"
    }

    var initials: String {
        let first = firstName.prefix(1)
        let last = lastName.prefix(1)
        return "\(first)\(last)".uppercased()
    }
}

// MARK: - Payment Models

struct ClientPaymentMethod: Codable, Identifiable {
    let id: String
    let brand: String
    let last4: String
    let expMonth: Int
    let expYear: Int
    let isDefault: Bool

    var displayBrand: String {
        brand.capitalized
    }

    var expiryDate: String {
        String(format: "%02d/%d", expMonth, expYear)
    }

    var brandIcon: String {
        switch brand.lowercased() {
        case "visa": return "creditcard.fill"
        case "mastercard": return "creditcard.fill"
        case "amex": return "creditcard.fill"
        default: return "creditcard"
        }
    }
}

struct SetupIntentResponse: Codable {
    let clientSecret: String
}

struct SetDefaultPaymentResponse: Codable {
    let success: Bool
}

struct ClientPaymentHistoryItem: Codable, Identifiable {
    let id: String
    let amount: Int
    let status: String
    let date: Date
    let description: String
    let last4: String?
    let brand: String?

    var formattedAmount: String {
        String(format: "$%.2f", Double(amount) / 100.0)
    }

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    var statusColor: String {
        switch status.lowercased() {
        case "succeeded": return "success"
        case "failed": return "error"
        default: return "warning"
        }
    }
}

// MARK: - Loyalty Models

struct ClientLoyaltyAccount: Codable {
    let pointsBalance: Int
    let lifetimePoints: Int
    let tier: String

    var tierGradient: [String] {
        switch tier.lowercased() {
        case "platinum": return ["purple", "indigo"]
        case "gold": return ["yellow", "orange"]
        case "silver": return ["gray", "white"]
        default: return ["orange", "red"]
        }
    }
}

struct ClientReward: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let pointsCost: Int
    let image: String?
}

struct RedeemRewardResponse: Codable {
    let success: Bool
    let message: String?
    let pointsBalance: Int?
}

// MARK: - Booking Models

struct BookingLocation: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let address: String
    let city: String
    let state: String
    let phone: String?
    let rating: Double?
    let reviewCount: Int?

    var fullAddress: String {
        "\(address), \(city), \(state)"
    }
}

struct BookingService: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let description: String?
    let duration: Int
    let price: Double
    let categoryName: String?

    var formattedPrice: String {
        String(format: "$%.2f", price)
    }

    var formattedDuration: String {
        "\(duration) min"
    }
}

struct BookingStaff: Codable, Identifiable, Equatable {
    let id: String
    let displayName: String
    let photo: String?
    let title: String?
}

struct AvailableSlotsResponse: Codable {
    let date: String
    let slots: [TimeSlot]
}

// Response from /api/booking/availability (matches web flow)
struct BookingAvailabilityResponse: Codable {
    let date: String
    let locationId: String
    let serviceId: String?
    let duration: Int
    let slots: [BookingTimeSlot]
}

struct BookingTimeSlot: Codable, Identifiable {
    let time: String
    let available: Bool
    let availableStaff: [AvailableStaff]

    var id: String { time }

    var displayTime: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        if let date = formatter.date(from: time) {
            formatter.dateFormat = "h:mm a"
            return formatter.string(from: date)
        }
        return time
    }
}

struct AvailableStaff: Codable, Identifiable, Equatable {
    let id: String
    let firstName: String
    let lastName: String
    let avatar: String?
    let color: String

    var fullName: String {
        "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces)
    }

    var initials: String {
        let first = firstName.prefix(1)
        let last = lastName.prefix(1)
        return "\(first)\(last)".uppercased()
    }
}

struct TimeSlot: Codable, Identifiable {
    let time: String
    let available: Bool

    var id: String { time }

    var displayTime: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        if let date = formatter.date(from: time) {
            formatter.dateFormat = "h:mm a"
            return formatter.string(from: date)
        }
        return time
    }
}

struct ClientCreateAppointmentRequest: Encodable {
    let locationId: String
    let staffId: String
    let serviceIds: [String]
    let scheduledStart: String
    let notes: String?
    let paymentMethodId: String?
}

struct CreateAppointmentResponse: Codable {
    let id: String
    let status: String
    let scheduledStart: Date
}
