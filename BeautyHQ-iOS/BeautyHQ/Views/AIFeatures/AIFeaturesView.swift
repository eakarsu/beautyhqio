import SwiftUI

// MARK: - AI Feature Definition
struct AIFeature: Identifiable {
    let id = UUID()
    let name: String
    let description: String
    let icon: String
    let gradient: LinearGradient
    let isNew: Bool
    let endpoint: String
}

let aiFeatures: [AIFeature] = [
    AIFeature(name: "AI Chat Assistant", description: "Ask anything about your salon - scheduling, analytics, marketing strategies", icon: "bubble.left.and.bubble.right.fill", gradient: .roseGoldGradient, isNew: true, endpoint: "chat"),
    AIFeature(name: "Smart Scheduling", description: "AI-powered appointment optimization and staff matching", icon: "calendar.badge.clock", gradient: .deepRoseGradient, isNew: true, endpoint: "smart-scheduling"),
    AIFeature(name: "Client Insights", description: "Deep analysis of client behavior, preferences, and retention strategies", icon: "person.crop.circle.badge.checkmark", gradient: .goldGradient, isNew: true, endpoint: "client-insights"),
    AIFeature(name: "Revenue Predictor", description: "AI-powered revenue forecasting and growth opportunities", icon: "chart.line.uptrend.xyaxis.circle.fill", gradient: .successGradient, isNew: true, endpoint: "revenue-predictor"),
    AIFeature(name: "No-Show Prediction", description: "Predict appointment no-shows and get prevention recommendations", icon: "exclamationmark.triangle.fill", gradient: .deepRoseGradient, isNew: false, endpoint: "no-show-prediction"),
    AIFeature(name: "Style Recommendations", description: "AI-powered personalized style and service recommendations", icon: "sparkles.rectangle.stack.fill", gradient: .roseGoldGradient, isNew: false, endpoint: "style-recommendation"),
    AIFeature(name: "Voice Receptionist", description: "AI-powered voice assistant for handling calls", icon: "phone.badge.waveform.fill", gradient: .goldGradient, isNew: false, endpoint: "voice-receptionist"),
    AIFeature(name: "Social Media Content", description: "Generate engaging posts for Instagram, Facebook & more", icon: "camera.fill", gradient: .deepRoseGradient, isNew: true, endpoint: "social-media"),
    AIFeature(name: "Upsell Suggestions", description: "AI-powered personalized upsell and cross-sell recommendations", icon: "arrow.up.circle.fill", gradient: .roseGoldGradient, isNew: true, endpoint: "upsell-suggestions"),
    AIFeature(name: "Inventory Forecast", description: "Predict product demand and optimize stock levels", icon: "cube.box.fill", gradient: .successGradient, isNew: true, endpoint: "inventory-forecast"),
    AIFeature(name: "Client Reactivation", description: "Generate win-back campaigns for inactive clients", icon: "person.crop.circle.badge.plus", gradient: .goldGradient, isNew: true, endpoint: "reactivation-campaigns"),
    AIFeature(name: "Price Optimizer", description: "AI-powered pricing recommendations for services", icon: "dollarsign.circle.fill", gradient: .roseGoldGradient, isNew: true, endpoint: "price-optimizer"),
    AIFeature(name: "Sentiment Analysis", description: "Analyze customer reviews and feedback sentiment", icon: "face.smiling.fill", gradient: .deepRoseGradient, isNew: true, endpoint: "review-response"),
    AIFeature(name: "Message Generator", description: "Generate professional messages for clients", icon: "envelope.fill", gradient: .goldGradient, isNew: false, endpoint: "message-generator"),
    AIFeature(name: "Translate", description: "Translate messages to any language", icon: "globe", gradient: .successGradient, isNew: false, endpoint: "translate"),
    AIFeature(name: "Business Insights", description: "AI analysis of your business performance", icon: "chart.bar.fill", gradient: .roseGoldGradient, isNew: false, endpoint: "business-insights"),
]

struct AIFeaturesView: View {
    @State private var selectedFeature: AIFeature?

    let columns = [
        GridItem(.flexible(), spacing: Spacing.md),
        GridItem(.flexible(), spacing: Spacing.md)
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    // Header
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text("AI-Powered Features")
                            .font(.appTitle2)
                            .foregroundColor(.charcoal)

                        Text("Choose an AI assistant to help with your salon operations")
                            .font(.appSubheadline)
                            .foregroundColor(.softGray)
                    }
                    .padding(.horizontal, Spacing.lg)

                    // Features Grid
                    LazyVGrid(columns: columns, spacing: Spacing.md) {
                        ForEach(aiFeatures) { feature in
                            AIFeatureCard(feature: feature) {
                                selectedFeature = feature
                            }
                        }
                    }
                    .padding(.horizontal, Spacing.lg)
                }
                .padding(.vertical, Spacing.lg)
            }
            .background(Color.screenBackground)
            .navigationTitle("AI Features")
            .sheet(item: $selectedFeature) { feature in
                AIFeatureDetailView(feature: feature)
            }
        }
    }
}

// MARK: - Feature Card
struct AIFeatureCard: View {
    let feature: AIFeature
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                HStack {
                    // Icon
                    ZStack {
                        RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous)
                            .fill(feature.gradient.opacity(0.2))
                            .frame(width: 44, height: 44)

                        Image(systemName: feature.icon)
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(feature.gradient)
                    }

                    Spacer()

                    if feature.isNew {
                        Text("New")
                            .font(.appCaption2)
                            .foregroundColor(.white)
                            .padding(.horizontal, Spacing.sm)
                            .padding(.vertical, 2)
                            .background(LinearGradient.roseGoldGradient)
                            .clipShape(Capsule())
                    }
                }

                Text(feature.name)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)

                Text(feature.description)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
                    .lineLimit(3)
                    .multilineTextAlignment(.leading)

                Spacer(minLength: 0)

                // Open Button
                HStack {
                    Spacer()
                    Text("Open")
                        .font(.appCaption)
                        .foregroundStyle(feature.gradient)
                    Image(systemName: "arrow.right")
                        .font(.caption)
                        .foregroundStyle(feature.gradient)
                }
            }
            .padding(Spacing.md)
            .frame(minHeight: 180)
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
            .appShadow(.soft)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Feature Detail View
struct AIFeatureDetailView: View {
    let feature: AIFeature
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                switch feature.endpoint {
                case "chat":
                    AIChatView()
                case "smart-scheduling":
                    AISmartSchedulingView()
                case "client-insights":
                    AIClientInsightsView()
                case "revenue-predictor":
                    AIRevenuePredictorView()
                case "no-show-prediction":
                    AINoShowPredictionView()
                case "style-recommendation":
                    AIStyleRecommendationView()
                case "voice-receptionist":
                    AIVoiceReceptionistView()
                case "social-media":
                    AISocialMediaView()
                case "upsell-suggestions":
                    AIUpsellSuggestionsView()
                case "inventory-forecast":
                    AIInventoryForecastView()
                case "reactivation-campaigns":
                    AIReactivationView()
                case "price-optimizer":
                    AIPriceOptimizerView()
                case "review-response":
                    AIReviewResponseView()
                case "message-generator":
                    AIMessageGeneratorView()
                case "translate":
                    AITranslateView()
                case "business-insights":
                    AIBusinessInsightsView()
                default:
                    AIGenericFeatureView(feature: feature)
                }
            }
            .navigationTitle(feature.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.roseGold)
                }
            }
        }
    }
}

// MARK: - AI Chat View
struct AIChatView: View {
    @StateObject private var viewModel = AIChatViewModel()

    // Quick prompts that send directly (matching JavaScript quickPrompts)
    let quickPrompts = [
        ("calendar", "Optimize Schedule", "Analyze my salon's appointment schedule for today and suggest optimizations to maximize efficiency."),
        ("dollarsign.circle", "Revenue Ideas", "What are some strategies to increase revenue this month based on typical salon metrics?"),
        ("person.2", "Client Retention", "How can I improve client retention and reduce no-shows at my salon?"),
        ("chart.line.uptrend.xyaxis", "Growth Tips", "What marketing strategies work best for growing a beauty and wellness business?"),
    ]

    var body: some View {
        VStack(spacing: 0) {
            // Quick Prompts (only show when no messages yet)
            if viewModel.messages.isEmpty {
                VStack(spacing: Spacing.md) {
                    // Welcome message
                    VStack(spacing: Spacing.sm) {
                        Image(systemName: "sparkles")
                            .font(.largeTitle)
                            .foregroundStyle(LinearGradient.roseGoldGradient)
                        Text("AI Salon Assistant")
                            .font(.appTitle)
                            .foregroundColor(.charcoal)
                        Text("Ask anything about scheduling, clients, marketing, or analytics")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, Spacing.xl)

                    Text("Quick prompts")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                        .padding(.top, Spacing.lg)

                    // 2x2 grid of quick prompts
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: Spacing.sm) {
                        ForEach(quickPrompts, id: \.1) { icon, label, prompt in
                            Button {
                                // Send message directly (not just fill input)
                                viewModel.inputText = prompt
                                Task { await viewModel.sendMessage() }
                            } label: {
                                HStack(spacing: Spacing.sm) {
                                    Image(systemName: icon)
                                        .font(.caption)
                                        .foregroundColor(.roseGold)
                                    Text(label)
                                        .font(.appCaption)
                                        .foregroundColor(.charcoal)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(Spacing.md)
                                .background(Color.cardBackground)
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                                .overlay(
                                    RoundedRectangle(cornerRadius: CornerRadius.md)
                                        .stroke(Color.blushPink, lineWidth: 1)
                                )
                            }
                        }
                    }
                    .padding(.horizontal, Spacing.lg)
                }
                .padding(.bottom, Spacing.lg)
            }

            ScrollView {
                VStack(spacing: Spacing.md) {
                    ForEach(viewModel.messages) { message in
                        ChatBubble(message: message)
                    }

                    if viewModel.isLoading {
                        HStack {
                            HStack(spacing: Spacing.sm) {
                                ProgressView()
                                    .scaleEffect(0.8)
                                Text("Thinking...")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                            }
                            .padding(Spacing.md)
                            .background(Color.blushPink.opacity(0.2))
                            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg))
                            Spacer()
                        }
                    }
                }
                .padding(Spacing.lg)
            }

            // Input Area
            HStack(spacing: Spacing.md) {
                TextField("Ask about scheduling, clients, marketing...", text: $viewModel.inputText)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit {
                        if !viewModel.inputText.isEmpty && !viewModel.isLoading {
                            Task { await viewModel.sendMessage() }
                        }
                    }

                Button {
                    Task { await viewModel.sendMessage() }
                } label: {
                    Image(systemName: viewModel.isLoading ? "ellipsis" : "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundStyle(LinearGradient.roseGoldGradient)
                }
                .disabled(viewModel.inputText.isEmpty || viewModel.isLoading)
            }
            .padding(Spacing.md)
            .background(Color.cardBackground)
        }
    }
}

struct ChatBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack {
            if message.isUser { Spacer() }

            Text(message.content)
                .font(.appBody)
                .foregroundColor(message.isUser ? .white : .charcoal)
                .padding(Spacing.md)
                .background(message.isUser ? LinearGradient.roseGoldGradient : LinearGradient(colors: [Color.cardBackground], startPoint: .top, endPoint: .bottom))
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)

            if !message.isUser { Spacer() }
        }
    }
}

// MARK: - Smart Scheduling View
struct AISmartSchedulingView: View {
    @StateObject private var viewModel = AISmartSchedulingViewModel()

    let services = [
        ("haircut", "Haircut", "45 min"),
        ("color", "Hair Color", "120 min"),
        ("balayage", "Balayage", "180 min"),
        ("blowout", "Blowout", "30 min"),
        ("manicure", "Manicure", "30 min"),
        ("pedicure", "Pedicure", "45 min"),
        ("facial", "Facial", "60 min"),
        ("massage", "Massage", "60 min"),
    ]

    let staffOptions = [
        ("any", "Any Available"),
        ("sarah", "Sarah J. - Color & Styling"),
        ("ashley", "Ashley W. - Cuts & Blowouts"),
        ("michelle", "Michelle T. - Nails"),
        ("david", "David C. - Men's Grooming"),
        ("emma", "Emma D. - Skincare & Spa"),
    ]

