import Foundation

enum Config {
    // Set to localhost for local testing, production for deployed
    static let apiBaseURL = "http://localhost:3000/api"
    // static let apiBaseURL = "https://beautyhq.io/api"  // Uncomment for production

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

    // Stripe Configuration
    static let stripePublishableKey: String = {
        #if DEBUG
        return ProcessInfo.processInfo.environment["STRIPE_PUBLISHABLE_KEY"] ?? "pk_test_517dTUvI61ZON1HDDm3DatTWR4BsHImmaWbEynNFMr1HNEFoQSoPF8biwQwYEC4bijPFgKA5TkSHNIJfZSv4a4v1W00HJtHCs2o"
        #else
        return "pk_test_517dTUvI61ZON1HDDm3DatTWR4BsHImmaWbEynNFMr1HNEFoQSoPF8biwQwYEC4bijPFgKA5TkSHNIJfZSv4a4v1W00HJtHCs2o"
        #endif
    }()
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
