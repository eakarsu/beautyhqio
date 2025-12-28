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

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: Spacing.md) {
                    ForEach(viewModel.messages) { message in
                        ChatBubble(message: message)
                    }
                }
                .padding(Spacing.lg)
            }

            // Input Area
            HStack(spacing: Spacing.md) {
                TextField("Ask anything about your salon...", text: $viewModel.inputText)
                    .textFieldStyle(.roundedBorder)

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

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "calendar.badge.clock",
                    title: "Smart Scheduling",
                    description: "Optimize your appointment scheduling with AI-powered recommendations"
                )

                Button {
                    Task { await viewModel.optimize() }
                } label: {
                    AIActionButton(text: "Optimize Schedule", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "Recommendations", content: result.suggestions.joined(separator: "\n\n"))
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

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "person.crop.circle.badge.checkmark",
                    title: "Client Insights",
                    description: "Understand your clients better with AI-powered analysis"
                )

                Button {
                    Task { await viewModel.analyze() }
                } label: {
                    AIActionButton(text: "Analyze Clients", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "Client Analysis", content: result.insights.joined(separator: "\n\n"))
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Revenue Predictor View
struct AIRevenuePredictorView: View {
    @StateObject private var viewModel = AIRevenuePredictorViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "chart.line.uptrend.xyaxis.circle.fill",
                    title: "Revenue Predictor",
                    description: "Forecast your revenue and identify growth opportunities"
                )

                Button {
                    Task { await viewModel.predict() }
                } label: {
                    AIActionButton(text: "Predict Revenue", isLoading: viewModel.isLoading)
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

                Button {
                    Task { await viewModel.predict() }
                } label: {
                    AIActionButton(text: "Analyze Appointments", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "At-Risk Appointments", content: result.predictions.joined(separator: "\n\n"))
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

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "sparkles.rectangle.stack.fill",
                    title: "Style Recommendations",
                    description: "Get personalized style suggestions for your clients"
                )

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

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
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

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "arrow.up.circle.fill",
                    title: "Upsell Suggestions",
                    description: "Get AI-powered recommendations to increase revenue"
                )

                Button {
                    Task { await viewModel.getSuggestions() }
                } label: {
                    AIActionButton(text: "Get Suggestions", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "Upsell Opportunities", content: result.suggestions.joined(separator: "\n\n"))
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Inventory Forecast View
struct AIInventoryForecastView: View {
    @StateObject private var viewModel = AIInventoryForecastViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "cube.box.fill",
                    title: "Inventory Forecast",
                    description: "Predict product demand and optimize stock levels"
                )

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

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "person.crop.circle.badge.plus",
                    title: "Client Reactivation",
                    description: "Generate win-back campaigns for inactive clients"
                )

                Button {
                    Task { await viewModel.generate() }
                } label: {
                    AIActionButton(text: "Generate Campaign", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal, Spacing.lg)

                if let result = viewModel.result {
                    AIResultCard(title: "Win-Back Campaign", content: result.campaign, showCopy: true)
                        .padding(.horizontal, Spacing.lg)
                }
            }
            .padding(.vertical, Spacing.lg)
        }
    }
}

// MARK: - Price Optimizer View
struct AIPriceOptimizerView: View {
    @StateObject private var viewModel = AIPriceOptimizerViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                AIFeatureHeader(
                    icon: "dollarsign.circle.fill",
                    title: "Price Optimizer",
                    description: "Get AI-powered pricing recommendations"
                )

                Button {
                    Task { await viewModel.optimize() }
                } label: {
                    AIActionButton(text: "Optimize Prices", isLoading: viewModel.isLoading)
                }
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

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
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

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
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

                if let email = viewModel.generatedEmail {
                    AIResultCard(title: "Email Version", content: email, showCopy: true)
                        .padding(.horizontal, Spacing.lg)
                }

                if let sms = viewModel.generatedSMS {
                    AIResultCard(title: "SMS Version", content: sms, showCopy: true)
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

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
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

        do {
            struct ChatRequest: Encodable { let message: String }
            struct ChatResponse: Decodable { let response: String }
            let result: ChatResponse = try await APIClient.shared.post("/ai/chat", body: ChatRequest(message: userMessage))
            messages.append(ChatMessage(content: result.response, isUser: false))
        } catch {
            messages.append(ChatMessage(content: "Sorry, I couldn't process that request.", isUser: false))
        }
        isLoading = false
    }
}

struct SchedulingResult: Codable { let suggestions: [String] }
@MainActor class AISmartSchedulingViewModel: ObservableObject {
    @Published var result: SchedulingResult?
    @Published var isLoading = false
    func optimize() async {
        isLoading = true
        do { result = try await APIClient.shared.post("/ai/smart-scheduling", body: EmptyRequest()) }
        catch { print("Error: \(error)") }
        isLoading = false
    }
}

struct ClientInsightsResult: Codable { let insights: [String] }
@MainActor class AIClientInsightsViewModel: ObservableObject {
    @Published var result: ClientInsightsResult?
    @Published var isLoading = false
    func analyze() async {
        isLoading = true
        do { result = try await APIClient.shared.post("/ai/client-insights", body: EmptyRequest()) }
        catch { print("Error: \(error)") }
        isLoading = false
    }
}

struct RevenuePredictorResult: Codable {
    let predictedRevenue: String
    let period: String
    let opportunities: [String]
}
@MainActor class AIRevenuePredictorViewModel: ObservableObject {
    @Published var result: RevenuePredictorResult?
    @Published var isLoading = false
    func predict() async {
        isLoading = true
        do { result = try await APIClient.shared.post("/ai/revenue-predictor", body: EmptyRequest()) }
        catch { print("Error: \(error)") }
        isLoading = false
    }
}