    let timeOptions = [
        ("flexible", "Flexible"),
        ("morning", "Morning (9AM - 12PM)"),
        ("afternoon", "Afternoon (12PM - 5PM)"),
        ("evening", "Evening (5PM - 8PM)"),
        ("weekend", "Weekend Only"),
    ]

    // Sample data for Load Example
    let sampleData = [
        (["haircut", "color"], "sarah", "morning", "Need to finish before noon"),
        (["balayage"], "ashley", "afternoon", "First time balayage client"),
        (["manicure", "pedicure"], "michelle", "flexible", ""),
        (["facial", "massage"], "emma", "evening", "VIP client, prefer quiet room"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Load Example button
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleData.randomElement()!
                        viewModel.selectedServices = sample.0
                        viewModel.preferredStaff = sample.1
                        viewModel.preferredTime = sample.2
                        viewModel.constraints = sample.3
                    } label: {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.blushPink.opacity(0.3))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, Spacing.lg)

                AIFeatureHeader(
                    icon: "calendar.badge.clock",
                    title: "Smart Scheduling",
                    description: "AI-powered appointment optimization"
                )

                // Services Selection
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Services Needed *")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: Spacing.sm) {
                        ForEach(services, id: \.0) { id, name, duration in
                            Button {
                                if viewModel.selectedServices.contains(id) {
                                    viewModel.selectedServices.removeAll { $0 == id }
                                } else {
                                    viewModel.selectedServices.append(id)
                                }
                            } label: {
                                HStack {
                                    Image(systemName: viewModel.selectedServices.contains(id) ? "checkmark.square.fill" : "square")
                                        .foregroundColor(viewModel.selectedServices.contains(id) ? .roseGold : .softGray)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(name)
                                            .font(.appSubheadline)
                                            .foregroundColor(.charcoal)
                                        Text(duration)
                                            .font(.appCaption)
                                            .foregroundColor(.softGray)
                                    }
                                    Spacer()
                                }
                                .padding(Spacing.sm)
                                .background(viewModel.selectedServices.contains(id) ? Color.blushPink.opacity(0.3) : Color.cardBackground)
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm))
                                .overlay(
                                    RoundedRectangle(cornerRadius: CornerRadius.sm)
                                        .stroke(viewModel.selectedServices.contains(id) ? Color.roseGold : Color.blushPink.opacity(0.5), lineWidth: 1)
                                )
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Preferred Staff
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Preferred Staff (Optional)")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(staffOptions, id: \.0) { id, name in
                                AppFilterChip(label: name, isSelected: viewModel.preferredStaff == id) {
                                    viewModel.preferredStaff = id
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Preferred Time
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Preferred Time (Optional)")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(timeOptions, id: \.0) { id, name in
                                AppFilterChip(label: name, isSelected: viewModel.preferredTime == id) {
                                    viewModel.preferredTime = id
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Special Requirements
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Special Requirements (Optional)")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    TextField("e.g., Need to be done by 3 PM...", text: $viewModel.constraints)
                        .textFieldStyle(.roundedBorder)
                }
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.optimize() }
                } label: {
                    AIActionButton(text: "Find Optimal Appointments", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.selectedServices.isEmpty)
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "Recommended Appointments", content: result.suggestions.joined(separator: "\n\n"))
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Client Insights View
struct AIClientInsightsView: View {
    @StateObject private var viewModel = AIClientInsightsViewModel()
    @State private var showingClientPicker = false

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "person.crop.circle.badge.checkmark",
                    title: "Client Insights",
                    description: "AI-powered client analysis & recommendations"
                )

                // Client Selector
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Select Client")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    Button {
                        showingClientPicker = true
                    } label: {
                        HStack {
                            if let client = viewModel.selectedClient {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("\(client.firstName) \(client.lastName)")
                                        .font(.appBody)
                                        .foregroundColor(.charcoal)
                                    if let email = client.email {
                                        Text(email)
                                            .font(.appCaption)
                                            .foregroundColor(.softGray)
                                    }
                                }
                            } else {
                                Text("Tap to select a client")
                                    .font(.appBody)
                                    .foregroundColor(.softGray)
                            }
                            Spacer()
                            Image(systemName: "chevron.down")
                                .foregroundColor(.roseGold)
                        }
                        .padding(Spacing.md)
                        .background(Color.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                        .overlay(
                            RoundedRectangle(cornerRadius: CornerRadius.md)
                                .stroke(Color.blushPink, lineWidth: 1)
                        )
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Loading indicator for clients
                if viewModel.isLoadingClients {
                    HStack {
                        ProgressView()
                            .tint(.roseGold)
                        Text("Loading clients...")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                    }
                    .padding(Spacing.md)
                }

                // Client count info
                if !viewModel.clients.isEmpty {
                    Text("\(viewModel.clients.count) clients available")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                        .padding(.horizontal, Spacing.lg)
                }

                // What it analyzes
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("AI will analyze:")
                        .font(.appSubheadline)
                        .foregroundColor(.charcoal)

                    VStack(alignment: .leading, spacing: Spacing.xs) {
                        Label("Client retention patterns", systemImage: "arrow.triangle.2.circlepath")
                        Label("Service preferences", systemImage: "heart.fill")
                        Label("Spending behavior", systemImage: "dollarsign.circle.fill")
                        Label("Visit frequency", systemImage: "calendar")
                    }
                    .font(.appCaption)
                    .foregroundColor(.softGray)
                }
                .padding(Spacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.blushPink.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.analyze() }
                } label: {
                    AIActionButton(text: "Analyze Client", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.selectedClient == nil)
                .opacity(viewModel.selectedClient == nil ? 0.6 : 1)
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "Client Analysis", content: result.insights.joined(separator: "\n"))
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
        .task {
            await viewModel.fetchClients()
        }
        .sheet(isPresented: $showingClientPicker) {
            ClientPickerSheet(viewModel: viewModel, isPresented: $showingClientPicker)
        }
    }
}

// Client Picker Sheet
struct ClientPickerSheet: View {
    @ObservedObject var viewModel: AIClientInsightsViewModel
    @Binding var isPresented: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.softGray)
                    TextField("Search clients...", text: $viewModel.searchText)
                        .font(.appBody)
                }
                .padding(Spacing.md)
                .background(Color.blushPink.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                .padding(.horizontal, Spacing.lg)
                .padding(.vertical, Spacing.md)

                if viewModel.filteredClients.isEmpty {
                    VStack(spacing: Spacing.md) {
                        Image(systemName: "person.crop.circle.badge.questionmark")
                            .font(.system(size: 50))
                            .foregroundColor(.softGray)
                        Text(viewModel.clients.isEmpty ? "No clients found" : "No matching clients")
                            .font(.appBody)
                            .foregroundColor(.softGray)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(Spacing.xl)
                } else {
                    List(viewModel.filteredClients) { client in
                        Button {
                            viewModel.selectedClient = client
                            isPresented = false
                        } label: {
                            HStack {
                                // Avatar
                                ZStack {
                                    Circle()
                                        .fill(LinearGradient.roseGoldGradient.opacity(0.3))
                                        .frame(width: 44, height: 44)
                                    Text(String(client.firstName.prefix(1) + client.lastName.prefix(1)))
                                        .font(.appHeadline)
                                        .foregroundColor(.roseGold)
                                }

                                VStack(alignment: .leading, spacing: 2) {
                                    Text("\(client.firstName) \(client.lastName)")
                                        .font(.appBody)
                                        .foregroundColor(.charcoal)
                                    if let email = client.email {
                                        Text(email)
                                            .font(.appCaption)
                                            .foregroundColor(.softGray)
                                    }
                                    if !client.phone.isEmpty {
                                        Text(client.phone)
                                            .font(.appCaption)
                                            .foregroundColor(.softGray)
                                    }
                                }

                                Spacer()

                                if viewModel.selectedClient?.id == client.id {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.roseGold)
                                }
                            }
                            .padding(.vertical, Spacing.xs)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Select Client")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        isPresented = false
                    }
                    .foregroundColor(.roseGold)
                }
            }
        }
    }
}

// MARK: - Revenue Predictor View
struct AIRevenuePredictorView: View {
    @StateObject private var viewModel = AIRevenuePredictorViewModel()

    let timeframeOptions = [
        ("next_week", "Next Week"),
        ("next_month", "Next Month"),
        ("next_quarter", "Next Quarter"),
        ("next_year", "Next Year"),
    ]

