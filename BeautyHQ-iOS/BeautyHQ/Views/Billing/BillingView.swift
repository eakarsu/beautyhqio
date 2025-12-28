import SwiftUI

struct BillingView: View {
    @StateObject private var viewModel = BillingViewModel()
    @State private var showingAddPayment = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Security Notice
                    SecurityNoticeCard()
                        .padding(.horizontal, Spacing.lg)

                    // Payment Methods Section
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        HStack {
                            Text("Payment Methods")
                                .font(.appTitle3)
                                .foregroundColor(.charcoal)

                            Spacer()

                            Button {
                                showingAddPayment = true
                            } label: {
                                HStack(spacing: Spacing.xs) {
                                    Image(systemName: "plus")
                                    Text("Add Card")
                                }
                                .font(.appSubheadline)
                                .foregroundColor(.white)
                                .padding(.horizontal, Spacing.md)
                                .padding(.vertical, Spacing.sm)
                                .background(LinearGradient.roseGoldGradient)
                                .clipShape(Capsule())
                            }
                        }
                        .padding(.horizontal, Spacing.lg)

                        if viewModel.isLoading {
                            AppLoadingView()
                                .frame(height: 200)
                        } else if viewModel.paymentMethods.isEmpty {
                            EmptyPaymentMethodsCard {
                                showingAddPayment = true
                            }
                            .padding(.horizontal, Spacing.lg)
                        } else {
                            VStack(spacing: Spacing.sm) {
                                ForEach(viewModel.paymentMethods) { method in
                                    PaymentMethodCard(
                                        method: method,
                                        onDelete: {
                                            Task {
                                                await viewModel.deletePaymentMethod(id: method.id)
                                            }
                                        }
                                    )
                                }
                            }
                            .padding(.horizontal, Spacing.lg)
                        }
                    }

                    // Invoices Section
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Recent Invoices")
                            .font(.appTitle3)
                            .foregroundColor(.charcoal)
                            .padding(.horizontal, Spacing.lg)

                        if viewModel.invoices.isEmpty {
                            VStack(spacing: Spacing.md) {
                                Image(systemName: "doc.text")
                                    .font(.system(size: 32))
                                    .foregroundColor(.softGray)
                                Text("No invoices yet")
                                    .font(.appSubheadline)
                                    .foregroundColor(.softGray)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, Spacing.xl)
                            .background(Color.cardBackground)
                            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                            .padding(.horizontal, Spacing.lg)
                        } else {
                            VStack(spacing: Spacing.sm) {
                                ForEach(viewModel.invoices) { invoice in
                                    InvoiceCard(invoice: invoice)
                                }
                            }
                            .padding(.horizontal, Spacing.lg)
                        }
                    }

                    // What We Store Section
                    WhatWeStoreCard()
                        .padding(.horizontal, Spacing.lg)
                }
                .padding(.vertical, Spacing.lg)
            }
            .background(Color.screenBackground)
            .navigationTitle("Billing")
            .refreshable {
                await viewModel.loadData()
            }
        }
        .task {
            await viewModel.loadData()
        }
        .alert("Delete Card", isPresented: $viewModel.showDeleteConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                Task {
                    if let id = viewModel.pendingDeleteId {
                        await viewModel.confirmDelete(id: id)
                    }
                }
            }
        } message: {
            Text("Are you sure you want to remove this payment method?")
        }
    }
}

