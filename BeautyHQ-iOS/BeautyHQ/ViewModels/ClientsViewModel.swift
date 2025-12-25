import Foundation

@MainActor
class ClientsViewModel: ObservableObject {
    @Published var clients: [Client] = []
    @Published var filteredClients: [Client] = []
    @Published var isLoading = false
    @Published var error: String?

    private var searchQuery = ""

    func loadClients() async {
        isLoading = true
        error = nil

        do {
            let response = try await ClientService.shared.getClients(page: 1, pageSize: 100)
            clients = response.data
            filterClients(query: searchQuery)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func filterClients(query: String) {
        searchQuery = query

        if query.isEmpty {
            filteredClients = clients
        } else {
            let lowercasedQuery = query.lowercased()
            filteredClients = clients.filter { client in
                client.firstName.lowercased().contains(lowercasedQuery) ||
                (client.lastName?.lowercased().contains(lowercasedQuery) ?? false) ||
                (client.email?.lowercased().contains(lowercasedQuery) ?? false) ||
                (client.phone?.contains(query) ?? false)
            }
        }
    }

    func deleteClient(_ client: Client) async {
        do {
            try await ClientService.shared.deleteClient(id: client.id)
            clients.removeAll { $0.id == client.id }
            filterClients(query: searchQuery)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