    // Sample data for Load Example
    let sampleData = [
        ("next_month", true),
        ("next_quarter", true),
        ("next_week", false),
        ("next_year", true),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Load Example button
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleData.randomElement()!
                        viewModel.timeframe = sample.0
                        viewModel.includeSeasonality = sample.1
                    } label: {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.blushPink.opacity(0.3))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, Spacing.lg)

                AIFeatureHeader(
                    icon: "chart.line.uptrend.xyaxis.circle.fill",
                    title: "Revenue Predictor",
                    description: "AI-powered revenue forecasting"
                )

                // Forecast Period Selection
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Forecast Period")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(timeframeOptions, id: \.0) { value, label in
                                AppFilterChip(label: label, isSelected: viewModel.timeframe == value) {
                                    viewModel.timeframe = value
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Seasonality Toggle
                HStack {
                    Toggle(isOn: $viewModel.includeSeasonality) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Include Seasonal Factors")
                                .font(.appSubheadline)
                                .foregroundColor(.charcoal)
                            Text("Adjust predictions for holidays, seasons")
                                .font(.appCaption)
                                .foregroundColor(.softGray)
                        }
                    }
                    .tint(.roseGold)
                }
                .padding(.horizontal, Spacing.lg)

                // Info card
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("AI will analyze:")
                        .font(.appSubheadline)
                        .foregroundColor(.charcoal)

                    VStack(alignment: .leading, spacing: Spacing.xs) {
                        Label("Historical revenue patterns", systemImage: "chart.xyaxis.line")
                        Label("Seasonal trends", systemImage: "calendar")
                        Label("Booking trends", systemImage: "arrow.up.right")
                        Label("Growth opportunities", systemImage: "lightbulb.fill")
                    }
                    .font(.appCaption)
                    .foregroundColor(.softGray)
                }
                .padding(Spacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.blushPink.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.predict() }
                } label: {
                    AIActionButton(text: "Generate Forecast", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    VStack(spacing: Spacing.md) {
                        // Prediction Card
                        VStack(spacing: Spacing.sm) {
                            Text("Predicted Revenue")
                                .font(.appHeadline)
                                .foregroundColor(.charcoal)
                            Text(result.predictedRevenue)
                                .font(.system(size: 36, weight: .bold, design: .rounded))
                                .foregroundStyle(LinearGradient.roseGoldGradient)
                            Text(result.period)
                                .font(.appCaption)
                                .foregroundColor(.softGray)
                        }
                        .padding(Spacing.lg)
                        .frame(maxWidth: .infinity)
                        .background(Color.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
                        .appShadow(.soft)

                        AIResultCard(title: "Growth Opportunities", content: result.opportunities.joined(separator: "\n\n"))
                    }
                    .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - No-Show Prediction View
struct AINoShowPredictionView: View {
    @StateObject private var viewModel = AINoShowPredictionViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "exclamationmark.triangle.fill",
                    title: "No-Show Prediction",
                    description: "Identify high-risk appointments and prevent no-shows"
                )

                // Stats Summary
                if let stats = viewModel.stats {
                    HStack(spacing: Spacing.md) {
                        StatBox(title: "Total At-Risk", value: "\(stats.totalAtRisk)", color: .orange)
                        StatBox(title: "High Risk", value: "\(stats.highRisk)", color: .red)
                        StatBox(title: "Confirmed", value: "\(stats.confirmed)", color: .green)
                    }
                    .padding(.horizontal, Spacing.lg)
                }

                // Info card
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Risk factors analyzed:")
                        .font(.appSubheadline)
                        .foregroundColor(.charcoal)

                    VStack(alignment: .leading, spacing: Spacing.xs) {
                        Label("Client booking history", systemImage: "clock.arrow.circlepath")
                        Label("Past no-show patterns", systemImage: "xmark.circle")
                        Label("Appointment timing", systemImage: "calendar.badge.clock")
                        Label("Day of week patterns", systemImage: "calendar")
                    }
                    .font(.appCaption)
                    .foregroundColor(.softGray)
                }
                .padding(Spacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.blushPink.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.fetchPredictions() }
                } label: {
                    AIActionButton(text: "Analyze Upcoming Appointments", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                // At-Risk Appointments List
                if !viewModel.appointments.isEmpty {
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("At-Risk Appointments")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)
                            .padding(.horizontal, Spacing.lg)

                        ForEach(viewModel.appointments, id: \.id) { apt in
                            NoShowAppointmentCard(appointment: apt)
                                .padding(.horizontal, Spacing.lg)
                        }
                    }
                }

                if let error = viewModel.error {
                    AIResultCard(title: "Error", content: error)
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Style Recommendation View
struct AIStyleRecommendationView: View {
    @StateObject private var viewModel = AIStyleRecommendationViewModel()

    let lengthOptions = [("short", "Short"), ("medium", "Medium"), ("long", "Long"), ("any", "Open to anything")]
    let hairTypeOptions = [("straight", "Straight"), ("wavy", "Wavy"), ("curly", "Curly"), ("coily", "Coily")]
    let lifestyleOptions = [("professional", "Professional"), ("active", "Active"), ("creative", "Creative"), ("casual", "Casual")]
    let maintenanceOptions = [("low", "Low - Wash and go"), ("medium", "Medium - Some styling"), ("high", "High - Daily styling")]

    // Sample data for Load Example
    let sampleData = [
        ("medium", "wavy", "professional", "medium", "Looking for something easy to style for work"),
        ("short", "straight", "active", "low", "Need a low-maintenance cut for gym"),
        ("long", "curly", "creative", "high", "Want to embrace natural curls"),
        ("any", "coily", "casual", "medium", "Open to trying something new"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Load Example button
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleData.randomElement()!
                        viewModel.hairLength = sample.0
                        viewModel.hairType = sample.1
                        viewModel.lifestyle = sample.2
                        viewModel.maintenance = sample.3
                        viewModel.notes = sample.4
                    } label: {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.blushPink.opacity(0.3))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, Spacing.lg)

                AIFeatureHeader(
                    icon: "sparkles.rectangle.stack.fill",
                    title: "AI Style Recommender",
                    description: "Get personalized hairstyle recommendations"
                )

                // Preferred Length
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Preferred Length")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    HStack(spacing: Spacing.sm) {
                        ForEach(lengthOptions, id: \.0) { value, label in
                            AppFilterChip(label: label, isSelected: viewModel.hairLength == value) {
                                viewModel.hairLength = value
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Hair Type
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Hair Type")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    HStack(spacing: Spacing.sm) {
                        ForEach(hairTypeOptions, id: \.0) { value, label in
                            AppFilterChip(label: label, isSelected: viewModel.hairType == value) {
                                viewModel.hairType = value
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Lifestyle
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Lifestyle")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(lifestyleOptions, id: \.0) { value, label in
                                AppFilterChip(label: label, isSelected: viewModel.lifestyle == value) {
                                    viewModel.lifestyle = value
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Maintenance Level
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Maintenance Level")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    VStack(spacing: Spacing.sm) {
                        ForEach(maintenanceOptions, id: \.0) { value, label in
                            Button {
                                viewModel.maintenance = value
                            } label: {
                                HStack {
                                    Image(systemName: viewModel.maintenance == value ? "circle.fill" : "circle")
                                        .foregroundColor(viewModel.maintenance == value ? .roseGold : .softGray)
                                    Text(label)
                                        .font(.appSubheadline)
                                        .foregroundColor(.charcoal)
                                    Spacer()
                                }
                                .padding(Spacing.sm)
                                .background(viewModel.maintenance == value ? Color.blushPink.opacity(0.3) : Color.cardBackground)
                                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm))
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Additional Notes
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Additional Notes (Optional)")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    TextField("Any specific requests or concerns...", text: $viewModel.notes, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(3...5)
                }
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.recommend() }
                } label: {
                    AIActionButton(text: "Get Recommendations", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "Recommended Styles", content: result.recommendations.joined(separator: "\n\n"))
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Voice Receptionist View
struct AIVoiceReceptionistView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "phone.badge.waveform.fill",
                    title: "Voice Receptionist",
                    description: "AI-powered voice assistant for handling incoming calls"
                )

                VStack(spacing: Spacing.md) {
                    Image(systemName: "phone.circle.fill")
                        .font(.system(size: 80))
                        .foregroundStyle(LinearGradient.goldGradient)

                    Text("Coming Soon")
                        .font(.appTitle3)
                        .foregroundColor(.charcoal)

                    Text("Voice receptionist requires phone system integration. Contact support to set up.")
                        .font(.appSubheadline)
                        .foregroundColor(.softGray)
                        .multilineTextAlignment(.center)
                }
                .padding(Spacing.xl)
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Social Media View
struct AISocialMediaView: View {
    @StateObject private var viewModel = AISocialMediaViewModel()

    let platforms = ["Instagram", "Facebook", "Twitter", "LinkedIn"]
    let postTypes = ["Promotion", "Tips", "Behind the Scenes", "Client Spotlight", "Product Feature"]

    let sampleData = [
        ("Instagram", "Promotion", "20% off all hair coloring services this weekend!"),
        ("Facebook", "Tips", "5 tips to keep your hair healthy during winter"),
        ("Instagram", "Behind the Scenes", "Our stylists preparing for a bridal makeover"),
        ("Twitter", "Client Spotlight", "Amazing transformation for Sarah's wedding day"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Header with Load Example button
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleData.randomElement()!
                        viewModel.selectedPlatform = sample.0
                        viewModel.selectedType = sample.1
                    } label: {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.blushPink.opacity(0.3))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, Spacing.lg)

                AIFeatureHeader(
                    icon: "camera.fill",
                    title: "Social Media Content",
                    description: "Generate engaging social media posts"
                )

                // Platform Selection
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Platform")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(platforms, id: \.self) { platform in
                                AppFilterChip(label: platform, isSelected: viewModel.selectedPlatform == platform) {
                                    viewModel.selectedPlatform = platform
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Post Type Selection
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Post Type")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(postTypes, id: \.self) { type in
                                AppFilterChip(label: type, isSelected: viewModel.selectedType == type) {
                                    viewModel.selectedType = type
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.generate() }
                } label: {
                    AIActionButton(text: "Generate Content", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "Generated Post", content: result.content, showCopy: true)
                        .padding(.horizontal, Spacing.lg)

                    if !result.hashtags.isEmpty {
                        AIResultCard(title: "Suggested Hashtags", content: result.hashtags.joined(separator: " "), showCopy: true)
                            .padding(.horizontal, Spacing.lg)
                    }
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Upsell Suggestions View
struct AIUpsellSuggestionsView: View {
    @StateObject private var viewModel = AIUpsellSuggestionsViewModel()

    let serviceOptions = ["Haircut", "Hair Color", "Balayage", "Highlights", "Blowout", "Manicure", "Pedicure", "Gel Nails", "Facial", "Massage", "Waxing"]

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "arrow.up.circle.fill",
                    title: "Upsell Suggestions",
                    description: "Get AI-powered recommendations to increase revenue"
                )

                // Client Picker
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Select Client")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    Button {
                        viewModel.showClientPicker = true
                    } label: {
                        HStack {
                            if let client = viewModel.selectedClient {
                                Text("\(client.firstName) \(client.lastName)")
                                    .foregroundColor(.charcoal)
                            } else {
                                Text("Tap to select a client")
                                    .foregroundColor(.softGray)
                            }
                            Spacer()
                            Image(systemName: "chevron.down")
                                .foregroundColor(.roseGold)
                        }
                        .padding(Spacing.md)
                        .background(Color.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                        .overlay(
                            RoundedRectangle(cornerRadius: CornerRadius.md)
                                .stroke(Color.blushPink, lineWidth: 1)
                        )
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Current Service
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Current Service")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(serviceOptions, id: \.self) { service in
                                AppFilterChip(label: service, isSelected: viewModel.currentService == service) {
                                    viewModel.currentService = service
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Client Notes
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Client Notes/History")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    TextEditor(text: $viewModel.clientNotes)
                        .frame(height: 80)
                        .padding(Spacing.sm)
                        .background(Color.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: CornerRadius.md)
                                .stroke(Color.blushPink, lineWidth: 1)
                        )
                }
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.getSuggestions() }
                } label: {
                    AIActionButton(text: "Get Suggestions", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.currentService.isEmpty)
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "Upsell Opportunities", content: result.suggestions.joined(separator: "\n\n"))
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
        .task {
            await viewModel.fetchClients()
        }
        .sheet(isPresented: $viewModel.showClientPicker) {
            UpsellClientPickerSheet(viewModel: viewModel)
        }
    }
}

struct UpsellClientPickerSheet: View {
    @ObservedObject var viewModel: AIUpsellSuggestionsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.softGray)
                    TextField("Search clients...", text: $viewModel.searchText)
                }
                .padding(Spacing.md)
                .background(Color.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                .padding(.horizontal, Spacing.lg)
                .padding(.vertical, Spacing.md)

                if viewModel.isLoadingClients {
                    ProgressView()
                        .padding()
                } else if viewModel.filteredClients.isEmpty {
                    VStack(spacing: Spacing.md) {
                        Image(systemName: "person.slash")
                            .font(.system(size: 40))
                            .foregroundColor(.softGray)
                        Text("No clients found")
                            .font(.appSubheadline)
                            .foregroundColor(.softGray)
                    }
                    .padding(.top, Spacing.xl)
                } else {
                    List(viewModel.filteredClients) { client in
                        Button {
                            viewModel.selectedClient = client
                            dismiss()
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("\(client.firstName) \(client.lastName)")
                                        .font(.appBody)
                                        .foregroundColor(.charcoal)
                                    if !client.phone.isEmpty {
                                        Text(client.phone)
                                            .font(.appCaption)
                                            .foregroundColor(.softGray)
                                    }
                                }
                                Spacer()
                                if viewModel.selectedClient?.id == client.id {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.roseGold)
                                }
                            }
                        }
                    }
                    .listStyle(.plain)
                }

                Spacer()
            }
            .navigationTitle("Select Client")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Inventory Forecast View
struct AIInventoryForecastView: View {
    @StateObject private var viewModel = AIInventoryForecastViewModel()

    let categoryOptions = ["All Categories", "Hair Care", "Styling Products", "Skincare", "Nail Products", "Color Products"]
    let timeframeOptions = ["30", "60", "90"]
    let seasonOptions = ["Normal", "Summer Rush", "Winter", "Holiday", "Spring/Prom"]

    let sampleData = [
        ("Hair Care", "30", "Summer Rush"),
        ("Styling Products", "60", "Winter"),
        ("Nail Products", "30", "Holiday"),
        ("Skincare", "90", "Spring/Prom"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Header with Load Example button
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleData.randomElement()!
                        viewModel.category = sample.0
                        viewModel.timeframe = sample.1
                        viewModel.season = sample.2
                    } label: {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.blushPink.opacity(0.3))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, Spacing.lg)

                AIFeatureHeader(
                    icon: "cube.box.fill",
                    title: "Inventory Forecast",
                    description: "Predict product demand and optimize stock levels"
                )