struct NoShowResult: Codable { let predictions: [String] }
@MainActor class AINoShowPredictionViewModel: ObservableObject {
    @Published var result: NoShowResult?
    @Published var isLoading = false
    func predict() async {
        isLoading = true
        do { result = try await APIClient.shared.post("/ai/no-show-prediction", body: EmptyRequest()) }
        catch { print("Error: \(error)") }
        isLoading = false
    }
}

struct StyleResult: Codable { let recommendations: [String] }
@MainActor class AIStyleRecommendationViewModel: ObservableObject {
    @Published var result: StyleResult?
    @Published var isLoading = false
    func recommend() async {
        isLoading = true
        do { result = try await APIClient.shared.post("/ai/style-recommendation", body: EmptyRequest()) }
        catch { print("Error: \(error)") }
        isLoading = false
    }
}

struct SocialMediaResult: Codable { let content: String; let hashtags: [String] }
@MainActor class AISocialMediaViewModel: ObservableObject {
    @Published var selectedPlatform = "Instagram"
    @Published var selectedType = "Promotion"
    @Published var result: SocialMediaResult?
    @Published var isLoading = false
    func generate() async {
        isLoading = true
        do {
            struct Request: Encodable { let platform: String; let postType: String }
            result = try await APIClient.shared.post("/ai/social-media", body: Request(platform: selectedPlatform, postType: selectedType))
        } catch { print("Error: \(error)") }
        isLoading = false
    }
}

struct UpsellResult: Codable { let suggestions: [String] }
@MainActor class AIUpsellSuggestionsViewModel: ObservableObject {
    @Published var result: UpsellResult?
    @Published var isLoading = false
    func getSuggestions() async {
        isLoading = true
        do { result = try await APIClient.shared.post("/ai/upsell-suggestions", body: EmptyRequest()) }
        catch { print("Error: \(error)") }
        isLoading = false
    }
}

struct InventoryResult: Codable { let recommendations: [String] }
@MainActor class AIInventoryForecastViewModel: ObservableObject {
    @Published var result: InventoryResult?
    @Published var isLoading = false
    func forecast() async {
        isLoading = true
        do { result = try await APIClient.shared.post("/ai/inventory-forecast", body: EmptyRequest()) }
        catch { print("Error: \(error)") }
        isLoading = false
    }
}

struct ReactivationResult: Codable { let campaign: String }
@MainActor class AIReactivationViewModel: ObservableObject {
    @Published var result: ReactivationResult?
    @Published var isLoading = false
    func generate() async {
        isLoading = true
        do { result = try await APIClient.shared.post("/ai/reactivation-campaigns", body: EmptyRequest()) }
        catch { print("Error: \(error)") }
        isLoading = false
    }
}

struct PriceResult: Codable { let recommendations: [String] }
@MainActor class AIPriceOptimizerViewModel: ObservableObject {
    @Published var result: PriceResult?
    @Published var isLoading = false
    func optimize() async {
        isLoading = true
        do { result = try await APIClient.shared.post("/ai/price-optimizer", body: EmptyRequest()) }
        catch { print("Error: \(error)") }
        isLoading = false
    }
}

// Existing ViewModels
struct EmptyRequest: Codable {}
struct AIInsights: Codable { let summary: String; let keyInsights: [String]; let recommendations: [String] }

@MainActor class AIInsightsViewModel: ObservableObject {
    @Published var insights: AIInsights?
    @Published var isLoading = false
    func generateInsights() async {
        isLoading = true
        do { insights = try await APIClient.shared.post("/ai/business-insights", body: EmptyRequest()) }
        catch { print("Error: \(error)") }
        isLoading = false
    }
}

@MainActor class AIMessageGeneratorViewModel: ObservableObject {
    @Published var selectedType = "Reminder"
    @Published var selectedTone = "Professional"
    @Published var selectedLanguage = "English"
    @Published var generatedEmail: String?
    @Published var generatedSMS: String?
    @Published var isLoading = false

    func generateMessage() async {
        isLoading = true
        do {
            struct Request: Encodable { let messageType: String; let tone: String; let language: String }
            struct Response: Decodable { let email: String?; let sms: String? }
            let result: Response = try await APIClient.shared.post("/ai/message-generator", body: Request(messageType: selectedType.lowercased(), tone: selectedTone.lowercased(), language: selectedLanguage.lowercased()))
            generatedEmail = result.email
            generatedSMS = result.sms
        } catch { print("Error: \(error)") }
        isLoading = false
    }
}

@MainActor class AIReviewResponseViewModel: ObservableObject {
    @Published var rating = 5
    @Published var customerName = ""
    @Published var reviewText = ""
    @Published var generatedResponse: String?
    @Published var isLoading = false

    func generateResponse() async {
        isLoading = true
        do {
            struct Request: Encodable { let rating: Int; let customerName: String; let reviewText: String }
            struct Response: Decodable { let response: String }
            let result: Response = try await APIClient.shared.post("/ai/review-response", body: Request(rating: rating, customerName: customerName, reviewText: reviewText))
            generatedResponse = result.response
        } catch { print("Error: \(error)") }
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
            struct Response: Decodable { let translation: String }
            let result: Response = try await APIClient.shared.post("/ai/translate", body: Request(text: inputText, targetLanguage: targetLanguage.lowercased()))
            translatedText = result.translation
        } catch { print("Error: \(error)") }
        isLoading = false
    }
}

#Preview {
    AIFeaturesView()
}
