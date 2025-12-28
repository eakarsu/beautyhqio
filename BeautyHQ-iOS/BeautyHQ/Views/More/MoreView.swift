import SwiftUI

struct MoreView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Core Features
                    MoreSection(title: "Features") {
                        NavigationLink {
                            CalendarView()
                        } label: {
                            MoreMenuItem(icon: "calendar", title: "Calendar", gradient: .roseGoldGradient)
                        }

                        NavigationLink {
                            ServicesView()
                        } label: {
                            MoreMenuItem(icon: "scissors", title: "Services", gradient: .deepRoseGradient)
                        }

                        NavigationLink {
                            StaffView()
                        } label: {
                            MoreMenuItem(icon: "person.3.fill", title: "Staff", gradient: .goldGradient)
                        }

                        NavigationLink {
                            ProductsView()
                        } label: {
                            MoreMenuItem(icon: "cube.box.fill", title: "Products", gradient: .successGradient)
                        }
                    }

                    // Customer Engagement
                    MoreSection(title: "Customer Engagement") {
                        NavigationLink {
                            LoyaltyView()
                        } label: {
                            MoreMenuItem(icon: "star.circle.fill", title: "Loyalty Program", gradient: .goldGradient)
                        }

                        NavigationLink {
                            GiftCardsView()
                        } label: {
                            MoreMenuItem(icon: "giftcard.fill", title: "Gift Cards", gradient: .roseGoldGradient)
                        }

                        NavigationLink {
                            ReviewsView()
                        } label: {
                            MoreMenuItem(icon: "star.bubble.fill", title: "Reviews", gradient: .goldGradient)
                        }

                        NavigationLink {
                            MarketingView()
                        } label: {
                            MoreMenuItem(icon: "megaphone.fill", title: "Marketing", gradient: .deepRoseGradient)
                        }
                    }

                    // Business Tools
                    MoreSection(title: "Business Tools") {
                        NavigationLink {
                            ReportsView()
                        } label: {
                            MoreMenuItem(icon: "chart.bar.fill", title: "Reports", gradient: .roseGoldGradient)
                        }

                        NavigationLink {
                            BillingView()
                        } label: {
                            MoreMenuItem(icon: "creditcard.fill", title: "Billing", gradient: .successGradient)
                        }

                        NavigationLink {
                            SubscriptionsView()
                        } label: {
                            MoreMenuItem(icon: "rectangle.stack.fill", title: "Subscriptions", gradient: .deepRoseGradient)
                        }

                        NavigationLink {
                            SalesCRMView()
                        } label: {
                            MoreMenuItem(icon: "briefcase.fill", title: "Sales CRM", gradient: .roseGoldGradient)
                        }
                    }

                    // Marketplace
                    MoreSection(title: "Marketplace") {
                        NavigationLink {
                            MarketplaceView()
                        } label: {
                            MoreMenuItem(icon: "storefront.fill", title: "My Marketplace", gradient: .goldGradient)
                        }

                        NavigationLink {
                            MarketplaceLeadsView()
                        } label: {
                            MoreMenuItem(icon: "person.crop.circle.badge.plus", title: "Marketplace Leads", gradient: .deepRoseGradient)
                        }
                    }

                    // AI
                    MoreSection(title: "AI & Automation") {
                        NavigationLink {
                            AIFeaturesView()
                        } label: {
                            MoreMenuItem(icon: "sparkles", title: "AI Features", gradient: .roseGoldGradient)
                        }
                    }

                    // Settings
                    MoreSection(title: "Account") {
                        NavigationLink {
                            SettingsView()
                        } label: {
                            MoreMenuItem(icon: "gearshape.fill", title: "Settings", color: .softGray)
                        }
                    }
                }
                .padding(.vertical, Spacing.lg)
            }
            .background(Color.screenBackground)
            .navigationTitle("More")
        }
    }
}

struct MoreSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text(title)
                .font(.appTitle3)
                .foregroundColor(.charcoal)
                .padding(.horizontal, Spacing.lg)

            VStack(spacing: Spacing.sm) {
                content
            }
            .padding(.horizontal, Spacing.lg)
        }
    }
}

struct MoreMenuItem: View {
    let icon: String
    let title: String
    var gradient: LinearGradient?
    var color: Color?

    init(icon: String, title: String, gradient: LinearGradient) {
        self.icon = icon
        self.title = title
        self.gradient = gradient
        self.color = nil
    }

    init(icon: String, title: String, color: Color) {
        self.icon = icon
        self.title = title
        self.gradient = nil
        self.color = color
    }

    var body: some View {
        HStack(spacing: Spacing.md) {
            // Icon with gradient or solid background
            Group {
                if let gradient = gradient {
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 40, height: 40)
                        .background(gradient)
                } else if let color = color {
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 40, height: 40)
                        .background(color)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.sm, style: .continuous))
            .shadow(color: .roseGold.opacity(0.2), radius: 4, x: 0, y: 2)

            Text(title)
                .font(.appHeadline)
                .foregroundColor(.charcoal)

            Spacer()

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

#Preview {
    MoreView()
}