                // Product Category
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Product Category")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(categoryOptions, id: \.self) { cat in
                                AppFilterChip(label: cat, isSelected: viewModel.category == cat) {
                                    viewModel.category = cat
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Forecast Timeframe
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Forecast Timeframe")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    HStack(spacing: Spacing.sm) {
                        ForEach(timeframeOptions, id: \.self) { days in
                            AppFilterChip(label: "Next \(days) Days", isSelected: viewModel.timeframe == days) {
                                viewModel.timeframe = days
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Seasonal Factor
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Seasonal Consideration")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(seasonOptions, id: \.self) { season in
                                AppFilterChip(label: season, isSelected: viewModel.season == season) {
                                    viewModel.season = season
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.forecast() }
                } label: {
                    AIActionButton(text: "Forecast Inventory", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "Inventory Recommendations", content: result.recommendations.joined(separator: "\n\n"))
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Reactivation View
struct AIReactivationView: View {
    @StateObject private var viewModel = AIReactivationViewModel()

    let inactiveDaysOptions = ["30", "45", "60", "90", "180"]
    let segmentOptions = ["All Clients", "VIP", "Regular", "New", "Lapsed"]
    let campaignTypeOptions = ["We Miss You", "Return Offer", "Birthday", "Follow-up", "Loyalty Reminder"]

    let sampleData = [
        ("45", "VIP", "Return Offer"),
        ("90", "Regular", "We Miss You"),
        ("30", "New", "Follow-up"),
        ("60", "Lapsed", "Birthday"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Header with Load Example button
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleData.randomElement()!
                        viewModel.inactiveDays = sample.0
                        viewModel.segment = sample.1
                        viewModel.campaignType = sample.2
                    } label: {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.blushPink.opacity(0.3))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, Spacing.lg)

                AIFeatureHeader(
                    icon: "person.crop.circle.badge.plus",
                    title: "Client Reactivation",
                    description: "Generate win-back campaigns for inactive clients"
                )

                // Inactive Days
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Days Since Last Visit")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(inactiveDaysOptions, id: \.self) { days in
                                AppFilterChip(label: "\(days)+ days", isSelected: viewModel.inactiveDays == days) {
                                    viewModel.inactiveDays = days
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Client Segment
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Client Segment")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(segmentOptions, id: \.self) { seg in
                                AppFilterChip(label: seg, isSelected: viewModel.segment == seg) {
                                    viewModel.segment = seg
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Campaign Type
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Campaign Type")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(campaignTypeOptions, id: \.self) { type in
                                AppFilterChip(label: type, isSelected: viewModel.campaignType == type) {
                                    viewModel.campaignType = type
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.generate() }
                } label: {
                    AIActionButton(text: "Generate Campaign", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                // Summary Card
                if let summary = viewModel.summary {
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Inactive Client Summary")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)

                        HStack(spacing: Spacing.md) {
                            ReactivationStatBox(
                                title: "Total Inactive",
                                value: "\(summary.totalInactiveClients ?? 0)",
                                icon: "person.slash",
                                color: .orange
                            )

                            if let segments = summary.bySegment {
                                ReactivationStatBox(
                                    title: "VIP",
                                    value: "\(segments.vip ?? 0)",
                                    icon: "crown.fill",
                                    color: .roseGold
                                )
                            }
                        }

                        if let segments = summary.bySegment {
                            HStack(spacing: Spacing.md) {
                                ReactivationStatBox(
                                    title: "Regular",
                                    value: "\(segments.regular ?? 0)",
                                    icon: "person.fill",
                                    color: .blue
                                )
                                ReactivationStatBox(
                                    title: "Occasional",
                                    value: "\(segments.occasional ?? 0)",
                                    icon: "star",
                                    color: .green
                                )
                            }
                        }

                        if let contactable = summary.contactable {
                            HStack(spacing: Spacing.md) {
                                Label("\(contactable.email ?? 0) can be emailed", systemImage: "envelope.fill")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                                Label("\(contactable.sms ?? 0) can be texted", systemImage: "message.fill")
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                            }
                        }
                    }
                    .padding(Spacing.md)
                    .background(Color.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                    .appShadow(.soft)
                    .padding(.horizontal, Spacing.lg)
                }

                // Projected Reactivation
                if let projection = viewModel.projectedReactivation {
                    HStack {
                        Image(systemName: "target")
                            .foregroundColor(.roseGold)
                        Text("Projected Reactivation: ")
                            .font(.appSubheadline)
                            .foregroundColor(.charcoal)
                        Text(projection)
                            .font(.appHeadline)
                            .foregroundColor(.green)
                        Spacer()
                    }
                    .padding(Spacing.md)
                    .background(Color.green.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                    .padding(.horizontal, Spacing.lg)
                }

                // Campaign Cards
                if !viewModel.campaigns.isEmpty {
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Generated Campaigns")
                            .font(.appHeadline)
                            .foregroundColor(.charcoal)
                            .padding(.horizontal, Spacing.lg)

                        ForEach(viewModel.campaigns) { campaign in
                            ReactivationCampaignCard(campaign: campaign)
                                .padding(.horizontal, Spacing.lg)
                        }
                    }
                }

                // Tips
                if !viewModel.tips.isEmpty {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        HStack {
                            Image(systemName: "lightbulb.fill")
                                .foregroundColor(.yellow)
                            Text("Marketing Tips")
                                .font(.appHeadline)
                                .foregroundColor(.charcoal)
                        }

                        ForEach(viewModel.tips, id: \.self) { tip in
                            HStack(alignment: .top, spacing: Spacing.sm) {
                                Text("•")
                                    .foregroundColor(.roseGold)
                                Text(tip)
                                    .font(.appBody)
                                    .foregroundColor(.charcoal)
                            }
                        }
                    }
                    .padding(Spacing.md)
                    .background(Color.blushPink.opacity(0.2))
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
                    .padding(.horizontal, Spacing.lg)
                }

                // Error
                if let error = viewModel.error {
                    AIResultCard(title: "Error", content: error)
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

struct ReactivationStatBox: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: Spacing.xs) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            Text(value)
                .font(.appTitle2)
                .foregroundColor(.charcoal)
            Text(title)
                .font(.appCaption)
                .foregroundColor(.softGray)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.md)
        .background(color.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
    }
}

struct ReactivationCampaignCard: View {
    let campaign: ReactivationCampaign

    private var typeIcon: String {
        switch campaign.type?.lowercased() {
        case "email": return "envelope.fill"
        case "sms": return "message.fill"
        case "vip": return "crown.fill"
        default: return "megaphone.fill"
        }
    }

    private var typeColor: Color {
        switch campaign.type?.lowercased() {
        case "email": return .blue
        case "sms": return .green
        case "vip": return .roseGold
        default: return .orange
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            // Header
            HStack {
                Image(systemName: typeIcon)
                    .foregroundColor(.white)
                    .padding(8)
                    .background(typeColor)
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text(campaign.name ?? "Campaign")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)
                    Text(campaign.type?.uppercased() ?? "")
                        .font(.appCaption)
                        .foregroundColor(typeColor)
                }

                Spacer()

                if let urgency = campaign.urgency {
                    Text(urgency.uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(urgency == "high" ? Color.red : urgency == "medium" ? Color.orange : Color.green)
                        .clipShape(Capsule())
                }
            }

            // Subject
            if let subject = campaign.subject {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Subject Line")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    Text(subject)
                        .font(.appSubheadline)
                        .foregroundColor(.charcoal)
                        .italic()
                }
            }

            // Message Preview
            if let message = campaign.message {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Message")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    Text(message)
                        .font(.appBody)
                        .foregroundColor(.charcoal)
                        .lineLimit(4)
                }
            }

            // Offer
            if let offer = campaign.offer {
                HStack {
                    Image(systemName: "tag.fill")
                        .foregroundColor(.green)
                    Text(offer)
                        .font(.appSubheadline)
                        .foregroundColor(.green)
                    if let value = campaign.offerValue {
                        Text("(\(value))")
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                    }
                }
                .padding(Spacing.sm)
                .background(Color.green.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm))
            }

            // Footer
            HStack {
                if let segment = campaign.targetSegment {
                    Label(segment.capitalized, systemImage: "person.2.fill")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
                Spacer()
                if let sendTime = campaign.bestSendTime {
                    Label(sendTime, systemImage: "clock")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
            }

            // Copy Button
            Button {
                var textToCopy = ""
                if let subject = campaign.subject {
                    textToCopy += "Subject: \(subject)\n\n"
                }
                if let message = campaign.message {
                    textToCopy += message
                }
                UIPasteboard.general.string = textToCopy
            } label: {
                HStack {
                    Image(systemName: "doc.on.doc")
                    Text("Copy Campaign")
                }
                .font(.appCaption)
                .foregroundColor(.roseGold)
            }
            .padding(.top, Spacing.xs)
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.md)
                .stroke(typeColor.opacity(0.3), lineWidth: 1)
        )
        .appShadow(.soft)
    }
}

// MARK: - Price Optimizer View
struct AIPriceOptimizerView: View {
    @StateObject private var viewModel = AIPriceOptimizerViewModel()

    let serviceOptions = ["Women's Haircut", "Men's Haircut", "Hair Color", "Balayage", "Highlights", "Blowout", "Manicure", "Pedicure", "Gel Nails", "Facial Treatment", "Massage"]
    let positionOptions = ["Budget", "Mid-Range", "Premium", "Luxury"]
    let goalOptions = ["Increase Revenue", "Increase Bookings", "Maximize Profit", "Stay Competitive"]

    let sampleData = [
        ("Women's Haircut", "65", "Mid-Range", "Increase Revenue"),
        ("Balayage", "180", "Premium", "Stay Competitive"),
        ("Manicure", "35", "Budget", "Increase Bookings"),
        ("Facial Treatment", "95", "Mid-Range", "Maximize Profit"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Header with Load Example button
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleData.randomElement()!
                        viewModel.service = sample.0
                        viewModel.currentPrice = sample.1
                        viewModel.marketPosition = sample.2
                        viewModel.goal = sample.3
                    } label: {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.blushPink.opacity(0.3))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, Spacing.lg)

                AIFeatureHeader(
                    icon: "dollarsign.circle.fill",
                    title: "Price Optimizer",
                    description: "Get AI-powered pricing recommendations"
                )

                // Service Selection
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Service")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(serviceOptions, id: \.self) { svc in
                                AppFilterChip(label: svc, isSelected: viewModel.service == svc) {
                                    viewModel.service = svc
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Current Price
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Current Price ($)")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    TextField("Enter current price", text: $viewModel.currentPrice)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.numberPad)
                }
                .padding(.horizontal, Spacing.lg)

                // Market Position
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Market Position")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    HStack(spacing: Spacing.sm) {
                        ForEach(positionOptions, id: \.self) { pos in
                            AppFilterChip(label: pos, isSelected: viewModel.marketPosition == pos) {
                                viewModel.marketPosition = pos
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Pricing Goal
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Pricing Goal")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(goalOptions, id: \.self) { g in
                                AppFilterChip(label: g, isSelected: viewModel.goal == g) {
                                    viewModel.goal = g
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.optimize() }
                } label: {
                    AIActionButton(text: "Optimize Prices", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.service.isEmpty || viewModel.currentPrice.isEmpty)
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "Pricing Recommendations", content: result.recommendations.joined(separator: "\n\n"))
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Review Response View (Sentiment Analysis)
struct AIReviewResponseView: View {
    @StateObject private var viewModel = AIReviewResponseViewModel()

    let sampleReviews = [
        (5, "Sarah", "Amazing experience! The balayage is perfect and everyone was so friendly!"),
        (2, "Mike", "Waited 30 minutes past my appointment. The haircut was okay but not worth the wait."),
        (4, "Jessica", "Great service, love my new color! Only issue was parking."),
        (1, "Karen", "Terrible! They ruined my hair color. Manager was rude when I complained."),
        (3, "Tom", "Decent haircut. Nothing special but gets the job done."),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Header with Load Example button
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleReviews.randomElement()!
                        viewModel.rating = sample.0
                        viewModel.customerName = sample.1
                        viewModel.reviewText = sample.2
                    } label: {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.blushPink.opacity(0.3))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Rating Stars
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Customer Rating")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    HStack(spacing: Spacing.md) {
                        ForEach(1...5, id: \.self) { star in
                            Button {
                                viewModel.rating = star
                            } label: {
                                Image(systemName: star <= viewModel.rating ? "star.fill" : "star")
                                    .font(.title2)
                                    .foregroundColor(star <= viewModel.rating ? .champagneGold : .softGray)
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Customer Name
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Customer Name")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    TextField("Enter customer name", text: $viewModel.customerName)
                        .textFieldStyle(.roundedBorder)
                }
                .padding(.horizontal, Spacing.lg)

                // Review Text
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Review Text")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    TextEditor(text: $viewModel.reviewText)
                        .frame(height: 120)
                        .padding(Spacing.sm)
                        .background(Color.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: CornerRadius.md)
                                .stroke(Color.blushPink, lineWidth: 1)
                        )
                }
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.generateResponse() }
                } label: {
                    AIActionButton(text: "Generate Response", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.reviewText.isEmpty)
                .padding(.horizontal, Spacing.lg)

                if let response = viewModel.generatedResponse {
                    AIResultCard(title: "Generated Response", content: response, showCopy: true)
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Message Generator View
struct AIMessageGeneratorView: View {
    @StateObject private var viewModel = AIMessageGeneratorViewModel()

    let messageTypes = ["Reminder", "Follow-up", "Promotion", "Birthday", "Thank You", "Reactivation"]
    let tones = ["Professional", "Friendly", "Casual", "Formal"]
    let languages = ["English", "Spanish", "Vietnamese", "Korean", "Chinese"]

    let sampleData = [
        ("Reminder", "Friendly", "English"),
        ("Birthday", "Friendly", "English"),
        ("Promotion", "Professional", "English"),
        ("Reactivation", "Friendly", "Spanish"),
        ("Thank You", "Professional", "English"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Header with Load Example button
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleData.randomElement()!
                        viewModel.selectedType = sample.0
                        viewModel.selectedTone = sample.1
                        viewModel.selectedLanguage = sample.2
                    } label: {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.blushPink.opacity(0.3))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Message Type
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Message Type")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(messageTypes, id: \.self) { type in
                                AppFilterChip(label: type, isSelected: viewModel.selectedType == type) {
                                    viewModel.selectedType = type
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Tone
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Tone")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    HStack(spacing: Spacing.sm) {
                        ForEach(tones, id: \.self) { tone in
                            AppFilterChip(label: tone, isSelected: viewModel.selectedTone == tone) {
                                viewModel.selectedTone = tone
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Language
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Language")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(languages, id: \.self) { lang in
                                AppFilterChip(label: lang, isSelected: viewModel.selectedLanguage == lang) {
                                    viewModel.selectedLanguage = lang
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.generateMessage() }
                } label: {
                    AIActionButton(text: "Generate Message", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                // Error display
                if let error = viewModel.error {
                    AIResultCard(title: "Error", content: error)
                        .padding(.horizontal, Spacing.lg)
                }

                // Subject
                if let subject = viewModel.generatedSubject {
                    AIResultCard(title: "📧 Subject Line", content: subject, showCopy: true)
                        .padding(.horizontal, Spacing.lg)
                }

                // Email Version
                if let email = viewModel.generatedEmail {
                    AIResultCard(title: "✉️ Email Version", content: email, showCopy: true)
                        .padding(.horizontal, Spacing.lg)
                }

                // SMS Version
                if let sms = viewModel.generatedSMS {
                    AIResultCard(title: "📱 SMS Version (\(sms.count)/160 chars)", content: sms, showCopy: true)
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Translate View
struct AITranslateView: View {
    @StateObject private var viewModel = AITranslateViewModel()

    let languages = ["Spanish", "Vietnamese", "Korean", "Chinese", "French", "German", "Japanese", "Portuguese"]

    let sampleData = [
        ("Spanish", "Your appointment is confirmed for tomorrow at 2 PM. See you soon!"),
        ("Vietnamese", "Thank you for visiting our salon. We hope you enjoyed your service!"),
        ("Korean", "We have a special 20% discount on all hair coloring this week."),
        ("Chinese", "Please arrive 10 minutes early for your appointment."),
        ("French", "Your hair looks beautiful! Remember to use the recommended products."),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Header with Load Example button
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleData.randomElement()!
                        viewModel.targetLanguage = sample.0
                        viewModel.inputText = sample.1
                    } label: {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.appCaption)
                        .foregroundColor(.roseGold)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.blushPink.opacity(0.3))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Target Language
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Translate To")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Spacing.sm) {
                            ForEach(languages, id: \.self) { lang in
                                AppFilterChip(label: lang, isSelected: viewModel.targetLanguage == lang) {
                                    viewModel.targetLanguage = lang
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.lg)

                // Input Text
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text("Text to Translate")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    TextEditor(text: $viewModel.inputText)
                        .frame(height: 120)
                        .padding(Spacing.sm)
                        .background(Color.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: CornerRadius.md)
                                .stroke(Color.blushPink, lineWidth: 1)
                        )
                }
                .padding(.horizontal, Spacing.lg)

                Button {
                    Task { await viewModel.translate() }
                } label: {
                    AIActionButton(text: "Translate", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.inputText.isEmpty)
                .padding(.horizontal, Spacing.lg)

                if let translation = viewModel.translatedText {
                    AIResultCard(title: "Translation", content: translation, showCopy: true)
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Business Insights View
struct AIBusinessInsightsView: View {
    @StateObject private var viewModel = AIInsightsViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                if viewModel.isLoading {
                    AppLoadingView()
                        .frame(height: 300)
                } else if let insights = viewModel.insights {
                    // Executive Summary
                    AIResultCard(title: "Executive Summary", content: insights.summary)
                        .padding(.horizontal, Spacing.lg)

                    // Key Insights
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Key Insights")
                            .font(.appTitle3)
                            .foregroundColor(.charcoal)
                            .padding(.horizontal, Spacing.lg)

                        ForEach(insights.keyInsights, id: \.self) { insight in
                            HStack(alignment: .top, spacing: Spacing.md) {
                                Image(systemName: "lightbulb.fill")
                                    .foregroundColor(.champagneGold)

                                Text(insight)
                                    .font(.appSubheadline)
                                    .foregroundColor(.charcoal)
                            }
                            .padding(Spacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.cardBackground)
                            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                            .appShadow(.soft)
                            .padding(.horizontal, Spacing.lg)
                        }
                    }

                    // Recommendations
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Recommendations")
                            .font(.appTitle3)
                            .foregroundColor(.charcoal)
                            .padding(.horizontal, Spacing.lg)

                        ForEach(insights.recommendations, id: \.self) { rec in
                            HStack(alignment: .top, spacing: Spacing.md) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.success)

                                Text(rec)
                                    .font(.appSubheadline)
                                    .foregroundColor(.charcoal)
                            }
                            .padding(Spacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.cardBackground)
                            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                            .appShadow(.soft)
                            .padding(.horizontal, Spacing.lg)
                        }
                    }
                } else {
                    AIFeatureHeader(
                        icon: "chart.bar.fill",
                        title: "Business Insights",
                        description: "Get AI-powered analysis of your business performance"
                    )

                    Button {
                        Task { await viewModel.generateInsights() }
                    } label: {
                        AIActionButton(text: "Generate Insights", isLoading: viewModel.isLoading)
                    }
                    .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Generic Feature View
struct AIGenericFeatureView: View {
    let feature: AIFeature

    var body: some View {
        VStack(spacing: Spacing.lg) {
            AIFeatureHeader(
                icon: feature.icon,
                title: feature.name,
                description: feature.description
            )

            Text("Feature coming soon...")
                .font(.appSubheadline)
                .foregroundColor(.softGray)
        }
        .padding(.vertical, Spacing.lg)
    }
}

// MARK: - Reusable Components
struct AIFeatureHeader: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: Spacing.md) {
            ZStack {
                Circle()
                    .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                    .frame(width: 80, height: 80)

                Image(systemName: icon)
                    .font(.system(size: 36))
                    .foregroundStyle(LinearGradient.roseGoldGradient)
            }

            Text(title)
                .font(.appTitle2)
                .foregroundColor(.charcoal)

            Text(description)
                .font(.appSubheadline)
                .foregroundColor(.softGray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, Spacing.xl)
        }
        .padding(.vertical, Spacing.lg)
    }
}

struct AIActionButton: View {
    let text: String
    let isLoading: Bool

    var body: some View {
        HStack(spacing: Spacing.sm) {
            if isLoading {
                ProgressView()
                    .tint(.white)
            } else {
                Image(systemName: "sparkles")
                Text(text)
            }
        }
        .font(.appHeadline)
        .foregroundColor(.white)
        .frame(maxWidth: .infinity)
        .frame(height: 54)
        .background(LinearGradient.roseGoldGradient)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .shadow(color: .roseGold.opacity(0.4), radius: 10, x: 0, y: 5)
    }
}

struct AIResultCard: View {
    let title: String
    let content: String
    var showCopy: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                Text(title)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)

                Spacer()

                if showCopy {
                    Button {
                        UIPasteboard.general.string = content
                    } label: {
                        Image(systemName: "doc.on.doc")
                            .foregroundColor(.roseGold)
                    }
                }
            }

            Text(content)
                .font(.appBody)
                .foregroundColor(.charcoal)
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        .appShadow(.soft)
    }
}

struct StatBox: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: Spacing.xs) {
            Text(value)
                .font(.appTitle2)
                .foregroundColor(color)
            Text(title)
                .font(.appCaption)
                .foregroundColor(.softGray)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.md)
        .background(color.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
    }
}

struct NoShowAppointmentCard: View {
    let appointment: NoShowAppointment

    private var riskColor: Color {
        if appointment.riskScore >= 0.7 { return .red }
        if appointment.riskScore >= 0.4 { return .orange }
        return .yellow
    }

    private var riskLevel: String {
        if appointment.riskScore >= 0.7 { return "High Risk" }
        if appointment.riskScore >= 0.4 { return "Medium Risk" }
        return "Low Risk"
    }

    private var formattedDate: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: appointment.scheduledStart) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "EEE, MMM d 'at' h:mm a"
            return displayFormatter.string(from: date)
        }
        // Fallback for different ISO format
        formatter.formatOptions = [.withInternetDateTime]
        if let date = formatter.date(from: appointment.scheduledStart) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "EEE, MMM d 'at' h:mm a"
            return displayFormatter.string(from: date)
        }
        return appointment.scheduledStart
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(appointment.client.firstName) \(appointment.client.lastName)")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)

                    if let phone = appointment.client.phone, !phone.isEmpty {
                        Text(phone)
                            .font(.appCaption)
                            .foregroundColor(.softGray)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(Int(appointment.riskScore * 100))%")
                        .font(.appTitle3)
                        .fontWeight(.bold)
                        .foregroundColor(riskColor)

                    Text(riskLevel)
                        .font(.appCaption)
                        .foregroundColor(riskColor)
                }
            }

            Text(formattedDate)
                .font(.appSubheadline)
                .foregroundColor(.softGray)

            if let services = appointment.services, !services.isEmpty {
                Text(services.map { $0.service.name }.joined(separator: ", "))
                    .font(.appCaption)
                    .foregroundColor(.roseGold)
            }

            if !appointment.riskFactors.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(appointment.riskFactors, id: \.self) { factor in
                        HStack(spacing: 4) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 10))
                            Text(factor)
                                .font(.appCaption)
                        }
                        .foregroundColor(.orange)
                    }
                }
                .padding(.top, Spacing.xs)
            }

            HStack(spacing: Spacing.sm) {
                if appointment.isConfirmed == true {
                    Label("Confirmed", systemImage: "checkmark.circle.fill")
                        .font(.appCaption)
                        .foregroundColor(.green)
                } else {
                    Label("Not Confirmed", systemImage: "questionmark.circle")
                        .font(.appCaption)
                        .foregroundColor(.orange)
                }

                Spacer()

                if let staffName = appointment.staff?.displayName {
                    Text("with \(staffName)")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
            }
            .padding(.top, Spacing.xs)
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md))
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.md)
                .stroke(riskColor.opacity(0.3), lineWidth: 1)
        )
        .appShadow(.soft)
    }
}

