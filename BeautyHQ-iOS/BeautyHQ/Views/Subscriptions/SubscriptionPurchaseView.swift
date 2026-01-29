import SwiftUI
import StoreKit

// MARK: - Subscription Purchase View (User-facing)
struct SubscriptionPurchaseView: View {
    @StateObject private var storeManager = StoreKitManager.shared
    @Environment(\.dismiss) private var dismiss
    @State private var selectedProduct: StoreProduct?
    @State private var showingPurchaseConfirm = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.xl) {
                    // Header
                    VStack(spacing: Spacing.md) {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(LinearGradient.goldGradient)

                        Text("Choose Your Plan")
                            .font(.appLargeTitle)
                            .foregroundColor(.charcoal)

                        Text("Unlock premium features to grow your business")
                            .font(.appSubheadline)
                            .foregroundColor(.softGray)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, Spacing.xl)

                    // Current Plan Status
                    if storeManager.hasActiveSubscription {
                        CurrentPlanCard(storeManager: storeManager)
                            .padding(.horizontal, Spacing.lg)
                    }

                    // Free Plan (STARTER)
                    StarterPlanCard(isCurrentPlan: !storeManager.hasActiveSubscription)
                        .padding(.horizontal, Spacing.lg)

                    // Subscription Plans
                    if storeManager.isLoading && storeManager.products.isEmpty {
                        ProgressView()
                            .padding()
                    } else if storeManager.products.isEmpty {
                        VStack(spacing: Spacing.md) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 32))
                                .foregroundColor(.warning)
                            Text("Unable to load subscription plans")
                                .font(.appSubheadline)
                                .foregroundColor(.softGray)
                            Button("Retry") {
                                Task { await storeManager.loadProducts() }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.roseGold)
                        }
                        .padding()
                    } else {
                        ForEach(storeManager.products, id: \.id) { product in
                            SubscriptionPlanCard(
                                product: product,
                                isSelected: selectedProduct?.id == product.id,
                                isPurchased: storeManager.purchasedSubscriptions.contains(where: { $0.id == product.id }),
                                onSelect: {
                                    selectedProduct = product
                                }
                            )
                            .padding(.horizontal, Spacing.lg)
                        }
                    }

                    // Error Message
                    if let error = storeManager.error {
                        HStack {
                            Image(systemName: "exclamationmark.circle.fill")
                                .foregroundColor(.error)
                            Text(error)
                                .font(.appCaption)
                                .foregroundColor(.error)
                        }
                        .padding()
                        .background(Color.error.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm))
                        .padding(.horizontal, Spacing.lg)
                    }

                    // Subscribe Button
                    if let selected = selectedProduct,
                       !storeManager.purchasedSubscriptions.contains(where: { $0.id == selected.id }) {
                        Button {
                            showingPurchaseConfirm = true
                        } label: {
                            HStack {
                                if storeManager.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Text("Subscribe to \(selected.displayName)")
                                    Text("- \(selected.displayPrice)/month")
                                }
                            }
                            .font(.appHeadline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(LinearGradient.roseGoldGradient)
                            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                        }
                        .disabled(storeManager.isLoading)
                        .padding(.horizontal, Spacing.lg)
                    }

                    // Restore Purchases
                    Button {
                        Task { await storeManager.restorePurchases() }
                    } label: {
                        Text("Restore Purchases")
                            .font(.appSubheadline)
                            .foregroundColor(.roseGold)
                    }
                    .padding(.top, Spacing.sm)

                    // Terms
                    VStack(spacing: Spacing.xs) {
                        Text("Subscriptions auto-renew monthly until cancelled.")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                        Text("Cancel anytime in Settings > Apple ID > Subscriptions")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                    }
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, Spacing.lg)
                    .padding(.bottom, Spacing.xl)
                }
            }
            .background(Color.screenBackground)
            .navigationTitle("Subscription")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.roseGold)
                }
            }
            .alert("Confirm Subscription", isPresented: $showingPurchaseConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Subscribe") {
                    guard let product = selectedProduct else { return }
                    Task {
                        let success = await storeManager.purchase(product)
                        if success {
                            dismiss()
                        }
                    }
                }
            } message: {
                if let product = selectedProduct {
                    Text("Subscribe to \(product.displayName) for \(product.displayPrice)/month?")
                }
            }
            .onChange(of: storeManager.purchaseSuccess) { _, success in
                if success {
                    dismiss()
                }
            }
        }
    }
}

// MARK: - Current Plan Card
struct CurrentPlanCard: View {
    @ObservedObject var storeManager: StoreKitManager

