import Foundation

struct CancelAppointmentRequest: Encodable {
    let reason: String?
}

actor AppointmentService {
    static let shared = AppointmentService()
    private init() {}

    func getAppointments(date: Date? = nil, status: AppointmentStatus? = nil) async throws -> [Appointment] {
        var queryItems: [URLQueryItem] = []

        if let date = date {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate]
            queryItems.append(URLQueryItem(name: "date", value: formatter.string(from: date)))
        }

        if let status = status {
            queryItems.append(URLQueryItem(name: "status", value: status.rawValue))
        }

        // Backend returns array directly, not paginated
        return try await APIClient.shared.get("/appointments", queryItems: queryItems.isEmpty ? nil : queryItems)
    }

    func getAppointment(id: String) async throws -> Appointment {
        try await APIClient.shared.get("/appointments/\(id)")
    }

    func getTodayAppointments() async throws -> [Appointment] {
        try await getAppointments(date: Date())
    }

    func getUpcomingAppointments(limit: Int = 10) async throws -> [Appointment] {
        let queryItems = [URLQueryItem(name: "limit", value: String(limit))]
        return try await APIClient.shared.get("/appointments/upcoming", queryItems: queryItems)
    }

    func createAppointment(_ request: CreateAppointmentRequest) async throws -> Appointment {
        try await APIClient.shared.post("/appointments", body: request)
    }

    func updateAppointment(id: String, _ request: UpdateAppointmentRequest) async throws -> Appointment {
        try await APIClient.shared.put("/appointments/\(id)", body: request)
    }

    func cancelAppointment(id: String, reason: String? = nil) async throws -> Appointment {
        try await APIClient.shared.post("/appointments/\(id)/cancel", body: CancelAppointmentRequest(reason: reason))
    }

    func checkIn(id: String) async throws -> Appointment {
        try await APIClient.shared.post("/appointments/\(id)/check-in", body: EmptyBody())
    }

    func startService(id: String) async throws -> Appointment {
        try await APIClient.shared.post("/appointments/\(id)/start", body: EmptyBody())
    }

    func complete(id: String) async throws -> Appointment {
        try await APIClient.shared.post("/appointments/\(id)/complete", body: EmptyBody())
    }

    func markNoShow(id: String) async throws -> Appointment {
        try await APIClient.shared.post("/appointments/\(id)/no-show", body: EmptyBody())
    }

    func getAvailableSlots(staffId: String, serviceId: String, date: Date) async throws -> [String] {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]

        let queryItems = [
            URLQueryItem(name: "staffId", value: staffId),
            URLQueryItem(name: "serviceId", value: serviceId),
            URLQueryItem(name: "date", value: formatter.string(from: date))
        ]

        return try await APIClient.shared.get("/appointments/available-slots", queryItems: queryItems)
    }

    // MARK: - Payment Methods

    /// Get payment methods for a client
    func getClientPaymentMethods(clientId: String) async throws -> [ClientPaymentMethod] {
        let wrapper: PaymentMethodsWrapper = try await APIClient.shared.get("/clients/\(clientId)/payment-methods")
        return wrapper.paymentMethods
    }

    /// Charge a client's payment method
    func chargePayment(clientId: String, paymentMethodId: String, amount: Int, staffId: String?, appointmentId: String?) async throws -> ChargeResponse {
        let request = ChargeRequest(
            amount: amount,
            clientId: clientId,
            paymentMethodId: paymentMethodId,
            staffId: staffId,
            metadata: appointmentId != nil ? ["appointmentId": appointmentId!] : nil
        )
        return try await APIClient.shared.post("/payments/charge", body: request)
    }

    /// Complete appointment with payment
    func completeWithPayment(appointment: Appointment) async throws -> Appointment {
        // Get client's payment methods
        guard let clientId = appointment.clientId else {
            throw AppointmentError.noClient
        }

        let paymentMethods = try await getClientPaymentMethods(clientId: clientId)

        // Find default or first payment method
        guard let paymentMethod = paymentMethods.first(where: { $0.isDefault }) ?? paymentMethods.first else {
            throw AppointmentError.noPaymentMethod
        }

        // Calculate amount in cents
        let amountInCents = Int(appointment.totalPrice * 100)

        if amountInCents > 0 {
            // Charge the payment
            let chargeResult = try await chargePayment(
                clientId: clientId,
                paymentMethodId: paymentMethod.id,
                amount: amountInCents,
                staffId: appointment.staffId,
                appointmentId: appointment.id
            )

            if !chargeResult.success {
                throw AppointmentError.paymentFailed(chargeResult.error ?? "Payment failed")
            }
        }

        // Mark appointment as complete
        return try await complete(id: appointment.id)
    }
}

// MARK: - Payment Models

struct ChargeRequest: Encodable {
    let amount: Int
    let clientId: String
    let paymentMethodId: String
    let staffId: String?
    let metadata: [String: String]?
}

struct ChargeResponse: Codable {
    let success: Bool
    let paymentIntentId: String?
    let amount: Double?
    let status: String?
    let error: String?
}

enum AppointmentError: LocalizedError {
    case noClient
    case noPaymentMethod
    case paymentFailed(String)

    var errorDescription: String? {
        switch self {
        case .noClient:
            return "No client associated with this appointment"
        case .noPaymentMethod:
            return "Client has no saved payment method"
        case .paymentFailed(let message):
            return "Payment failed: \(message)"
        }
    }
}
