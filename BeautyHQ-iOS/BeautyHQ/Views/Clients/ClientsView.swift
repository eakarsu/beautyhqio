import SwiftUI

struct ClientsView: View {
    @StateObject private var viewModel = ClientsViewModel()
    @State private var searchText = ""
    @State private var showingAddClient = false

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.clients.isEmpty {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.clients.isEmpty {
                    EmptyStateView(
                        icon: "person.2",
                        title: "No Clients",
                        message: "Add your first client to get started.",
                        actionTitle: "Add Client"
                    ) {
                        showingAddClient = true
                    }
                } else {
                    clientsList
                }
            }
            .navigationTitle("Clients")
            .searchable(text: $searchText, prompt: "Search clients...")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddClient = true
                    } label: {
                        Image(systemName: "person.badge.plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddClient) {
                AddClientView {
                    Task { await viewModel.loadClients() }
                }
            }
        }
        .task {
            await viewModel.loadClients()
        }
        .onChange(of: searchText) { _, newValue in
            viewModel.filterClients(query: newValue)
        }
        .onReceive(NotificationCenter.default.publisher(for: .clientDeleted)) { _ in
            Task { await viewModel.loadClients() }
        }
    }

    private var clientsList: some View {
        List {
            Text("\(viewModel.filteredClients.count) client\(viewModel.filteredClients.count != 1 ? "s" : "")")
                .font(.caption)
                .foregroundColor(.secondary)
                .listRowBackground(Color.clear)

            ForEach(viewModel.filteredClients) { client in
                NavigationLink(value: client) {
                    ClientRow(client: client)
                }
            }
        }
        .listStyle(.plain)
        .refreshable {
            await viewModel.loadClients()
        }
        .navigationDestination(for: Client.self) { client in
            ClientDetailView(client: client, onDelete: {
                Task { await viewModel.loadClients() }
            })
        }
    }
}

// MARK: - Client Row
struct ClientRow: View {
    let client: Client

    var body: some View {
        HStack(spacing: 14) {
            // Avatar
            Circle()
                .fill(Color.purple.opacity(0.15))
                .frame(width: 56, height: 56)
                .overlay(
                    Text(client.initials)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.purple)
                )

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(client.fullName)
                    .font(.headline)

                Label(client.formattedPhone, systemImage: "phone")
                    .font(.caption)
                    .foregroundColor(.secondary)

                if let email = client.email {
                    Label(email, systemImage: "envelope")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }

                // Stats
                HStack(spacing: 16) {
                    StatItem(value: "\(client.totalVisits ?? 0)", label: "Visits")
                    StatItem(value: formatCurrency(client.totalSpent ?? 0), label: "Spent")
                    StatItem(value: "\(client.loyaltyPoints ?? 0)", label: "Points")
                }
                .padding(.top, 4)
            }
        }
        .padding(.vertical, 4)
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "$\(Int(value))"
    }
}

// MARK: - Stat Item
struct StatItem: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 0) {
            Text(value)
                .font(.caption)
                .fontWeight(.semibold)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    ClientsView()
}