    var body: some View {
        VStack(spacing: Spacing.md) {
            HStack {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundColor(.success)
                Text("Current Plan")
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                Spacer()

                if let plan = storeManager.currentPlan {
                    Text(plan.displayName.uppercased())
                        .font(.appCaption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.xs)
                        .background(LinearGradient.goldGradient)
                        .clipShape(Capsule())
                }
            }

            if let status = storeManager.subscriptionGroupStatus {
                HStack {
                    Text("Status:")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    Text(status.displayText)
                        .font(.appCaption)
                        .fontWeight(.medium)
                        .foregroundColor(status.isActive ? .success : .warning)
                }
            }
        }
        .padding(Spacing.lg)
        .background(Color.success.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.md)
                .stroke(Color.success.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Starter Plan Card (Free)
struct StarterPlanCard: View {
    let isCurrentPlan: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    HStack {
                        Text("STARTER")
                            .font(.appTitle3)
                            .fontWeight(.bold)
                            .foregroundColor(.charcoal)

                        if isCurrentPlan {
                            Text("CURRENT")
                                .font(.appCaption2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, Spacing.sm)
                                .padding(.vertical, 2)
                                .background(Color.softGray)
                                .clipShape(Capsule())
                        }
                    }

                    Text("Free forever")
                        .font(.appSubheadline)
                        .foregroundColor(.softGray)
                }

                Spacer()

                Text("$0")
                    .font(.appLargeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.charcoal)
            }

            AppDivider()

            VStack(alignment: .leading, spacing: Spacing.sm) {
                FeatureRow(text: "Basic appointment booking", included: true)
                FeatureRow(text: "Client management", included: true)
                FeatureRow(text: "9% commission on marketplace leads", included: true, isNegative: true)
            }
        }
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.lg)
                .stroke(isCurrentPlan ? Color.softGray : Color.clear, lineWidth: 2)
        )
        .appShadow(.soft)
    }
}

// MARK: - Subscription Plan Card
struct SubscriptionPlanCard: View {
    let product: StoreProduct
    let isSelected: Bool
    let isPurchased: Bool
    let onSelect: () -> Void

    private var subscriptionProduct: SubscriptionProduct? {
        SubscriptionProduct(rawValue: product.id)
    }

    private var isPro: Bool {
        subscriptionProduct == .pro
    }

    var body: some View {
        Button(action: onSelect) {
            VStack(alignment: .leading, spacing: Spacing.md) {
                HStack {
                    VStack(alignment: .leading, spacing: Spacing.xs) {
                        HStack {
                            Text(product.displayName.uppercased())
                                .font(.appTitle3)
                                .fontWeight(.bold)
                                .foregroundColor(.charcoal)

                            if isPurchased {
                                Text("CURRENT")
                                    .font(.appCaption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, Spacing.sm)
                                    .padding(.vertical, 2)
                                    .background(LinearGradient.goldGradient)
                                    .clipShape(Capsule())
                            } else if isPro {
                                Text("BEST VALUE")
                                    .font(.appCaption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, Spacing.sm)
                                    .padding(.vertical, 2)
                                    .background(LinearGradient.roseGoldGradient)
                                    .clipShape(Capsule())
                            }
                        }

                        Text(product.description)
                            .font(.appSubheadline)
                            .foregroundColor(.softGray)
                    }

                    Spacer()

                    VStack(alignment: .trailing) {
                        Text(product.displayPrice)
                            .font(.appLargeTitle)
                            .fontWeight(.bold)
                            .foregroundStyle(isPro ? LinearGradient.goldGradient : LinearGradient.roseGoldGradient)
                        Text("/month")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                    }
                }

                AppDivider()

                VStack(alignment: .leading, spacing: Spacing.sm) {
                    FeatureRow(text: "Everything in Starter", included: true)
                    FeatureRow(text: "0% commission on marketplace", included: true)

                    if isPro {
                        FeatureRow(text: "AI-powered insights", included: true)
                        FeatureRow(text: "Advanced analytics", included: true)
                        FeatureRow(text: "Priority support", included: true)
                    }
                }
            }
            .padding(Spacing.lg)
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg))
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.lg)
                    .stroke(
                        isSelected || isPurchased
                            ? (isPro ? Color.roseGold : Color.roseGold)
                            : Color.clear,
                        lineWidth: 2
                    )
            )
            .appShadow(isSelected ? .medium : .soft)
        }
        .buttonStyle(.plain)
        .disabled(isPurchased)
    }
}

// MARK: - Feature Row
struct FeatureRow: View {
    let text: String
    let included: Bool
    var isNegative: Bool = false

    var body: some View {
        HStack(spacing: Spacing.sm) {
            Image(systemName: included ? "checkmark.circle.fill" : "xmark.circle.fill")
                .font(.system(size: 16))
                .foregroundColor(isNegative ? .warning : (included ? .success : .softGray))

            Text(text)
                .font(.appSubheadline)
                .foregroundColor(isNegative ? .warning : .charcoal)
        }
    }
}

// MARK: - Preview
#Preview {
    SubscriptionPurchaseView()
}
