import Foundation
import StoreKit

// Use typealias to avoid conflict with app's Product model
typealias StoreProduct = StoreKit.Product
typealias StoreTransaction = StoreKit.Transaction

// MARK: - Product Identifiers
enum SubscriptionProduct: String, CaseIterable {
    case growth = "com.beautyhq.subscription.growth"
    case pro = "com.beautyhq.subscription.pro"

    var displayName: String {
        switch self {
        case .growth: return "Growth"
        case .pro: return "Pro"
        }
    }

    var description: String {
        switch self {
        case .growth: return "No commission on marketplace leads"
        case .pro: return "No commission + Premium features"
        }
    }

    var monthlyPrice: String {
        switch self {
        case .growth: return "$49"
        case .pro: return "$149"
        }
    }
}

// MARK: - StoreKit Manager
@MainActor
class StoreKitManager: ObservableObject {
    static let shared = StoreKitManager()

    @Published private(set) var products: [StoreProduct] = []
    @Published private(set) var purchasedSubscriptions: [StoreProduct] = []
    @Published private(set) var subscriptionGroupStatus: RenewalState?
    @Published var isLoading = false
    @Published var error: String?
    @Published var purchaseSuccess = false

    private var updateListenerTask: Task<Void, Error>?

    private init() {
        // Start listening for transactions
        updateListenerTask = listenForTransactions()

        // Load products on init
        Task {
            await loadProducts()
            await updateCustomerProductStatus()
        }
    }

    deinit {
        updateListenerTask?.cancel()
    }

    // MARK: - Load Products
    func loadProducts() async {
        isLoading = true
        error = nil

        do {
            let productIds = SubscriptionProduct.allCases.map { $0.rawValue }
            let storeProducts = try await StoreProduct.products(for: productIds)

            // Sort by price
            products = storeProducts.sorted { $0.price < $1.price }
            isLoading = false
        } catch {
            self.error = "Failed to load products: \(error.localizedDescription)"
            isLoading = false
        }
    }

    // MARK: - Purchase
    func purchase(_ product: StoreProduct) async -> Bool {
        isLoading = true
        error = nil
        purchaseSuccess = false

        do {
            let result = try await product.purchase()

            switch result {
            case .success(let verification):
                // Check if the transaction is verified
                let transaction: StoreTransaction = try checkVerified(verification)

                // Update the customer's subscription status
                await updateCustomerProductStatus()

                // Always finish the transaction
                await transaction.finish()

                isLoading = false
                purchaseSuccess = true
                return true

            case .userCancelled:
                isLoading = false
                return false

            case .pending:
                // Transaction waiting for approval (e.g., Ask to Buy)
                isLoading = false
                error = "Purchase is pending approval"
                return false

            @unknown default:
                isLoading = false
                return false
            }
        } catch {
            self.error = "Purchase failed: \(error.localizedDescription)"
            isLoading = false
            return false
        }
    }

    // MARK: - Restore Purchases
    func restorePurchases() async {
        isLoading = true
        error = nil

        do {
            try await AppStore.sync()
            await updateCustomerProductStatus()
            isLoading = false
        } catch {
            self.error = "Failed to restore purchases: \(error.localizedDescription)"
            isLoading = false
        }
    }

    // MARK: - Check Current Subscription
    func updateCustomerProductStatus() async {
        var purchasedSubs: [StoreProduct] = []

        // Iterate through all the user's purchased products
        for await result in StoreTransaction.currentEntitlements {
            do {
                let transaction: StoreTransaction = try checkVerified(result)

                // Check if this transaction is for one of our subscription products
                if let product = products.first(where: { $0.id == transaction.productID }) {
                    purchasedSubs.append(product)
                }
            } catch {
                print("Transaction verification failed: \(error)")
            }
        }

        purchasedSubscriptions = purchasedSubs

        // Get subscription status
        await updateSubscriptionStatus()
    }

    // MARK: - Get Subscription Status
    private func updateSubscriptionStatus() async {
        // Get the subscription status for our subscription group
        guard let product = products.first,
              let subscription = product.subscription else {
            return
        }

        do {
            let statuses = try await subscription.status

            for status in statuses {
                switch status.state {
                case .subscribed:
                    subscriptionGroupStatus = .subscribed
                    return
                case .expired:
                    subscriptionGroupStatus = .expired
                case .inBillingRetryPeriod:
                    subscriptionGroupStatus = .inBillingRetryPeriod
                case .inGracePeriod:
                    subscriptionGroupStatus = .inGracePeriod
                case .revoked:
                    subscriptionGroupStatus = .revoked
                default:
                    break
                }
            }
        } catch {
            print("Failed to get subscription status: \(error)")
        }
    }

    // MARK: - Check if User Has Active Subscription
    var hasActiveSubscription: Bool {
        !purchasedSubscriptions.isEmpty
    }

    // MARK: - Get Current Plan
    var currentPlan: SubscriptionProduct? {
        guard let purchased = purchasedSubscriptions.first else { return nil }
        return SubscriptionProduct(rawValue: purchased.id)
    }

    // MARK: - Transaction Listener
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            // Iterate through any transactions that don't come from a direct call to `purchase()`
            for await result in StoreTransaction.updates {
                do {
                    let transaction: StoreTransaction = try await self.checkVerified(result)

                    // Update customer product status
                    await self.updateCustomerProductStatus()

                    // Always finish the transaction
                    await transaction.finish()
                } catch {
                    print("Transaction failed verification: \(error)")
                }
            }
        }
    }

    // MARK: - Verify Transaction
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }

    // MARK: - Format Price
    func formattedPrice(for product: StoreProduct) -> String {
        product.displayPrice
    }

    // MARK: - Get Product by ID
    func product(for subscriptionProduct: SubscriptionProduct) -> StoreProduct? {
        products.first { $0.id == subscriptionProduct.rawValue }
    }
}

// MARK: - Store Errors
enum StoreError: Error, LocalizedError {
    case failedVerification
    case productNotFound
    case purchaseFailed

    var errorDescription: String? {
        switch self {
        case .failedVerification:
            return "Transaction verification failed"
        case .productNotFound:
            return "Product not found"
        case .purchaseFailed:
            return "Purchase failed"
        }
    }
}

// MARK: - Renewal State (for display)
enum RenewalState {
    case subscribed
    case expired
    case inBillingRetryPeriod
    case inGracePeriod
    case revoked

    var displayText: String {
        switch self {
        case .subscribed:
            return "Active"
        case .expired:
            return "Expired"
        case .inBillingRetryPeriod:
            return "Payment Issue"
        case .inGracePeriod:
            return "Grace Period"
        case .revoked:
            return "Revoked"
        }
    }

    var isActive: Bool {
        switch self {
        case .subscribed, .inGracePeriod:
            return true
        default:
            return false
        }
    }
}
