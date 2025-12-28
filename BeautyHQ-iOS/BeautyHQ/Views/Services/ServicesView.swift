import SwiftUI

struct ServicesView: View {
    @StateObject private var viewModel = ServicesViewModel()
    @State private var showingAddService = false
    @State private var searchText = ""

    var filteredServices: [Service] {
        if searchText.isEmpty {
            return viewModel.services
        }
        return viewModel.services.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else if viewModel.services.isEmpty {
                    EmptyServicesView()
                } else {
                    List {
                        ForEach(groupedServices.keys.sorted(), id: \.self) { category in
                            Section(header: Text(category)) {
                                ForEach(groupedServices[category] ?? []) { service in
                                    ServiceRow(service: service)
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                    .searchable(text: $searchText, prompt: "Search services")
                }
            }
            .navigationTitle("Services")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddService = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                await viewModel.loadServices()
            }
            .sheet(isPresented: $showingAddService) {
                AddServiceView()
            }
        }
        .task {
            await viewModel.loadServices()
        }
    }

    var groupedServices: [String: [Service]] {
        Dictionary(grouping: filteredServices) { $0.category?.name ?? "Uncategorized" }
    }
}

struct ServiceRow: View {
    let service: Service

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(service.name)
                    .font(.headline)
                HStack {
                    Text("\(service.duration) min")
                    Text("•")
                    Text(service.formattedPrice)
                }
                .font(.subheadline)
                .foregroundColor(.secondary)
            }

            Spacer()

            if service.isActive == true {
                Circle()
                    .fill(Color.green)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 4)
    }
}

struct EmptyServicesView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "scissors")
                .font(.system(size: 50))
                .foregroundColor(.gray)
            Text("No Services")
                .font(.title2)
                .fontWeight(.semibold)
            Text("Add your first service to get started")
                .foregroundColor(.secondary)
        }
    }
}

@MainActor
class ServicesViewModel: ObservableObject {
    @Published var services: [Service] = []
    @Published var isLoading = false

    func loadServices() async {
        isLoading = true
        do {
            services = try await APIClient.shared.get("/services")
        } catch {
            print("Failed to load services: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    ServicesView()
}
