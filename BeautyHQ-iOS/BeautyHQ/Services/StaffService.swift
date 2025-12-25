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
}