// MARK: - Security Notice Card
struct SecurityNoticeCard: View {
    var body: some View {
        HStack(spacing: Spacing.md) {
            ZStack {
                Circle()
                    .fill(Color.success.opacity(0.15))
                    .frame(width: 50, height: 50)

                Image(systemName: "shield.checkered")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundColor(.success)
            }

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text("Your payment info is secure")
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)

                Text("We use Stripe for secure payment processing. Your card details are encrypted and never stored on our servers.")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }
        }
        .padding(Spacing.md)
        .background(Color.success.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.md)
                .stroke(Color.success.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Empty Payment Methods Card
struct EmptyPaymentMethodsCard: View {
    let onAdd: () -> Void

    var body: some View {
        VStack(spacing: Spacing.lg) {
            ZStack {
                Circle()
                    .fill(Color.blushPink.opacity(0.3))
                    .frame(width: 80, height: 80)

                Image(systemName: "creditcard")
                    .font(.system(size: 32, weight: .medium))
                    .foregroundColor(.roseGold)
            }

            VStack(spacing: Spacing.sm) {
                Text("No payment methods")
                    .font(.appTitle3)
                    .foregroundColor(.charcoal)

                Text("Add a card to enable quick and easy payments")
                    .font(.appSubheadline)
                    .foregroundColor(.softGray)
                    .multilineTextAlignment(.center)
            }

            Button(action: onAdd) {
                HStack(spacing: Spacing.sm) {
                    Image(systemName: "plus")
                    Text("Add Your First Card")
                }
                .font(.appHeadline)
                .foregroundColor(.white)
                .padding(.horizontal, Spacing.xl)
                .padding(.vertical, Spacing.md)
                .background(LinearGradient.roseGoldGradient)
                .clipShape(Capsule())
                .shadow(color: .roseGold.opacity(0.4), radius: 8, x: 0, y: 4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.xl)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
        .appShadow(.soft)
    }
}

// MARK: - Payment Method Card
struct PaymentMethodCard: View {
    let method: StripePaymentMethod
    let onDelete: () -> Void

    var cardColor: Color {
        switch method.brand.lowercased() {
        case "visa": return Color(hex: "1A1F71")
        case "mastercard": return Color(hex: "EB001B")
        case "amex": return Color(hex: "006FCF")
        case "discover": return Color(hex: "FF6600")
        default: return .roseGold
        }
    }

    var body: some View {
        HStack(spacing: Spacing.md) {
            // Card brand icon
            ZStack {
                RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous)
                    .fill(cardColor.opacity(0.15))
                    .frame(width: 50, height: 50)

                Image(systemName: "creditcard.fill")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(cardColor)
            }

            VStack(alignment: .leading, spacing: Spacing.xs) {
                HStack(spacing: Spacing.sm) {
                    Text(method.brand.capitalized)
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    Text("•••• \(method.last4)")
                        .font(.appBody)
                        .foregroundColor(.softGray)

                    if method.isDefault {
                        Text("Default")
                            .font(.appCaption2)
                            .foregroundColor(.roseGold)
                            .padding(.horizontal, Spacing.sm)
                            .padding(.vertical, 2)
                            .background(Color.roseGold.opacity(0.15))
                            .clipShape(Capsule())
                    }
                }

                Text("Expires \(method.expMonth)/\(method.expYear)")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }

            Spacer()

            Button(action: onDelete) {
                Image(systemName: "trash")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.error)
                    .padding(Spacing.sm)
                    .background(Color.error.opacity(0.1))
                    .clipShape(Circle())
            }
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .appShadow(.soft)
    }
}

// MARK: - Invoice Card
struct InvoiceCard: View {
    let invoice: BillingInvoice

    var statusColor: Color {
        switch invoice.status.lowercased() {
        case "paid": return .success
        case "pending": return .warning
        case "overdue": return .error
        default: return .softGray
        }
    }

    var body: some View {
        HStack(spacing: Spacing.md) {
            // Invoice icon
            ZStack {
                RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous)
                    .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                    .frame(width: 44, height: 44)

                Image(systemName: "doc.text.fill")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(.roseGold)
            }

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(invoice.description)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                    .lineLimit(1)

                Text(invoice.date, style: .date)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: Spacing.xs) {
                Text(invoice.formattedAmount)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)

                Text(invoice.status.capitalized)
                    .font(.appCaption2)
                    .foregroundColor(statusColor)
                    .padding(.horizontal, Spacing.sm)
                    .padding(.vertical, 2)
                    .background(statusColor.opacity(0.15))
                    .clipShape(Capsule())
            }
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .appShadow(.soft)
    }
}

