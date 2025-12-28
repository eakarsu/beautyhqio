import SwiftUI

struct SubscriptionsView: View {
    @StateObject private var viewModel = SubscriptionsViewModel()
    @State private var selectedSubscription: SubscriptionItem?
    @State private var showingAddSubscription = false

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    AppLoadingView()
                } else if viewModel.subscriptions.isEmpty {
                    EmptySubscriptionsView()
                } else {
                    ScrollView {
                        VStack(spacing: Spacing.lg) {
                            // Summary Section
                            SubscriptionSummaryCard(
                                total: viewModel.subscriptions.count,
                                activeCount: viewModel.subscriptions.filter { $0.status == "ACTIVE" }.count,
                                totalMRR: viewModel.totalMRR
                            )
                            .padding(.horizontal, Spacing.lg)

                            // Subscriptions List
                            VStack(spacing: Spacing.sm) {
                                AppSectionHeader(
                                    title: "All Subscriptions",
                                    subtitle: "\(viewModel.subscriptions.count) total"
                                )

                                ForEach(viewModel.subscriptions) { subscription in
                                    Button {
                                        selectedSubscription = subscription
                                    } label: {
                                        SubscriptionRow(subscription: subscription)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal, Spacing.lg)
                        }
                        .padding(.vertical, Spacing.lg)
                    }
                    .background(Color.screenBackground)
                }
            }
            .navigationTitle("Subscriptions")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddSubscription = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundStyle(LinearGradient.roseGoldGradient)
                    }
                }
            }
            .sheet(isPresented: $showingAddSubscription) {
                AddSubscriptionView {
                    Task { await viewModel.loadSubscriptions() }
                }
            }
            .refreshable {
                await viewModel.loadSubscriptions()
            }
        }
        .task {
            await viewModel.loadSubscriptions()
        }
        .sheet(item: $selectedSubscription) { subscription in
            SubscriptionDetailView(subscription: subscription)
        }
    }
}

struct SubscriptionSummaryCard: View {
    let total: Int
    let activeCount: Int
    let totalMRR: Double

    private var formatter: NumberFormatter {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        return f
    }

    var body: some View {
        HStack(spacing: Spacing.xl) {
            // Total
            VStack(spacing: Spacing.xs) {
                Text("\(total)")
                    .font(.appTitle)
                    .foregroundStyle(LinearGradient.roseGoldGradient)
                Text("Total")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }
            .frame(maxWidth: .infinity)

            // Active
            VStack(spacing: Spacing.xs) {
                Text("\(activeCount)")
                    .font(.appTitle)
                    .foregroundColor(.success)
                Text("Active")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }
            .frame(maxWidth: .infinity)

            // MRR
            VStack(spacing: Spacing.xs) {
                Text(formatter.string(from: NSNumber(value: totalMRR)) ?? "$0")
                    .font(.appTitle)
                    .foregroundStyle(LinearGradient.goldGradient)
                Text("MRR")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }
            .frame(maxWidth: .infinity)
        }
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
        .appShadow(.soft)
    }
}

struct SubscriptionRow: View {
    let subscription: SubscriptionItem