// MARK: - Models & ViewModels

struct ChatMessage: Identifiable {
    let id = UUID()
    let content: String
    let isUser: Bool
}

@MainActor
class AIChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var inputText = ""
    @Published var isLoading = false

    func sendMessage() async {
        guard !inputText.isEmpty else { return }

        let userMessage = inputText
        messages.append(ChatMessage(content: userMessage, isUser: true))
        inputText = ""
        isLoading = true

        print("🔵 [AIChat] Sending message...")

        do {
            // Build message history for the API
            struct APIMessage: Encodable {
                let role: String
                let content: String
            }
            struct ChatRequest: Encodable {
                let messages: [APIMessage]
            }
            // Handle both success and error responses
            struct ChatResponse: Decodable {
                let success: Bool
                let message: String?  // Optional - only present on success
                let error: String?    // Optional - only present on error
            }

            // Convert local messages to API format (excluding the UI welcome message if any)
            let apiMessages = messages.map { msg in
                APIMessage(role: msg.isUser ? "user" : "assistant", content: msg.content)
            }

            print("🔵 [AIChat] Sending \(apiMessages.count) messages to API")

            let result: ChatResponse = try await APIClient.shared.post("/ai/chat", body: ChatRequest(messages: apiMessages))

            if result.success, let message = result.message {
                print("✅ [AIChat] Got response: \(message.prefix(100))...")
                messages.append(ChatMessage(content: message, isUser: false))
            } else if let error = result.error {
                print("❌ [AIChat] API error: \(error)")
                messages.append(ChatMessage(content: "Error: \(error)", isUser: false))
            } else {
                print("❌ [AIChat] Unknown response format")
                messages.append(ChatMessage(content: "Sorry, received an unexpected response format.", isUser: false))
            }
        } catch {
            print("❌ [AIChat] Exception: \(error)")
            messages.append(ChatMessage(content: "Sorry, I couldn't process that request. Error: \(error.localizedDescription)", isUser: false))
        }
        isLoading = false
    }
}

