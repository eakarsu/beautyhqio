import SwiftUI

struct POSView: View {
    @StateObject private var viewModel = POSViewModel()
    @State private var showingNewSale = false
    @State private var selectedTransaction: Transaction?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Summary Cards
                    summarySection
                        .padding(.horizontal, Spacing.lg)

                    // Quick Actions
                    quickActionsSection
                        .padding(.horizontal, Spacing.lg)

                    // Recent Transactions
                    transactionsSection
                        .padding(.horizontal, Spacing.lg)
                }
                .padding(.vertical, Spacing.lg)
            }
            .background(Color.screenBackground)
            .navigationTitle("POS")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingNewSale = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundStyle(LinearGradient.roseGoldGradient)
                    }
                }
            }
            .refreshable {
                await viewModel.loadData()
            }
        }
        .task {
            await viewModel.loadData()
        }
        .sheet(isPresented: $showingNewSale) {
            NewSaleView()
        }
        .sheet(item: $selectedTransaction) { transaction in
            TransactionDetailView(transaction: transaction)
        }
    }

    private var summarySection: some View {
        VStack(spacing: Spacing.md) {
            HStack(spacing: Spacing.md) {
                POSSummaryCard(
                    title: "Total Sales",
                    value: formatCurrency(viewModel.summary?.totalSales ?? 0),
                    gradient: .successGradient
                )
                POSSummaryCard(
                    title: "Refunds",
                    value: formatCurrency(viewModel.summary?.totalRefunds ?? 0),
                    gradient: .deepRoseGradient
                )
            }

            // Net Revenue Card
            HStack {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text("Net Revenue")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    Text(formatCurrency(viewModel.summary?.netRevenue ?? 0))
                        .font(.appTitle)
                        .foregroundStyle(LinearGradient.successGradient)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: Spacing.xs) {
                    Text("\(viewModel.summary?.transactionCount ?? 0)")
                        .font(.appTitle2)
                        .foregroundStyle(LinearGradient.roseGoldGradient)
                    Text("Transactions")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
            }
            .padding(Spacing.lg)
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
            .appShadow(.soft)
        }
    }

    private var quickActionsSection: some View {
        HStack(spacing: Spacing.md) {
            Button {
                showingNewSale = true
            } label: {
                HStack {
                    Image(systemName: "cart.fill")
                    Text("New Sale")
                        .font(.appHeadline)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(LinearGradient.roseGoldGradient)
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                .shadow(color: .roseGold.opacity(0.3), radius: 6, x: 0, y: 3)
            }

            Button {
                Task { await viewModel.loadData() }
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.title3)
                    .frame(width: 50, height: 50)
                    .background(Color.roseGold.opacity(0.15))
                    .foregroundColor(.roseGold)
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
            }

            Button {
                // View receipts
            } label: {
                Image(systemName: "doc.text")
                    .font(.title3)
                    .frame(width: 50, height: 50)
                    .background(Color.roseGold.opacity(0.15))
                    .foregroundColor(.roseGold)
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
            }
        }
    }

    private var transactionsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Recent Transactions")
                .font(.appTitle3)
                .foregroundColor(.charcoal)

            if viewModel.transactions.isEmpty {
                AppEmptyState(
                    icon: "doc.text",
                    title: "No Transactions",
                    message: "Start ringing up sales to see them here."
                )
                .cardStyle()
            } else {
                VStack(spacing: Spacing.sm) {
                    ForEach(viewModel.transactions) { transaction in
                        Button {
                            selectedTransaction = transaction
                        } label: {
                            TransactionRowView(transaction: transaction)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }
}

// MARK: - POS Summary Card
struct POSSummaryCard: View {
    let title: String
    let value: String
    let gradient: LinearGradient

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(title)
                .font(.appCaption)
                .foregroundColor(.softGray)
            Text(value)
                .font(.appTitle2)
                .foregroundStyle(gradient)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
        .appShadow(.soft)
    }
}

// MARK: - Transaction Row
struct TransactionRowView: View {
    let transaction: Transaction

    private var transactionType: TransactionType { transaction.type ?? .sale }
    private var itemCount: Int { transaction.lineItems?.count ?? 0 }

    var body: some View {
        HStack(spacing: Spacing.md) {
            Image(systemName: transactionType.icon)
                .font(.title3)
                .foregroundColor(transactionType.color)
                .frame(width: 44, height: 44)
                .background(transactionType.color.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous))

            VStack(alignment: .leading, spacing: Spacing.xs) {
                HStack {
                    Text(transactionType.displayName)
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)
                    Spacer()
                    Text(transaction.formattedTotal)
                        .font(.appHeadline)
                        .foregroundColor(transactionType == .refund ? .error : .charcoal)
                }

                HStack {
                    if let createdAt = transaction.createdAt {
                        Text(createdAt, style: .time)
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                        Text("•")
                            .foregroundColor(.softGray)
                    }
                    Text(transaction.paymentMethodDisplay)
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    Spacer()
                    Text("\(itemCount) item\(itemCount != 1 ? "s" : "")")
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .padding(.horizontal, Spacing.sm)
                        .padding(.vertical, 2)
                        .background(Color.roseGold.opacity(0.15))
                        .clipShape(Capsule())
                }
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.softGray)
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .appShadow(.soft)
    }
}

