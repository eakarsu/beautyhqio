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
        VStack(spacing: Spacing.lg) {
            ZStack {
                Circle()
                    .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                    .frame(width: 100, height: 100)

                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                    .scaleEffect(1.5)
            }

            Text("Loading...")
                .font(.appSubheadline)
                .foregroundColor(.softGray)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.screenBackground)
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    @EnvironmentObject var appState: AppState

    init() {
        // Configure tab bar appearance
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBackground

        // Selected state with rose gold
        let roseGoldColor = UIColor(Color.roseGold)
        appearance.stackedLayoutAppearance.selected.iconColor = roseGoldColor
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: roseGoldColor,
            .font: UIFont.systemFont(ofSize: 10, weight: .semibold)
        ]

        // Normal state
        let softGrayColor = UIColor(Color.softGray)
        appearance.stackedLayoutAppearance.normal.iconColor = softGrayColor
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: softGrayColor,
            .font: UIFont.systemFont(ofSize: 10, weight: .medium)
        ]

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }

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

            MoreView()
                .tabItem {
                    Label("More", systemImage: "ellipsis.circle.fill")
                }
                .tag(AppState.Tab.more)
        }
        .tint(.roseGold)
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager.shared)
        .environmentObject(AppState())
}
