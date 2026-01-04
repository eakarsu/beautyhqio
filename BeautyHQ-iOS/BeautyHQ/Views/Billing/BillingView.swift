import SwiftUI
import UIKit
import StripePaymentSheet

struct BillingView: View {
    @StateObject private var viewModel = BillingViewModel()
    @StateObject private var stripeManager = StripeManager.shared
    @State private var showingAddCard = false

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
                                showingAddCard = true
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
                                showingAddCard = true
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
        .sheet(isPresented: $showingAddCard) {
            StripeAddCardSheet {
                // Refresh payment methods after adding
                Task {
                    await viewModel.loadData()
                }
            }
        }
    }
}

// MARK: - Stripe Add Card Sheet
struct StripeAddCardSheet: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var stripeManager = StripeManager.shared
    @State private var isPaymentSheetReady = false
    let onSuccess: () -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: Spacing.xl) {
                if stripeManager.isLoading {
                    VStack(spacing: Spacing.lg) {
                        ProgressView()
                            .scaleEffect(1.5)
                        Text("Preparing secure form...")
                            .font(.appSubheadline)
                            .foregroundColor(.softGray)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = stripeManager.error {
                    VStack(spacing: Spacing.lg) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.error)
                        Text("Error")
                            .font(.appTitle3)
                            .foregroundColor(.charcoal)
                        Text(error)
                            .font(.appSubheadline)
                            .foregroundColor(.softGray)
                            .multilineTextAlignment(.center)
                        Button("Try Again") {
                            Task {
                                await preparePaymentSheet()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.roseGold)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if isPaymentSheetReady, let paymentSheet = stripeManager.paymentSheet {
                    // Payment sheet is ready - present it
                    PaymentSheetPresenter(
                        paymentSheet: paymentSheet,
                        onCompletion: { result in
                            stripeManager.handlePaymentResult(result)
                            if case .completed = result {
                                onSuccess()
                                dismiss()
                            } else if case .canceled = result {
                                dismiss()
                            }
                        }
                    )
                } else {
                    // Initial state - preparing
                    VStack(spacing: Spacing.lg) {
                        ProgressView()
                            .scaleEffect(1.5)
                        Text("Loading...")
                            .font(.appSubheadline)
                            .foregroundColor(.softGray)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .background(Color.screenBackground)
            .navigationTitle("Add Payment Method")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .task {
            await preparePaymentSheet()
        }
    }

    private func preparePaymentSheet() async {
        stripeManager.reset()
        if await stripeManager.prepareAddCard() {
            isPaymentSheetReady = true
        }
    }
}

// MARK: - Payment Sheet Presenter (UIKit wrapper)
struct PaymentSheetPresenter: UIViewControllerRepresentable {
    let paymentSheet: PaymentSheet
    let onCompletion: (PaymentSheetResult) -> Void

    func makeUIViewController(context: Context) -> UIViewController {
        let viewController = UIViewController()
        viewController.view.backgroundColor = .clear
        return viewController
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
        // Present payment sheet when view appears
        if !context.coordinator.hasPresented {
            context.coordinator.hasPresented = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                paymentSheet.present(from: uiViewController) { result in
                    onCompletion(result)
                }
            }
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator {
        var hasPresented = false
    }
}

// MARK: - Add Payment Method View
struct AddPaymentMethodView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddPaymentMethodViewModel()
    let onSuccess: () -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: Spacing.xl) {
                // Card illustration
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(LinearGradient.roseGoldGradient)
                        .frame(height: 180)
                        .shadow(color: .roseGold.opacity(0.4), radius: 12, y: 6)

                    VStack(alignment: .leading, spacing: Spacing.lg) {
                        HStack {
                            Image(systemName: "creditcard.fill")
                                .font(.title2)
                            Spacer()
                            Image(systemName: "wave.3.right")
                                .font(.title3)
                        }
                        .foregroundColor(.white.opacity(0.9))

                        Spacer()

                        Text(viewModel.cardNumber.isEmpty ? "•••• •••• •••• ••••" : formatCardNumber(viewModel.cardNumber))
                            .font(.system(size: 22, weight: .medium, design: .monospaced))
                            .foregroundColor(.white)

                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("EXPIRES")
                                    .font(.system(size: 8, weight: .medium))
                                    .foregroundColor(.white.opacity(0.7))
                                Text(viewModel.expiry.isEmpty ? "MM/YY" : viewModel.expiry)
                                    .font(.system(size: 14, weight: .medium, design: .monospaced))
                                    .foregroundColor(.white)
                            }

                            Spacer()

                            VStack(alignment: .trailing, spacing: 2) {
                                Text("CVV")
                                    .font(.system(size: 8, weight: .medium))
                                    .foregroundColor(.white.opacity(0.7))
                                Text(viewModel.cvv.isEmpty ? "•••" : "•••")
                                    .font(.system(size: 14, weight: .medium, design: .monospaced))
                                    .foregroundColor(.white)
                            }
                        }
                    }
                    .padding(Spacing.lg)
                }
                .padding(.horizontal, Spacing.lg)

                // Card input fields
                VStack(spacing: Spacing.md) {
                    // Card Number
                    VStack(alignment: .leading, spacing: Spacing.xs) {
                        Text("Card Number")
                            .font(.appCaption)
                            .foregroundColor(.softGray)

                        TextField("1234 5678 9012 3456", text: $viewModel.cardNumber)
                            .keyboardType(.numberPad)
                            .textContentType(.creditCardNumber)
                            .padding()
                            .background(Color.cardBackground)
                            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm))
                            .overlay(
                                RoundedRectangle(cornerRadius: CornerRadius.sm)
                                    .stroke(Color.roseGold.opacity(0.3), lineWidth: 1)
                            )
                    }

                    HStack(spacing: Spacing.md) {
                        // Expiry
                        VStack(alignment: .leading, spacing: Spacing.xs) {
                            Text("Expiry")
                                .font(.appCaption)
                                .foregroundColor(.softGray)

                            TextField("MM/YY", text: $viewModel.expiry)
                                .keyboardType(.numberPad)
                                .padding()
                                .background(Color.cardBackground)
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm))
                                .overlay(
                                    RoundedRectangle(cornerRadius: CornerRadius.sm)
                                        .stroke(Color.roseGold.opacity(0.3), lineWidth: 1)
                                )
                        }

                        // CVV
                        VStack(alignment: .leading, spacing: Spacing.xs) {
                            Text("CVV")
                                .font(.appCaption)
                                .foregroundColor(.softGray)

                            SecureField("123", text: $viewModel.cvv)
                                .keyboardType(.numberPad)
                                .padding()
                                .background(Color.cardBackground)
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm))
                                .overlay(
                                    RoundedRectangle(cornerRadius: CornerRadius.sm)
                                        .stroke(Color.roseGold.opacity(0.3), lineWidth: 1)
                                )
                        }

                        // ZIP Code
                        VStack(alignment: .leading, spacing: Spacing.xs) {
                            Text("ZIP")
                                .font(.appCaption)
                                .foregroundColor(.softGray)

                            TextField("12345", text: $viewModel.zipCode)
                                .keyboardType(.numberPad)
                                .textContentType(.postalCode)
                                .padding()
                                .background(Color.cardBackground)
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm))
                                .overlay(
                                    RoundedRectangle(cornerRadius: CornerRadius.sm)
                                        .stroke(Color.roseGold.opacity(0.3), lineWidth: 1)
                                )
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Security note
                HStack(spacing: Spacing.sm) {
                    Image(systemName: "lock.fill")
                        .foregroundColor(.success)
                    Text("Your card is securely processed by Stripe")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
                .padding(.horizontal, Spacing.lg)

                if let error = viewModel.error {
                    Text(error)
                        .font(.appCaption)
                        .foregroundColor(.error)
                        .padding(.horizontal, Spacing.lg)
                }

                Spacer()

                // Add Card Button
                Button {
                    Task {
                        if await viewModel.addCard() {
                            onSuccess()
                            dismiss()
                        }
                    }
                } label: {
                    HStack {
                        if viewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Image(systemName: "plus.circle.fill")
                            Text("Add Card")
                        }
                    }
                    .font(.appHeadline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(viewModel.isValid ? LinearGradient.roseGoldGradient : LinearGradient(colors: [.gray], startPoint: .leading, endPoint: .trailing))
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                }
                .disabled(!viewModel.isValid || viewModel.isLoading)
                .padding(.horizontal, Spacing.lg)
                .padding(.bottom, Spacing.lg)
            }
            .padding(.top, Spacing.lg)
            .background(Color.screenBackground)
            .navigationTitle("Add Payment Method")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func formatCardNumber(_ number: String) -> String {
        let cleaned = number.filter { $0.isNumber }
        var formatted = ""
        for (index, char) in cleaned.prefix(16).enumerated() {
            if index > 0 && index % 4 == 0 {
                formatted += " "
            }
            formatted.append(char)
        }
        return formatted
    }
}