    var body: some View {
        HStack(spacing: Spacing.md) {
            // Avatar
            AppAvatar(name: subscription.businessName, size: 48)

            // Info
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(subscription.businessName)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                HStack(spacing: Spacing.sm) {
                    Text(subscription.plan)
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    if let type = subscription.businessType {
                        Text("•")
                            .foregroundColor(.softGray)
                        Text(type)
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                    }
                }
            }

            Spacer()

            // Price & Status
            VStack(alignment: .trailing, spacing: Spacing.xs) {
                Text("$\(Int(subscription.monthlyPrice))/mo")
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                AppStatusBadge(text: subscription.status.capitalized, status: subscription.status)
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

struct SubscriptionDetailView: View {
    let subscription: SubscriptionItem
    @Environment(\.dismiss) private var dismiss

    private var formatter: NumberFormatter {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        return f
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Header
                    VStack(spacing: Spacing.md) {
                        AppAvatar(name: subscription.businessName, size: 80)

                        Text(subscription.businessName)
                            .font(.appTitle2)
                            .foregroundColor(.charcoal)

                        if let type = subscription.businessType {
                            Text(type)
                                .font(.appSubheadline)
                                .foregroundColor(.softGray)
                        }
                    }
                    .padding(.vertical, Spacing.lg)

                    // Plan Details
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Plan Details")
                            .font(.appTitle3)
                            .foregroundColor(.charcoal)

                        VStack(spacing: Spacing.sm) {
                            AppMetricRow(
                                label: "Plan",
                                value: subscription.plan,
                                icon: "creditcard"
                            )
                            AppDivider()
                            AppMetricRow(
                                label: "Status",
                                value: subscription.status.capitalized,
                                icon: "checkmark.circle",
                                valueColor: Color.statusColor(for: subscription.status)
                            )
                            AppDivider()
                            AppMetricRow(
                                label: "Monthly Price",
                                value: formatter.string(from: NSNumber(value: subscription.monthlyPrice)) ?? "$0",
                                icon: "dollarsign.circle"
                            )
                            if subscription.commissionRate > 0 {
                                AppDivider()
                                AppMetricRow(
                                    label: "Commission Rate",
                                    value: "\(String(format: "%.0f", subscription.commissionRate))%",
                                    icon: "percent"
                                )
                            }
                        }
                        .padding(Spacing.md)
                        .background(Color.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                        .appShadow(.soft)
                    }
                    .padding(.horizontal, Spacing.lg)

                    // Billing
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Billing")
                            .font(.appTitle3)
                            .foregroundColor(.charcoal)

                        VStack(spacing: Spacing.sm) {
                            if let email = subscription.email {
                                AppMetricRow(
                                    label: "Email",
                                    value: email,
                                    icon: "envelope"
                                )
                                AppDivider()
                            }
                            AppMetricRow(
                                label: "Invoices",
                                value: "\(subscription.invoiceCount)",
                                icon: "doc.text"
                            )
                            if let periodEnd = subscription.currentPeriodEnd {
                                AppDivider()
                                HStack {
                                    Image(systemName: "calendar")
                                        .font(.appSubheadline)
                                        .foregroundColor(.roseGold)
                                        .frame(width: 24)
                                    Text("Current Period Ends")
                                        .font(.appSubheadline)
                                        .foregroundColor(.softGray)
                                    Spacer()
                                    Text(periodEnd, style: .date)
                                        .font(.appHeadline)
                                        .foregroundColor(.charcoal)
                                }
                            }
                            if let trialEnds = subscription.trialEndsAt {
                                AppDivider()
                                HStack {
                                    Image(systemName: "clock")
                                        .font(.appSubheadline)
                                        .foregroundColor(.warning)
                                        .frame(width: 24)
                                    Text("Trial Ends")
                                        .font(.appSubheadline)
                                        .foregroundColor(.softGray)
                                    Spacer()
                                    Text(trialEnds, style: .date)
                                        .font(.appHeadline)
                                        .foregroundColor(.warning)
                                }
                            }
                        }
                        .padding(Spacing.md)
                        .background(Color.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                        .appShadow(.soft)
                    }
                    .padding(.horizontal, Spacing.lg)

                    // Cancel Button
                    Button(role: .destructive) {
                        // Cancel subscription
                    } label: {
                        HStack {
                            Image(systemName: "xmark.circle")
                            Text("Cancel Subscription")
                        }
                        .font(.appHeadline)
                        .foregroundColor(.error)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.lg)
                        .background(Color.error.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                    }
                    .padding(.horizontal, Spacing.lg)
                    .padding(.top, Spacing.lg)
                }
                .padding(.bottom, Spacing.xl)
            }
            .background(Color.screenBackground)
            .navigationTitle("Subscription Details")
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

struct EmptySubscriptionsView: View {
    var body: some View {
        AppEmptyState(
            icon: "creditcard",
            title: "No Subscriptions",
            message: "Business subscriptions will appear here"
        )
        .frame(maxHeight: .infinity)
        .background(Color.screenBackground)
    }
}

// MARK: - Models
struct SubscriptionItem: Identifiable, Codable {
    let id: String
    let businessName: String
    let businessType: String?
    let email: String?
    let plan: String
    let status: String
    let monthlyPrice: Double
    let commissionRate: Double
    let trialEndsAt: Date?
    let currentPeriodEnd: Date?
    let invoiceCount: Int

    enum CodingKeys: String, CodingKey {
        case id, businessName, businessType, email, plan, status
        case monthlyPrice, commissionRate, trialEndsAt, currentPeriodEnd, invoiceCount
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        businessName = try container.decode(String.self, forKey: .businessName)
        businessType = try container.decodeIfPresent(String.self, forKey: .businessType)
        email = try container.decodeIfPresent(String.self, forKey: .email)
        plan = try container.decode(String.self, forKey: .plan)
        status = try container.decode(String.self, forKey: .status)
        monthlyPrice = try container.decodeFlexibleDoubleIfPresent(forKey: .monthlyPrice) ?? 0
        commissionRate = try container.decodeFlexibleDoubleIfPresent(forKey: .commissionRate) ?? 0
        trialEndsAt = try container.decodeIfPresent(Date.self, forKey: .trialEndsAt)
        currentPeriodEnd = try container.decodeIfPresent(Date.self, forKey: .currentPeriodEnd)
        invoiceCount = try container.decodeIfPresent(Int.self, forKey: .invoiceCount) ?? 0
    }
}

struct AllSubscriptionsResponse: Codable {
    let total: Int
    let subscriptions: [SubscriptionItem]
}

@MainActor
class SubscriptionsViewModel: ObservableObject {
    @Published var subscriptions: [SubscriptionItem] = []
    @Published var isLoading = false

    var totalMRR: Double {
        subscriptions
            .filter { $0.status == "ACTIVE" }
            .reduce(0) { $0 + $1.monthlyPrice }
    }

    func loadSubscriptions() async {
        isLoading = true
        do {
            let response: AllSubscriptionsResponse = try await APIClient.shared.get("/all-subscriptions")
            subscriptions = response.subscriptions
        } catch {
            print("Failed to load subscriptions: \(error)")
        }
        isLoading = false
    }
}

// MARK: - Add Subscription View
struct AddSubscriptionView: View {
    let onSave: () -> Void
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddSubscriptionViewModel()

    let plans = ["STARTER", "GROWTH", "PRO"]
    let businessTypes = ["SALON", "SPA", "BARBERSHOP", "NAIL_SALON", "MEDICAL_SPA"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Business Information") {
                    TextField("Business Name", text: $viewModel.businessName)
                    TextField("Email", text: $viewModel.email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)

                    Picker("Business Type", selection: $viewModel.businessType) {
                        ForEach(businessTypes, id: \.self) { type in
                            Text(type.replacingOccurrences(of: "_", with: " ").capitalized).tag(type)
                        }
                    }
                }

                Section("Plan") {
                    Picker("Select Plan", selection: $viewModel.selectedPlan) {
                        ForEach(plans, id: \.self) { plan in
                            Text(plan).tag(plan)
                        }
                    }
                    .pickerStyle(.segmented)

                    // Plan details
                    VStack(alignment: .leading, spacing: 4) {
                        switch viewModel.selectedPlan {
                        case "STARTER":
                            Text("Free - 9% commission on marketplace leads")
                        case "GROWTH":
                            Text("$49/mo - No commission")
                        case "PRO":
                            Text("$149/mo - No commission + Premium features")
                        default:
                            EmptyView()
                        }
                    }
                    .font(.caption)
                    .foregroundColor(.secondary)
                }

                if let error = viewModel.error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Add Subscription")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            if await viewModel.save() {
                                onSave()
                                dismiss()
                            }
                        }
                    }
                    .disabled(!viewModel.isValid || viewModel.isSaving)
                }
            }
        }
    }
}

@MainActor
class AddSubscriptionViewModel: ObservableObject {
    @Published var businessName = ""
    @Published var email = ""
    @Published var businessType = "SALON"
    @Published var selectedPlan = "STARTER"
    @Published var isSaving = false
    @Published var error: String?

    var isValid: Bool {
        !businessName.isEmpty && !email.isEmpty
    }

    func save() async -> Bool {
        isSaving = true
        error = nil

        do {
            struct CreateSubscriptionRequest: Encodable {
                let businessName: String
                let email: String
                let businessType: String
                let plan: String
            }

            let request = CreateSubscriptionRequest(
                businessName: businessName,
                email: email,
                businessType: businessType,
                plan: selectedPlan
            )

            struct SubscriptionResponse: Decodable {
                let subscription: SubscriptionItem
            }

            let _: SubscriptionResponse = try await APIClient.shared.post("/all-subscriptions", body: request)
            isSaving = false
            return true
        } catch {
            self.error = error.localizedDescription
            isSaving = false
            return false
        }
    }
}

#Preview {
    SubscriptionsView()
}