struct SchedulingResult: Codable { let suggestions: [String] }
struct SchedulingAPIResponse: Codable {
    let success: Bool
    let data: SchedulingData?
    let error: String?
}
struct SchedulingData: Codable {
    let recommendedSlots: [RecommendedSlot]?
    let optimizationTips: [String]?
}
struct RecommendedSlot: Codable {
    let date: String
    let time: String
    let staff: String
    let reason: String
}
@MainActor class AISmartSchedulingViewModel: ObservableObject {
    @Published var selectedServices: [String] = []
    @Published var preferredStaff = "any"
    @Published var preferredTime = "flexible"
    @Published var constraints = ""
    @Published var result: SchedulingResult?
    @Published var isLoading = false

    let serviceNames: [String: String] = [
        "haircut": "Haircut", "color": "Hair Color", "balayage": "Balayage",
        "blowout": "Blowout", "manicure": "Manicure", "pedicure": "Pedicure",
        "facial": "Facial", "massage": "Massage"
    ]

    func optimize() async {
        isLoading = true
        do {
            struct Request: Encodable {
                let clientName: String
                let preferredServices: [String]
                let preferredStaff: String?
                let preferredTime: String
                let constraints: String?
            }
            let response: SchedulingAPIResponse = try await APIClient.shared.post("/ai/smart-scheduling", body: Request(
                clientName: "New Client",
                preferredServices: selectedServices.compactMap { serviceNames[$0] },
                preferredStaff: preferredStaff == "any" ? nil : preferredStaff,
                preferredTime: preferredTime,
                constraints: constraints.isEmpty ? nil : constraints
            ))

            if response.success, let data = response.data {
                var suggestions: [String] = []
                if let slots = data.recommendedSlots {
                    for slot in slots {
                        suggestions.append("📅 \(slot.date) at \(slot.time)\n👤 \(slot.staff)\n💡 \(slot.reason)")
                    }
                }
                if let tips = data.optimizationTips {
                    suggestions.append(contentsOf: tips.map { "💡 \(String(describing: $0))" })
                }
                result = SchedulingResult(suggestions: suggestions.isEmpty ? ["AI analysis complete. Try different options."] : suggestions)
            } else if let error = response.error {
                result = SchedulingResult(suggestions: ["Error: \(error)"])
            }
        }
        catch {
            print("Error: \(error)")
            result = SchedulingResult(suggestions: ["Error: \(error.localizedDescription)"])
        }
        isLoading = false
    }
}

struct ClientInsightsResult: Codable { let insights: [String] }
struct ClientInsightsAPIResponse: Codable {
    let success: Bool?
    let data: ClientInsightsData?
    let error: String?
}
struct ClientInsightsData: Codable {
    let summary: String?
    let retentionStrategies: [String]?
    let upsellOpportunities: [String]?
}

@MainActor class AIClientInsightsViewModel: ObservableObject {
    @Published var clients: [Client] = []
    @Published var selectedClient: Client?
    @Published var searchText = ""
    @Published var result: ClientInsightsResult?
    @Published var isLoading = false
    @Published var isLoadingClients = false

    var filteredClients: [Client] {
        if searchText.isEmpty {
            return clients
        }
        return clients.filter { client in
            "\(client.firstName) \(client.lastName)".localizedCaseInsensitiveContains(searchText) ||
            (client.email?.localizedCaseInsensitiveContains(searchText) ?? false) ||
            client.phone.contains(searchText)
        }
    }

    func fetchClients() async {
        isLoadingClients = true
        do {
            let response = try await ClientService.shared.getClients(page: 1, pageSize: 100)
            clients = response.clients
        } catch {
            print("Error fetching clients: \(error)")
        }
        isLoadingClients = false
    }

    func analyze() async {
        guard let client = selectedClient else {
            result = ClientInsightsResult(insights: ["Please select a client first."])
            return
        }

        isLoading = true
        do {
            struct ClientData: Encodable {
                let firstName: String
                let lastName: String
                let email: String
            }
            struct Request: Encodable { let clientData: ClientData }
            let response: ClientInsightsAPIResponse = try await APIClient.shared.post("/ai/client-insights", body: Request(
                clientData: ClientData(
                    firstName: client.firstName,
                    lastName: client.lastName,
                    email: client.email ?? "client@example.com"
                )
            ))

            if let success = response.success, success, let data = response.data {
                var insights: [String] = []
                insights.append("👤 Analysis for \(client.firstName) \(client.lastName)")
                if let summary = data.summary { insights.append("\n📊 \(summary)") }
                if let strategies = data.retentionStrategies, !strategies.isEmpty {
                    insights.append("\n💡 Retention Strategies:")
                    insights.append(contentsOf: strategies.map { "  • \($0)" })
                }
                if let upsells = data.upsellOpportunities, !upsells.isEmpty {
                    insights.append("\n💰 Upsell Opportunities:")
                    insights.append(contentsOf: upsells.map { "  • \($0)" })
                }
                result = ClientInsightsResult(insights: insights.isEmpty ? ["AI analysis complete."] : insights)
            } else if let error = response.error {
                result = ClientInsightsResult(insights: ["Error: \(error)"])
            } else {
                result = ClientInsightsResult(insights: ["Unable to parse response"])
            }
        }
        catch {
            print("Error: \(error)")
            result = ClientInsightsResult(insights: ["Error: \(error.localizedDescription)"])
        }
        isLoading = false
    }
}

struct RevenuePredictorResult: Codable {
    let predictedRevenue: String
    let period: String
    let opportunities: [String]
}
struct RevenueAPIResponse: Codable {
    let success: Bool
    let data: RevenueData?
    let error: String?
}
struct RevenueData: Codable {
    let prediction: RevenuePrediction?
    let recommendations: [RevenueRecommendation]?
}
struct RevenuePrediction: Codable {
    let expectedRevenue: Int?
    let confidence: Int?
    let comparedToLastMonth: String?
}
struct RevenueRecommendation: Codable {
    let action: String?
    let expectedImpact: String?
}
@MainActor class AIRevenuePredictorViewModel: ObservableObject {
    @Published var timeframe = "next_month"
    @Published var includeSeasonality = true
    @Published var result: RevenuePredictorResult?
    @Published var isLoading = false
    func predict() async {
        isLoading = true
        do {
            struct Request: Encodable { let timeframe: String; let includeSeasonality: Bool }
            let response: RevenueAPIResponse = try await APIClient.shared.post("/ai/revenue-predictor", body: Request(
                timeframe: timeframe,
                includeSeasonality: includeSeasonality
            ))

            if response.success, let data = response.data {
                var revenue = "$0"
                let period = timeframe.replacingOccurrences(of: "_", with: " ").capitalized
                var opportunities: [String] = []

                if let pred = data.prediction {
                    if let exp = pred.expectedRevenue {
                        revenue = "$\(exp.formatted())"
                    }
                    if let change = pred.comparedToLastMonth {
                        opportunities.append("📈 vs Last Month: \(change)")
                    }
                    if let conf = pred.confidence {
                        opportunities.append("🎯 Confidence: \(conf)%")
                    }
                }
                if let recs = data.recommendations {
                    for rec in recs {
                        if let action = rec.action, let impact = rec.expectedImpact {
                            opportunities.append("💡 \(action): \(impact)")
                        }
                    }
                }
                result = RevenuePredictorResult(
                    predictedRevenue: revenue,
                    period: period,
                    opportunities: opportunities.isEmpty ? ["AI analysis complete."] : opportunities
                )
            } else if let error = response.error {
                result = RevenuePredictorResult(predictedRevenue: "Error", period: "", opportunities: [error])
            }
        }
        catch {
            print("Error: \(error)")
            result = RevenuePredictorResult(predictedRevenue: "Error", period: "", opportunities: [error.localizedDescription])
        }
        isLoading = false
    }
}

struct NoShowAPIResponse: Codable {
    let appointments: [NoShowAppointment]?
    let stats: NoShowStats?
    let error: String?
}
struct NoShowAppointment: Codable, Identifiable {
    let id: String
    let riskScore: Double
    let riskFactors: [String]
    let scheduledStart: String
    let client: NoShowClient
    let staff: NoShowStaff?
    let services: [NoShowService]?
    let isConfirmed: Bool?
    let reminderSent: Bool?
}
struct NoShowClient: Codable {
    let id: String?
    let firstName: String
    let lastName: String
    let phone: String?
    let email: String?
    let noShowCount: Int?
    let totalAppointments: Int?
}
struct NoShowStaff: Codable {
    let displayName: String?
}
struct NoShowService: Codable {
    let service: NoShowServiceDetail
}
struct NoShowServiceDetail: Codable {
    let name: String
}
struct NoShowStats: Codable {
    let totalAtRisk: Int
    let highRisk: Int
    let mediumRisk: Int?
    let confirmed: Int
}
@MainActor class AINoShowPredictionViewModel: ObservableObject {
    @Published var stats: NoShowStats?
    @Published var appointments: [NoShowAppointment] = []
    @Published var error: String?
    @Published var isLoading = false

