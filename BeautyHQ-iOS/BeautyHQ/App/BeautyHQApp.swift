import SwiftUI

@main
struct BeautyHQApp: App {
    @StateObject private var authManager = AuthManager.shared
    @StateObject private var appState = AppState()

    init() {
        setupAppearance()

        // Log build configuration and API URL for debugging
        #if DEBUG
        print("🔧 BUILD: DEBUG")
        #else
        print("🚀 BUILD: RELEASE")
        #endif
        print("🌐 API URL: \(Config.apiBaseURL)")
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(appState)
        }
    }

    private func setupAppearance() {
        // Navigation bar appearance
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = .systemBackground
        navAppearance.titleTextAttributes = [.foregroundColor: UIColor.label]
        navAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor.label]

        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance

        // Tab bar appearance
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = .systemBackground

        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
    }
}

// MARK: - App State
class AppState: ObservableObject {
    @Published var selectedTab: Tab = .dashboard
    @Published var isShowingBooking = false
    @Published var isShowingCheckout = false

    enum Tab: Int {
        case dashboard = 0
        case appointments = 1
        case clients = 2
        case pos = 3
        case more = 4
    }
}
