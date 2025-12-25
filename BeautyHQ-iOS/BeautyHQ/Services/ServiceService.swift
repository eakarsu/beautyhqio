import Foundation

actor ServiceService {
    static let shared = ServiceService()
    private init() {}

    func getServices(categoryId: String? = nil, isActive: Bool = true) async throws -> [Service] {
        var queryItems = [URLQueryItem(name: "isActive", value: String(isActive))]

        if let categoryId = categoryId {
            queryItems.append(URLQueryItem(name: "categoryId", value: categoryId))
        }

        return try await APIClient.shared.get("/services", queryItems: queryItems)
    }

    func getService(id: String) async throws -> Service {
        try await APIClient.shared.get("/services/\(id)")
    }

    func getCategories() async throws -> [ServiceCategory] {
        try await APIClient.shared.get("/services/categories")
    }
}