@MainActor
class AddPaymentMethodViewModel: ObservableObject {
    @Published var cardNumber = "" {
        didSet {
            // Auto-format card number with spaces every 4 digits
            let cleaned = cardNumber.filter { $0.isNumber }
            if cleaned.count > 16 {
                cardNumber = oldValue
                return
            }
            var formatted = ""
            for (index, char) in cleaned.enumerated() {
                if index > 0 && index % 4 == 0 {
                    formatted += " "
                }
                formatted.append(char)
            }
            if formatted != cardNumber {
                cardNumber = formatted
            }
        }
    }

    @Published var expiry = "" {
        didSet {
            // Auto-format expiry with /
            let cleaned = expiry.filter { $0.isNumber }
            if cleaned.count > 4 {
                expiry = oldValue
                return
            }
            var formatted = ""
            for (index, char) in cleaned.enumerated() {
                if index == 2 {
                    formatted += "/"
                }
                formatted.append(char)
            }
            if formatted != expiry {
                expiry = formatted
            }
        }
    }

    @Published var cvv = "" {
        didSet {
            let cleaned = cvv.filter { $0.isNumber }
            if cleaned.count > 4 {
                cvv = String(cleaned.prefix(4))
            } else if cleaned != cvv {
                cvv = cleaned
            }
        }
    }