// MARK: - New Sale View
struct NewSaleView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = NewSaleViewModel()
    @State private var selectedTab = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab Selector
                HStack(spacing: 0) {
                    Button {
                        selectedTab = 0
                    } label: {
                        Text("Services")
                            .font(.appHeadline)
                            .foregroundColor(selectedTab == 0 ? .white : .charcoal)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, Spacing.md)
                            .background(selectedTab == 0 ? LinearGradient.roseGoldGradient : LinearGradient(colors: [.clear], startPoint: .top, endPoint: .bottom))
                    }

                    Button {
                        selectedTab = 1
                    } label: {
                        Text("Products")
                            .font(.appHeadline)
                            .foregroundColor(selectedTab == 1 ? .white : .charcoal)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, Spacing.md)
                            .background(selectedTab == 1 ? LinearGradient.roseGoldGradient : LinearGradient(colors: [.clear], startPoint: .top, endPoint: .bottom))
                    }
                }
                .background(Color.blushPink.opacity(0.3))

                // Content
                ScrollView {
                    VStack(spacing: Spacing.md) {
                        if selectedTab == 0 {
                            // Services
                            ForEach(viewModel.services) { service in
                                Button {
                                    viewModel.addToCart(service: service)
                                } label: {
                                    ItemRow(name: service.name, price: service.price, duration: service.duration)
                                }
                                .buttonStyle(.plain)
                            }
                        } else {
                            // Products
                            ForEach(viewModel.products) { product in
                                Button {
                                    viewModel.addToCart(product: product)
                                } label: {
                                    ItemRow(name: product.name, price: product.price, duration: nil)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(Spacing.lg)
                }

                // Cart Summary
                if !viewModel.cartItems.isEmpty {
                    VStack(spacing: Spacing.md) {
                        Divider()

                        // Cart Items
                        ForEach(viewModel.cartItems) { item in
                            HStack {
                                Text(item.name)
                                    .font(.appSubheadline)
                                    .foregroundColor(.charcoal)
                                Spacer()
                                Text("x\(item.quantity)")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                                Text(formatCurrency(item.totalPrice))
                                    .font(.appHeadline)
                                    .foregroundColor(.charcoal)
                                Button {
                                    viewModel.removeFromCart(item: item)
                                } label: {
                                    Image(systemName: "minus.circle.fill")
                                        .foregroundColor(.error)
                                }
                            }
                        }

                        Divider()

                        // Totals
                        HStack {
                            Text("Subtotal")
                                .font(.appSubheadline)
                                .foregroundColor(.softGray)
                            Spacer()
                            Text(formatCurrency(viewModel.subtotal))
                                .font(.appHeadline)
                                .foregroundColor(.charcoal)
                        }

                        HStack {
                            Text("Tax (8.75%)")
                                .font(.appSubheadline)
                                .foregroundColor(.softGray)
                            Spacer()
                            Text(formatCurrency(viewModel.tax))
                                .font(.appHeadline)
                                .foregroundColor(.charcoal)
                        }

                        HStack {
                            Text("Total")
                                .font(.appTitle3)
                                .foregroundColor(.charcoal)
                            Spacer()
                            Text(formatCurrency(viewModel.total))
                                .font(.appTitle2)
                                .foregroundStyle(LinearGradient.roseGoldGradient)
                        }

                        // Checkout Button
                        Button {
                            Task {
                                await viewModel.checkout()
                                dismiss()
                            }
                        } label: {
                            HStack {
                                Image(systemName: "creditcard.fill")
                                Text("Charge \(formatCurrency(viewModel.total))")
                            }
                        }
                        .buttonStyle(.primary)
                        .disabled(viewModel.isProcessing)
                    }
                    .padding(Spacing.lg)
                    .background(Color.cardBackground)
                }
            }
            .background(Color.screenBackground)
            .navigationTitle("New Sale")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.roseGold)
                }
            }
        }
        .task {
            await viewModel.loadItems()
        }
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }
}

