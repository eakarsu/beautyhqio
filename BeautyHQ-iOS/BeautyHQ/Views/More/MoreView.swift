import SwiftUI

struct MoreView: View {
    @EnvironmentObject var authManager: AuthManager

    /// Current user role
    private var userRole: UserRole? {
        authManager.currentUser?.role
    }

    /// Check if user has admin privileges (owner, manager, or platform admin)
    private var isAdmin: Bool {
        guard let role = userRole else { return false }
        return role == .platformAdmin || role == .owner || role == .manager
    }

    /// Check if user can manage services/products (owner, manager only - NOT receptionist)
    private var canManageServices: Bool {
        guard let role = userRole else { return false }
        return role == .platformAdmin || role == .owner || role == .manager
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Core Features
                    MoreSection(title: "Features") {
                        // Calendar - available to all
                        NavigationLink {
                            CalendarView()
                        } label: {
                            MoreMenuItem(icon: "calendar", title: "Calendar", gradient: .roseGoldGradient)
                        }

                        // Services - only for owner/manager (NOT receptionist/staff)
                        if canManageServices {
                            NavigationLink {
                                ServicesView()
                            } label: {
                                MoreMenuItem(icon: "scissors", title: "Services", gradient: .deepRoseGradient)
                            }
                        }

                        // Staff management - only for owner/manager
                        if isAdmin {
                            NavigationLink {
                                StaffView()
                            } label: {
                                MoreMenuItem(icon: "person.3.fill", title: "Staff", gradient: .goldGradient)
                            }
                        }

                        // Products - only for owner/manager (NOT receptionist/staff)
                        if canManageServices {
                            NavigationLink {
                                ProductsView()
                            } label: {
                                MoreMenuItem(icon: "cube.box.fill", title: "Products", gradient: .successGradient)
                            }
                        }
                    }

                    // Customer Engagement - only show for owner/manager
                    if isAdmin {
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
                    }

                    // Business Tools - only for admins
                    if isAdmin {
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

                        // Marketplace - only for admins
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
                    }

                    // AI - only for owner/manager
                    if isAdmin {
                        MoreSection(title: "AI & Automation") {
                            NavigationLink {
                                AIFeaturesView()
                            } label: {
                                MoreMenuItem(icon: "sparkles", title: "AI Features", gradient: .roseGoldGradient)
                            }
                        }
                    }

                    // Settings - available to all
                    MoreSection(title: "Account") {
                        NavigationLink {
                            SettingsView()
                        } label: {
                            MoreMenuItem(icon: "gearshape.fill", title: "Settings", color: .softGray)
                        }

                        // Logout button
                        Button {
                            showingLogoutAlert = true
                        } label: {
                            MoreMenuItem(icon: "rectangle.portrait.and.arrow.right", title: "Sign Out", color: .red)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("More")
            .alert("Sign Out", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    Task {
                        await authManager.logout()
                    }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }

    @State private var showingLogoutAlert = false
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