    func fetchPredictions() async {
        isLoading = true
        error = nil
        do {
            let response: NoShowAPIResponse = try await APIClient.shared.get("/ai/no-show-prediction")

            if let err = response.error {
                error = err
            } else {
                stats = response.stats
                appointments = response.appointments ?? []
            }
        } catch {
            print("No-Show Prediction Error: \(error)")
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

struct StyleResult: Codable { let recommendations: [String] }
// API returns recommendations as array of objects
struct StyleRecommendationItem: Codable {
    let id: String?
    let name: String?
    let description: String?
    let confidence: Double?
    let tags: [String]?
    let colorSuggestions: [String]?
}
struct StyleAPIResponse: Codable {
    let success: Bool?
    let recommendations: [StyleRecommendationItem]?
    let faceShape: String?
    let error: String?
}
@MainActor class AIStyleRecommendationViewModel: ObservableObject {
    @Published var hairLength = ""
    @Published var hairType = ""
    @Published var lifestyle = ""
    @Published var maintenance = "medium"
    @Published var notes = ""
    @Published var result: StyleResult?
    @Published var isLoading = false
    func recommend() async {
        isLoading = true
        do {
            struct Preferences: Encodable {
                let hairLength: String?
                let hairType: String?
                let lifestyle: String?
                let maintenance: String
                let notes: String?
            }
            struct Request: Encodable {
                let preferences: Preferences
                let image: Bool  // Flag to trigger preferences-based analysis
            }
            let response: StyleAPIResponse = try await APIClient.shared.post("/ai/style-recommendation", body: Request(
                preferences: Preferences(
                    hairLength: hairLength.isEmpty ? nil : hairLength,
                    hairType: hairType.isEmpty ? nil : hairType,
                    lifestyle: lifestyle.isEmpty ? nil : lifestyle,
                    maintenance: maintenance,
                    notes: notes.isEmpty ? nil : notes
                ),
                image: true  // Use preferences-based mode
            ))

            if let success = response.success, success {
                var recs: [String] = []
                if let faceShape = response.faceShape {
                    recs.append("👤 Face Shape: \(faceShape)")
                }
                if let recommendations = response.recommendations {
                    recs.append("\n✨ Recommended Styles:")
                    for (index, item) in recommendations.enumerated() {
                        let name = item.name ?? "Style \(index + 1)"
                        let confidence = item.confidence.map { "\(Int($0 * 100))% match" } ?? ""
                        recs.append("\n\(index + 1). \(name) (\(confidence))")
                        if let desc = item.description {
                            recs.append("   \(desc)")
                        }
                        if let tags = item.tags, !tags.isEmpty {
                            recs.append("   Tags: \(tags.joined(separator: ", "))")
                        }
                        if let colors = item.colorSuggestions, !colors.isEmpty {
                            recs.append("   🎨 Colors: \(colors.prefix(3).joined(separator: ", "))")
                        }
                    }
                }
                result = StyleResult(recommendations: recs.isEmpty ? ["AI analysis complete."] : recs)
            } else if let error = response.error {
                result = StyleResult(recommendations: ["Error: \(error)"])
            } else {
                result = StyleResult(recommendations: ["Unable to parse response"])
            }
        }
        catch {
            print("Error: \(error)")
            print("Decoding error: \(error)")
            result = StyleResult(recommendations: ["Error: \(error.localizedDescription)"])
        }
        isLoading = false
    }
}

struct SocialMediaResult: Codable { let content: String; let hashtags: [String] }
struct SocialMediaAPIResponse: Codable {
    let platform: String?
    let type: String?
    let tone: String?
    let content: SocialMediaContent?
    let error: String?
}
struct SocialMediaContent: Codable {
    let mainPost: String?
    let alternativeVersions: [String]?
    let hashtags: [String]?
    let bestTimeToPost: String?
    let engagementTips: [String]?
    let visualSuggestion: String?
}
@MainActor class AISocialMediaViewModel: ObservableObject {
    @Published var selectedPlatform = "Instagram"
    @Published var selectedType = "Promotion"
    @Published var result: SocialMediaResult?
    @Published var isLoading = false
    func generate() async {
        isLoading = true
        do {
            struct Request: Encodable { let platform: String; let type: String; let topic: String }
            let response: SocialMediaAPIResponse = try await APIClient.shared.post("/ai/social-media", body: Request(
                platform: selectedPlatform.lowercased(),
                type: selectedType.lowercased().replacingOccurrences(of: " ", with: ""),
                topic: "General salon promotion"
            ))

            if let content = response.content {
                let mainPost = content.mainPost ?? "No content generated"
                let hashtags = content.hashtags ?? []
                result = SocialMediaResult(content: mainPost, hashtags: hashtags)
            } else if let error = response.error {
                result = SocialMediaResult(content: "Error: \(error)", hashtags: [])
            } else {
                result = SocialMediaResult(content: "Unable to generate content", hashtags: [])
            }
        } catch {
            print("Error: \(error)")
            result = SocialMediaResult(content: "Error: \(error.localizedDescription)", hashtags: [])
        }
        isLoading = false
    }
}

struct UpsellResult: Codable { let suggestions: [String] }
struct UpsellAPIResponse: Codable {
    let suggestions: UpsellSuggestions?
    let potentialRevenue: UpsellRevenue?
    let error: String?
}
struct UpsellSuggestions: Codable {
    let addOnServices: [UpsellItem]?
    let products: [UpsellItem]?
    let personalizedMessage: String?
}
struct UpsellItem: Codable {
    let name: String?
    let reason: String?
    let price: Double?
}
struct UpsellRevenue: Codable {
    let addOnServices: Double?
    let products: Double?
    let total: Double?
}
@MainActor class AIUpsellSuggestionsViewModel: ObservableObject {
    @Published var clients: [Client] = []
    @Published var selectedClient: Client?
    @Published var searchText = ""
    @Published var showClientPicker = false
    @Published var currentService = ""
    @Published var clientNotes = ""
    @Published var result: UpsellResult?
    @Published var isLoading = false
    @Published var isLoadingClients = false

    var clientName: String {
        if let client = selectedClient {
            return "\(client.firstName) \(client.lastName)"
        }
        return ""
    }

    func fetchClients() async {
        isLoadingClients = true
        do {
            let response = try await ClientService.shared.getClients(page: 1, pageSize: 100)
            clients = response.clients
        } catch {
            print("Error fetching clients: \(error)")
        }
        isLoadingClients = false
    }

    var filteredClients: [Client] {
        if searchText.isEmpty {
            return clients
        }
        return clients.filter {
            $0.firstName.localizedCaseInsensitiveContains(searchText) ||
            $0.lastName.localizedCaseInsensitiveContains(searchText)
        }
    }

    func getSuggestions() async {
        isLoading = true
        do {
            struct ServiceItem: Encodable { let name: String; let price: Int }
            struct Request: Encodable { let currentServices: [ServiceItem] }
            let response: UpsellAPIResponse = try await APIClient.shared.post("/ai/upsell-suggestions", body: Request(
                currentServices: [ServiceItem(name: currentService, price: 50)]
            ))

            var suggestions: [String] = []
            if let data = response.suggestions {
                if let message = data.personalizedMessage {
                    suggestions.append("💬 \(message)")
                }
                if let services = data.addOnServices {
                    suggestions.append("✨ Recommended Add-On Services:")
                    for item in services {
                        let name = item.name ?? "Service"
                        let reason = item.reason ?? ""
                        let price = item.price.map { "$\(Int($0))" } ?? ""
                        suggestions.append("  • \(name) \(price)\n    \(reason)")
                    }
                }
                if let products = data.products {
                    suggestions.append("\n🛍️ Recommended Products:")
                    for item in products {
                        let name = item.name ?? "Product"
                        let reason = item.reason ?? ""
                        let price = item.price.map { "$\(Int($0))" } ?? ""
                        suggestions.append("  • \(name) \(price)\n    \(reason)")
                    }
                }
            }
            if let revenue = response.potentialRevenue, let total = revenue.total {
                suggestions.append("\n💰 Potential Additional Revenue: $\(Int(total))")
            }
            if let error = response.error {
                suggestions.append("Error: \(error)")
            }
            result = UpsellResult(suggestions: suggestions.isEmpty ? ["No suggestions available."] : suggestions)
        }
        catch {
            print("Error: \(error)")
            result = UpsellResult(suggestions: ["Error: \(error.localizedDescription)"])
        }
        isLoading = false
    }
}

struct InventoryResult: Codable { let recommendations: [String] }
struct InventoryAPIResponse: Codable {
    let forecast: InventoryForecast?
    let summary: InventorySummary?
    let aiAnalysis: InventoryAIAnalysis?
    let error: String?
}
struct InventoryForecast: Codable {
    let period: String?
    let generatedAt: String?
}
struct InventorySummary: Codable {
    let totalProducts: Int?
    let outOfStock: Int?
    let lowStock: Int?
    let overstock: Int?
    let healthyStock: Int?
}
struct InventoryAIAnalysis: Codable {
    let urgentReorders: [InventoryReorder]?
    let stockoutRisk: [InventoryRisk]?
    let slowMovers: [InventorySlowMover]?
    let insights: [String]?
    let estimatedReorderCost: Double?
}
struct InventoryReorder: Codable {
    let productName: String?
    let currentStock: Int?
    let recommendedOrder: Int?
    let reason: String?
}
struct InventoryRisk: Codable {
    let productName: String?
    let daysUntilStockout: Int?
    let action: String?
}
struct InventorySlowMover: Codable {
    let productName: String?
    let suggestion: String?
}
@MainActor class AIInventoryForecastViewModel: ObservableObject {
    @Published var category = "All Categories"
    @Published var timeframe = "30"
    @Published var season = "Normal"
    @Published var result: InventoryResult?
    @Published var isLoading = false
    func forecast() async {
        isLoading = true
        do {
            struct Request: Encodable { let daysAhead: Int }
            let response: InventoryAPIResponse = try await APIClient.shared.post("/ai/inventory-forecast", body: Request(
                daysAhead: Int(timeframe) ?? 30
            ))

            var recommendations: [String] = []

            if let summary = response.summary {
                recommendations.append("📊 Inventory Summary:")
                if let total = summary.totalProducts { recommendations.append("  Total products: \(total)") }
                if let outOfStock = summary.outOfStock, outOfStock > 0 { recommendations.append("  🔴 Out of stock: \(outOfStock)") }
                if let lowStock = summary.lowStock, lowStock > 0 { recommendations.append("  🟡 Low stock: \(lowStock)") }
                if let healthy = summary.healthyStock { recommendations.append("  🟢 Healthy stock: \(healthy)") }
            }

            if let ai = response.aiAnalysis {
                if let reorders = ai.urgentReorders, !reorders.isEmpty {
                    recommendations.append("\n⚠️ Urgent Reorders Needed:")
                    for item in reorders.prefix(5) {
                        let name = item.productName ?? "Product"
                        let current = item.currentStock ?? 0
                        let order = item.recommendedOrder ?? 0
                        recommendations.append("  • \(name): Order \(order) units (current: \(current))")
                    }
                }
                if let risks = ai.stockoutRisk, !risks.isEmpty {
                    recommendations.append("\n🚨 Stockout Risk:")
                    for item in risks.prefix(3) {
                        let name = item.productName ?? "Product"
                        let days = item.daysUntilStockout ?? 0
                        recommendations.append("  • \(name): \(days) days until stockout")
                    }
                }
                if let insights = ai.insights {
                    recommendations.append("\n💡 Insights:")
                    for insight in insights.prefix(3) {
                        recommendations.append("  • \(insight)")
                    }
                }
                if let cost = ai.estimatedReorderCost, cost > 0 {
                    recommendations.append("\n💰 Estimated Reorder Cost: $\(Int(cost))")
                }
            }

            if let error = response.error {
                recommendations.append("Error: \(error)")
            }

            result = InventoryResult(recommendations: recommendations.isEmpty ? ["No inventory data available."] : recommendations)
        }
        catch {
            print("Error: \(error)")
            result = InventoryResult(recommendations: ["Error: \(error.localizedDescription)"])
        }
        isLoading = false
    }
}

struct ReactivationAPIResponse: Codable {
    let summary: ReactivationSummary?
    let campaigns: [ReactivationCampaign]?
    let projectedReactivation: String?
    let tips: [String]?
    let error: String?
}
struct ReactivationSummary: Codable {
    let totalInactiveClients: Int?
    let inactiveDaysThreshold: Int?
    let bySegment: ReactivationSegments?
    let contactable: ReactivationContactable?
}
struct ReactivationSegments: Codable {
    let vip: Int?
    let regular: Int?
    let occasional: Int?
}
struct ReactivationContactable: Codable {
    let email: Int?
    let sms: Int?
}
struct ReactivationCampaign: Codable, Identifiable {
    var id: String { type ?? UUID().uuidString }
    let type: String?
    let name: String?
    let subject: String?
    let previewText: String?
    let message: String?
    let offer: String?
    let offerValue: String?
    let targetSegment: String?
    let urgency: String?
    let bestSendTime: String?
}

@MainActor class AIReactivationViewModel: ObservableObject {
    @Published var inactiveDays = "30"
    @Published var segment = "All Clients"
    @Published var campaignType = "We Miss You"
    @Published var summary: ReactivationSummary?
    @Published var campaigns: [ReactivationCampaign] = []
    @Published var projectedReactivation: String?
    @Published var tips: [String] = []
    @Published var error: String?
    @Published var isLoading = false

    func generate() async {
        isLoading = true
        error = nil
        do {
            struct Request: Encodable { let inactiveDays: Int; let limit: Int }
            let response: ReactivationAPIResponse = try await APIClient.shared.post("/ai/reactivation-campaigns", body: Request(
                inactiveDays: Int(inactiveDays) ?? 30,
                limit: 50
            ))

            if let err = response.error {
                error = err
            } else {
                summary = response.summary
                campaigns = response.campaigns ?? []
                projectedReactivation = response.projectedReactivation
                tips = response.tips ?? []
            }
        } catch {
            print("Reactivation Error: \(error)")
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

struct PriceResult: Codable { let recommendations: [String] }
struct PriceAPIResponse: Codable {
    let strategy: String?
    let periodAnalyzed: String?
    let totalBookings: Int?
    let totalRevenue: Double?
    let analysis: PriceAnalysis?
    let error: String?
}
struct PriceAnalysis: Codable {
    let recommendations: [PriceRecommendation]?
    let dynamicPricing: DynamicPricing?
    let promotions: [PricePromotion]?
    let insights: PriceInsights?
}
struct PriceRecommendation: Codable {
    let service: String?
    let currentPrice: Double?
    let suggestedPrice: Double?
    let changePercent: Double?
    let reason: String?
}
struct DynamicPricing: Codable {
    let peakHours: PriceAdjustment?
    let offPeakHours: PriceAdjustment?
    let peakDays: PriceDayAdjustment?
    let slowDays: PriceDayAdjustment?
}
struct PriceAdjustment: Codable {
    let hours: [Int]?
    let surcharge: Int?
    let discount: Int?
}
struct PriceDayAdjustment: Codable {
    let days: [String]?
    let surcharge: Int?
    let discount: Int?
}
struct PricePromotion: Codable {
    let type: String?
    let description: String?
    let expectedImpact: String?
}
struct PriceInsights: Codable {
    let underpriced: [String]?
    let overpriced: [String]?
    let opportunities: [String]?
}
@MainActor class AIPriceOptimizerViewModel: ObservableObject {
    @Published var service = ""
    @Published var currentPrice = ""
    @Published var marketPosition = "Mid-Range"
    @Published var goal = "Increase Revenue"
    @Published var result: PriceResult?
    @Published var isLoading = false

    private func mapGoalToStrategy(_ goal: String) -> String {
        switch goal {
        case "Increase Revenue": return "maximize"
        case "Stay Competitive": return "competitive"
        case "Maximize Profit": return "value"
        case "Increase Bookings": return "demand"
        default: return "competitive"
        }
    }

    func optimize() async {
        isLoading = true
        do {
            struct Request: Encodable { let strategy: String }
            let response: PriceAPIResponse = try await APIClient.shared.post("/ai/price-optimizer", body: Request(
                strategy: mapGoalToStrategy(goal)
            ))

            var recommendations: [String] = []

            if let period = response.periodAnalyzed {
                recommendations.append("📊 Analysis Period: \(period)")
            }
            if let bookings = response.totalBookings {
                recommendations.append("📅 Total Bookings: \(bookings)")
            }
            if let revenue = response.totalRevenue {
                recommendations.append("💰 Total Revenue: $\(Int(revenue))")
            }

            if let analysis = response.analysis {
                if let recs = analysis.recommendations, !recs.isEmpty {
                    recommendations.append("\n💡 Price Recommendations:")
                    for rec in recs.prefix(5) {
                        let svc = rec.service ?? "Service"
                        let current = rec.currentPrice.map { "$\(Int($0))" } ?? ""
                        let suggested = rec.suggestedPrice.map { "$\(Int($0))" } ?? ""
                        let change = rec.changePercent.map { String(format: "%.1f%%", $0) } ?? ""
                        recommendations.append("  • \(svc): \(current) → \(suggested) (\(change))")
                        if let reason = rec.reason { recommendations.append("    \(reason)") }
                    }
                }

                if let dynamic = analysis.dynamicPricing {
                    recommendations.append("\n⏰ Dynamic Pricing Suggestions:")
                    if let peak = dynamic.peakHours, let surcharge = peak.surcharge {
                        recommendations.append("  • Peak hours: +\(surcharge)% surcharge")
                    }
                    if let offPeak = dynamic.offPeakHours, let discount = offPeak.discount {
                        recommendations.append("  • Off-peak hours: -\(discount)% discount")
                    }
                    if let peakDays = dynamic.peakDays, let days = peakDays.days {
                        recommendations.append("  • Peak days (\(days.joined(separator: ", "))): +\(peakDays.surcharge ?? 0)%")
                    }
                }

                if let insights = analysis.insights {
                    if let underpriced = insights.underpriced, !underpriced.isEmpty {
                        recommendations.append("\n📈 Underpriced: \(underpriced.joined(separator: ", "))")
                    }
                    if let opportunities = insights.opportunities, !opportunities.isEmpty {
                        recommendations.append("\n🎯 Opportunities:")
                        for opp in opportunities.prefix(3) {
                            recommendations.append("  • \(opp)")
                        }
                    }
                }
            }

            if let error = response.error {
                recommendations.append("Error: \(error)")
            }

            result = PriceResult(recommendations: recommendations.isEmpty ? ["No pricing data available."] : recommendations)
        }
        catch {
            print("Error: \(error)")
            result = PriceResult(recommendations: ["Error: \(error.localizedDescription)"])
        }
        isLoading = false
    }
}

// Existing ViewModels
struct EmptyRequest: Codable {}
struct AIInsights: Codable { let summary: String; let keyInsights: [String]; let recommendations: [String] }
struct BusinessInsightsAPIResponse: Codable {
    let success: Bool?
    let metrics: BusinessMetrics?
    let insights: BusinessAIInsights?
    let error: String?
}
struct BusinessMetrics: Codable {
    let revenue: RevenueMetric?
    let appointments: AppointmentMetric?
    let topServices: [String]?
    let clientRetention: Int?
    let averageTicket: Double?
}
struct RevenueMetric: Codable {
    let current: Double?
    let previous: Double?
}
struct AppointmentMetric: Codable {
    let current: Int?
    let previous: Int?
}
struct BusinessAIInsights: Codable {
    let summary: String?
    let keyInsights: [String]?
    let recommendations: [String]?
    let opportunities: [String]?
}

@MainActor class AIInsightsViewModel: ObservableObject {
    @Published var insights: AIInsights?
    @Published var isLoading = false
    func generateInsights() async {
        isLoading = true
        do {
            // API uses GET not POST
            let response: BusinessInsightsAPIResponse = try await APIClient.shared.get("/ai/business-insights")

            var summary = "📊 Business Analysis\n"
            var keyInsights: [String] = []
            var recommendations: [String] = []

            // Parse metrics
            if let metrics = response.metrics {
                if let revenue = metrics.revenue {
                    let current = revenue.current ?? 0
                    let previous = revenue.previous ?? 0
                    let change = previous > 0 ? ((current - previous) / previous) * 100 : 0
                    let arrow = change >= 0 ? "📈" : "📉"
                    summary += "\n💰 Revenue: $\(Int(current)) (\(arrow) \(String(format: "%.1f", change))%)"
                }
                if let appointments = metrics.appointments {
                    summary += "\n📅 Appointments: \(appointments.current ?? 0) this month"
                }
                if let retention = metrics.clientRetention {
                    summary += "\n👥 Client Retention: \(retention)%"
                }
                if let avgTicket = metrics.averageTicket {
                    summary += "\n🎫 Avg Ticket: $\(Int(avgTicket))"
                }
                if let topServices = metrics.topServices, !topServices.isEmpty {
                    keyInsights.append("⭐ Top Services: \(topServices.prefix(3).joined(separator: ", "))")
                }
            }

            // Parse AI insights
            if let aiInsights = response.insights {
                if let aiSummary = aiInsights.summary {
                    keyInsights.append(aiSummary)
                }
                if let insights = aiInsights.keyInsights {
                    keyInsights.append(contentsOf: insights.map { "💡 \($0)" })
                }
                if let recs = aiInsights.recommendations {
                    recommendations.append(contentsOf: recs.map { "✅ \($0)" })
                }
                if let opps = aiInsights.opportunities {
                    recommendations.append(contentsOf: opps.map { "🎯 \($0)" })
                }
            }

            insights = AIInsights(
                summary: summary,
                keyInsights: keyInsights.isEmpty ? ["Analysis complete."] : keyInsights,
                recommendations: recommendations.isEmpty ? ["No recommendations at this time."] : recommendations
            )
        } catch {
            print("Error: \(error)")
            insights = AIInsights(summary: "Error: \(error.localizedDescription)", keyInsights: [], recommendations: [])
        }
        isLoading = false
    }
}

// Message content returned by API
struct MessageContent: Decodable {
    let subject: String?
    let message: String?
    let smsVersion: String?
}
struct MessageAPIResponse: Decodable {
    let success: Bool
    let message: MessageContent?
    let error: String?
}

@MainActor class AIMessageGeneratorViewModel: ObservableObject {
    @Published var selectedType = "Reminder"
    @Published var selectedTone = "Professional"
    @Published var selectedLanguage = "English"
    @Published var generatedSubject: String?
    @Published var generatedEmail: String?
    @Published var generatedSMS: String?
    @Published var isLoading = false
    @Published var error: String?

    // Map UI display names to API values
    private let typeMapping: [String: String] = [
        "Reminder": "appointment_reminder",
        "Follow-up": "follow_up",
        "Promotion": "promotion",
        "Birthday": "birthday",
        "Thank You": "thank_you",
        "Reactivation": "reactivation"
    ]

    func generateMessage() async {
        isLoading = true
        error = nil
        generatedSubject = nil
        generatedEmail = nil
        generatedSMS = nil

        let apiType = typeMapping[selectedType] ?? "appointment_reminder"
        print("🔵 [MessageGenerator] Starting request...")

        do {
            struct Request: Encodable {
                let type: String
                let tone: String
                let language: String
            }

            let result: MessageAPIResponse = try await APIClient.shared.post(
                "/ai/message-generator",
                body: Request(
                    type: apiType,
                    tone: selectedTone.lowercased(),
                    language: selectedLanguage
                )
            )

            if result.success, let content = result.message {
                print("✅ [MessageGenerator] Success!")
                generatedSubject = content.subject
                generatedEmail = content.message
                generatedSMS = content.smsVersion
            } else if let apiError = result.error {
                self.error = apiError
            } else {
                self.error = "No message content received"
            }
        } catch {
            self.error = "Error: \(error.localizedDescription)"
            print("❌ [MessageGenerator] Error: \(error)")
        }
        isLoading = false
    }
}

// Review response content returned by API
struct ReviewResponseContent: Decodable {
    let response: String?
    let tone: String?
    let keyPoints: [String]?
}
struct ReviewAPIResponse: Decodable {
    let success: Bool
    let response: ReviewResponseContent?
    let error: String?
}

@MainActor class AIReviewResponseViewModel: ObservableObject {
    @Published var rating = 5
    @Published var customerName = ""
    @Published var reviewText = ""
    @Published var generatedResponse: String?
    @Published var isLoading = false

    func generateResponse() async {
        isLoading = true
        generatedResponse = nil

        do {
            struct Request: Encodable {
                let rating: Int
                let clientName: String
                let reviewText: String
            }

            let result: ReviewAPIResponse = try await APIClient.shared.post("/ai/review-response", body: Request(
                rating: rating,
                clientName: customerName.isEmpty ? "Valued Customer" : customerName,
                reviewText: reviewText
            ))

            if result.success, let content = result.response {
                var response = ""

                // Main response
                if let mainResponse = content.response {
                    response = mainResponse
                }

                // Add tone info
                if let tone = content.tone {
                    response += "\n\n💬 Tone: \(tone.capitalized)"
                }

                // Add key points
                if let keyPoints = content.keyPoints, !keyPoints.isEmpty {
                    response += "\n\n✅ Key Points:"
                    for point in keyPoints {
                        response += "\n• \(point)"
                    }
                }

                generatedResponse = response.isEmpty ? "Response generated successfully." : response
            } else if let error = result.error {
                generatedResponse = "Error: \(error)"
            } else {
                generatedResponse = "No response content received"
            }
        } catch {
            print("Error: \(error)")
            generatedResponse = "Error: \(error.localizedDescription)"
        }
        isLoading = false
    }
}

@MainActor class AITranslateViewModel: ObservableObject {
    @Published var targetLanguage = "Spanish"
    @Published var inputText = ""
    @Published var translatedText: String?
    @Published var isLoading = false

    func translate() async {
        isLoading = true
        do {
            struct Request: Encodable { let text: String; let targetLanguage: String }
            struct Response: Decodable {
                let success: Bool?
                let translation: String?
                let original: String?
                let targetLanguage: String?
                let detectedSourceLanguage: String?
                let error: String?
            }
            let result: Response = try await APIClient.shared.post("/ai/translate", body: Request(text: inputText, targetLanguage: targetLanguage.lowercased()))

            if let translation = result.translation {
                translatedText = translation
            } else if let error = result.error {
                translatedText = "Error: \(error)"
            } else {
                translatedText = "Translation failed."
            }
        } catch {
            print("Error: \(error)")
            translatedText = "Error: \(error.localizedDescription)"
        }
        isLoading = false
    }
}

#Preview {
    AIFeaturesView()
}