// MARK: - What We Store Card
struct WhatWeStoreCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            HStack(spacing: Spacing.sm) {
                Image(systemName: "lock.fill")
                    .foregroundColor(.roseGold)
                Text("What we store")
                    .font(.appTitle3)
                    .foregroundColor(.charcoal)
            }

            HStack(alignment: .top, spacing: Spacing.xl) {
                // What we store
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    HStack(spacing: Spacing.xs) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.success)
                        Text("We store:")
                            .font(.appHeadline)
                            .foregroundColor(.success)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        StoredItemRow(text: "Card brand (Visa, etc.)")
                        StoredItemRow(text: "Last 4 digits")
                        StoredItemRow(text: "Expiration date")
                        StoredItemRow(text: "Secure token")
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // What we never store
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    HStack(spacing: Spacing.xs) {
                        Image(systemName: "shield.fill")
                            .foregroundColor(.error)
                        Text("Never store:")
                            .font(.appHeadline)
                            .foregroundColor(.error)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        StoredItemRow(text: "Full card number")
                        StoredItemRow(text: "CVV/Security code")
                        StoredItemRow(text: "PIN")
                        StoredItemRow(text: "Sensitive data")
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
        .appShadow(.soft)
    }
}

struct StoredItemRow: View {
    let text: String

    var body: some View {
        Text("• \(text)")
            .font(.appCaption)
            .foregroundColor(.softGray)
    }
}

// MARK: - Models
struct StripePaymentMethod: Identifiable, Codable {
    let id: String
    let brand: String
    let last4: String
    let expMonth: Int
    let expYear: Int
    let isDefault: Bool
}

struct StripePaymentMethodsResponse: Codable {
    let paymentMethods: [StripePaymentMethod]
}

struct BillingInvoice: Identifiable, Codable {
    let id: String
    let description: String
    let subscriptionAmount: Double
    let commissionAmount: Double
    let totalAmount: Double
    let status: String
    let createdAt: Date

    var date: Date { createdAt }

    var formattedAmount: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: totalAmount)) ?? "$\(totalAmount)"
    }

    enum CodingKeys: String, CodingKey {
        case id, description, subscriptionAmount, commissionAmount, totalAmount, status, createdAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        description = try container.decodeIfPresent(String.self, forKey: .description) ?? "Invoice"
        subscriptionAmount = try container.decodeFlexibleDouble(forKey: .subscriptionAmount)
        commissionAmount = try container.decodeFlexibleDouble(forKey: .commissionAmount)
        totalAmount = try container.decodeFlexibleDouble(forKey: .totalAmount)
        status = try container.decode(String.self, forKey: .status)
        createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt) ?? Date()
    }
}

struct BillingInvoicesResponse: Codable {
    let invoices: [BillingInvoice]
    let total: Int
}

// MARK: - ViewModel
@MainActor
class BillingViewModel: ObservableObject {
    @Published var paymentMethods: [StripePaymentMethod] = []
    @Published var invoices: [BillingInvoice] = []
    @Published var isLoading = false
    @Published var showDeleteConfirm = false
    @Published var pendingDeleteId: String?

    func loadData() async {
        isLoading = true

        // Load payment methods
        do {
            let response: StripePaymentMethodsResponse = try await APIClient.shared.get("/stripe/payment-methods")
            paymentMethods = response.paymentMethods
        } catch {
            print("Failed to load payment methods: \(error)")
        }

        // Load invoices
        do {
            let response: BillingInvoicesResponse = try await APIClient.shared.get("/business/invoices")
            invoices = response.invoices
        } catch {
            print("Failed to load invoices: \(error)")
        }

        isLoading = false
    }

    func deletePaymentMethod(id: String) async {
        pendingDeleteId = id
        showDeleteConfirm = true
    }

    func confirmDelete(id: String) async {
        do {
            struct DeleteRequest: Encodable {
                let paymentMethodId: String
            }
            struct DeleteResponse: Codable {
                let success: Bool?
            }
            let _: DeleteResponse = try await APIClient.shared.delete("/stripe/payment-methods", body: DeleteRequest(paymentMethodId: id))
            paymentMethods.removeAll { $0.id == id }
        } catch {
            print("Failed to delete payment method: \(error)")
        }
        pendingDeleteId = nil
    }
}

#Preview {
    BillingView()
}