    @Published var zipCode = "" {
        didSet {
            let cleaned = zipCode.filter { $0.isNumber || $0.isLetter }
            if cleaned.count > 10 {
                zipCode = String(cleaned.prefix(10))
            } else if cleaned != zipCode {
                zipCode = cleaned
            }
        }
    }

    @Published var isLoading = false
    @Published var error: String?

    var isValid: Bool {
        let cleanedCardNumber = cardNumber.filter { $0.isNumber }
        let cleanedExpiry = expiry.filter { $0.isNumber }
        return cleanedCardNumber.count >= 15 &&
               cleanedExpiry.count == 4 &&
               cvv.count >= 3 &&
               zipCode.count >= 5
    }

    func addCard() async -> Bool {
        isLoading = true
        error = nil

        do {
            // Parse expiry
            let expiryParts = expiry.filter { $0.isNumber }
            let expMonth = String(expiryParts.prefix(2))
            let expYear = String(expiryParts.suffix(2))

            struct AddCardRequest: Encodable {
                let cardNumber: String
                let expMonth: String
                let expYear: String
                let cvv: String
                let zipCode: String
            }

            struct AddCardResponse: Decodable {
                let success: Bool?
                let paymentMethod: StripePaymentMethod?
                let error: String?
            }

            let cleanedCardNumber = cardNumber.filter { $0.isNumber }
            let request = AddCardRequest(
                cardNumber: cleanedCardNumber,
                expMonth: expMonth,
                expYear: "20" + expYear,
                cvv: cvv,
                zipCode: zipCode
            )

            let response: AddCardResponse = try await APIClient.shared.post("/stripe/payment-methods", body: request)

            if let error = response.error {
                self.error = error
                isLoading = false
                return false
            }

            isLoading = false
            return true
        } catch {
            self.error = "Failed to add card: \(error.localizedDescription)"
            isLoading = false
            return false
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
