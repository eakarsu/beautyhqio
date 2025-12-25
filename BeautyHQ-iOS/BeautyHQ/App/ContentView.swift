import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var appState: AppState

    var body: some View {
        Group {
            if authManager.isLoading {
                LoadingView()
            } else if authManager.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut, value: authManager.isAuthenticated)
    }
}

// MARK: - Loading View
struct LoadingView: View {
    var body: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }
                .tag(AppState.Tab.dashboard)

            AppointmentsView()
                .tabItem {
                    Label("Appointments", systemImage: "calendar")
                }
                .tag(AppState.Tab.appointments)

            ClientsView()
                .tabItem {
                    Label("Clients", systemImage: "person.2.fill")
                }
                .tag(AppState.Tab.clients)

            POSView()
                .tabItem {
                    Label("POS", systemImage: "cart.fill")
                }
                .tag(AppState.Tab.pos)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(AppState.Tab.settings)
        }
        .tint(Color.accentColor)
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager.shared)
        .environmentObject(AppState())
}
