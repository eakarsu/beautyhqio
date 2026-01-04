import Foundation
import UIKit
import StripePaymentSheet

// MARK: - Stripe Manager
@MainActor
class StripeManager: ObservableObject {
    static let shared = StripeManager()

    @Published var paymentSheet: PaymentSheet?
    @Published var paymentResult: PaymentSheetResult?
    @Published var isLoading = false
    @Published var error: String?

    private init() {
        // Configure Stripe with publishable key
        StripeAPI.defaultPublishableKey = Config.stripePublishableKey
    }

    // MARK: - Setup Intent Response
    private struct SetupIntentResponse: Decodable {
        let clientSecret: String
        let customerId: String
    }

    // Empty body for POST requests
    private struct StripeEmptyBody: Encodable {}

    // MARK: - Prepare Payment Sheet for Adding Card
    func prepareAddCard() async -> Bool {
        isLoading = true
        error = nil

        do {
            // Get SetupIntent from our backend
            let response: SetupIntentResponse = try await APIClient.shared.post(
                "/stripe/payment-methods",
                body: StripeEmptyBody()
            )

            // Configure PaymentSheet for SetupIntent
            var configuration = PaymentSheet.Configuration()
            configuration.merchantDisplayName = Config.appName
            configuration.allowsDelayedPaymentMethods = false
            configuration.defaultBillingDetails.address.country = "US"

            // Style configuration - Rose gold theme
            var appearance = PaymentSheet.Appearance()
            appearance.cornerRadius = 12
            appearance.colors.primary = UIColor(red: 183/255, green: 110/255, blue: 121/255, alpha: 1)
            appearance.colors.background = UIColor.systemBackground
            appearance.colors.componentBackground = UIColor.secondarySystemBackground
            appearance.colors.componentBorder = UIColor(white: 0.8, alpha: 1)
            appearance.colors.componentDivider = UIColor(white: 0.9, alpha: 1)
            appearance.colors.text = UIColor.label
            appearance.colors.textSecondary = UIColor.secondaryLabel
            configuration.appearance = appearance

            // Create PaymentSheet with SetupIntent
            paymentSheet = PaymentSheet(
                setupIntentClientSecret: response.clientSecret,
                configuration: configuration
            )

            isLoading = false
            return true
        } catch {
            self.error = "Failed to prepare card form: \(error.localizedDescription)"
            isLoading = false
            return false
        }
    }

    // MARK: - Handle Payment Result
    func handlePaymentResult(_ result: PaymentSheetResult) {
        paymentResult = result
        switch result {
        case .completed:
            error = nil
        case .canceled:
            error = nil
        case .failed(let paymentError):
            error = paymentError.localizedDescription
        }
    }

    // MARK: - Reset State
    func reset() {
        paymentSheet = nil
        paymentResult = nil
        error = nil
    }
}
