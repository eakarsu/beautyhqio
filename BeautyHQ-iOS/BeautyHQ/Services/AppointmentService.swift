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
}