struct ItemRow: View {
    let name: String
    let price: Double
    let duration: Int?

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(name)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                if let duration = duration {
                    Text("\(duration) min")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
            }

            Spacer()

            Text(formatCurrency(price))
                .font(.appHeadline)
                .foregroundColor(.roseGold)

            Image(systemName: "plus.circle.fill")
                .foregroundColor(.roseGold)
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .appShadow(.soft)
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }
}

// MARK: - Transaction Detail View
struct TransactionDetailView: View {
    let transaction: Transaction
    @Environment(\.dismiss) private var dismiss

    private func formatPrice(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Text("Type")
                        Spacer()
                        Text(transaction.type?.displayName ?? "Sale")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Total")
                        Spacer()
                        Text(transaction.formattedTotal)
                            .fontWeight(.bold)
                    }
                    HStack {
                        Text("Payment Method")
                        Spacer()
                        Text(transaction.paymentMethodDisplay)
                            .foregroundColor(.secondary)
                    }
                    if let date = transaction.createdAt {
                        HStack {
                            Text("Date")
                            Spacer()
                            Text(date, style: .date)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                if let items = transaction.lineItems, !items.isEmpty {
                    Section("Items") {
                        ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                            HStack {
                                Text(item.name)
                                Spacer()
                                if item.quantity > 1 {
                                    Text("x\(item.quantity)")
                                        .foregroundColor(.secondary)
                                }
                                Text(formatPrice(item.totalPrice))
                            }
                        }
                    }
                }
            }
            .navigationTitle("Transaction Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(.roseGold)
                }
            }
        }
    }
}

// MARK: - Cart Item
struct CartItem: Identifiable {
    let id: String
    let name: String
    let price: Double
    var quantity: Int
    let type: CartItemType

    var totalPrice: Double {
        price * Double(quantity)
    }

    enum CartItemType {
        case service
        case product
    }
}

// MARK: - New Sale ViewModel
@MainActor
class NewSaleViewModel: ObservableObject {
    @Published var services: [Service] = []
    @Published var products: [Product] = []
    @Published var cartItems: [CartItem] = []
    @Published var isProcessing = false

    let taxRate = 0.0875

    var subtotal: Double {
        cartItems.reduce(0) { $0 + $1.totalPrice }
    }

    var tax: Double {
        subtotal * taxRate
    }

    var total: Double {
        subtotal + tax
    }

    func loadItems() async {
        do {
            async let servicesRequest: [Service] = APIClient.shared.get("/services")
            async let productsRequest: [Product] = APIClient.shared.get("/products")

            services = try await servicesRequest
            products = try await productsRequest
        } catch {
            print("Failed to load items: \(error)")
        }
    }

    func addToCart(service: Service) {
        if let index = cartItems.firstIndex(where: { $0.id == service.id }) {
            cartItems[index].quantity += 1
        } else {
            let item = CartItem(
                id: service.id,
                name: service.name,
                price: service.price,
                quantity: 1,
                type: .service
            )
            cartItems.append(item)
        }
    }

    func addToCart(product: Product) {
        if let index = cartItems.firstIndex(where: { $0.id == product.id }) {
            cartItems[index].quantity += 1
        } else {
            let item = CartItem(
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                type: .product
            )
            cartItems.append(item)
        }
    }

    func removeFromCart(item: CartItem) {
        if let index = cartItems.firstIndex(where: { $0.id == item.id }) {
            if cartItems[index].quantity > 1 {
                cartItems[index].quantity -= 1
            } else {
                cartItems.remove(at: index)
            }
        }
    }

    func checkout() async {
        isProcessing = true
        // TODO: Implement actual checkout via API
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        isProcessing = false
    }
}

#Preview {
    POSView()
}
