import Foundation

enum Config {
    // Automatically switch between local and production
    static var apiBaseURL: String {
        #if DEBUG
        // Debug builds use localhost (works for simulator and macOS)
        return "http://localhost:3000/api"
        #else
        // Release builds always use production
        return "https://beautyhq.io/api"
        #endif
    }

    // Web base URL (for terms, privacy pages)
    static var webBaseURL: String {
        apiBaseURL.replacingOccurrences(of: "/api", with: "")
    }

    static let appName = "BeautyHQ"
    static let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    static let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"

    // Feature flags
    static let enablePushNotifications = true
    static let enableApplePay = true
    static let enableBiometricAuth = true

    // API Timeouts
    static let requestTimeout: TimeInterval = 30
    static let resourceTimeout: TimeInterval = 60

    // Cache settings
    static let tokenCacheKey = "auth_token"
    static let userCacheKey = "current_user"

    // Stripe Configuration (used for web - keeping for reference)
    static let stripePublishableKey: String = {
        #if DEBUG
        return ProcessInfo.processInfo.environment["STRIPE_PUBLISHABLE_KEY"] ?? "pk_test_517dTUvI61ZON1HDDm3DatTWR4BsHImmaWbEynNFMr1HNEFoQSoPF8biwQwYEC4bijPFgKA5TkSHNIJfZSv4a4v1W00HJtHCs2o"
        #else
        return "pk_test_517dTUvI61ZON1HDDm3DatTWR4BsHImmaWbEynNFMr1HNEFoQSoPF8biwQwYEC4bijPFgKA5TkSHNIJfZSv4a4v1W00HJtHCs2o"
        #endif
    }()

    // MARK: - StoreKit / In-App Purchase Configuration
    // These product IDs must match what you configure in App Store Connect
    enum StoreKit {
        static let subscriptionGroupID = "beautyhq_subscriptions"

        // Subscription Product IDs
        static let growthMonthly = "com.beautyhq.subscription.growth"
        static let proMonthly = "com.beautyhq.subscription.pro"

        static var allProductIDs: [String] {
            [growthMonthly, proMonthly]
        }
    }
}

// MARK: - Brand Colors
extension Config {
    enum Colors {
        static let primary = "#7C3AED"
        static let secondary = "#EC4899"
        static let success = "#10B981"
        static let warning = "#F59E0B"
        static let error = "#EF4444"
        static let info = "#3B82F6"
    }
}
