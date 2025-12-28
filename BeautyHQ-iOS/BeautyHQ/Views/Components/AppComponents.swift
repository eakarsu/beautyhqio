import SwiftUI

// MARK: - Avatar View
struct AppAvatar: View {
    let name: String
    var size: CGFloat = 44
    var showBorder: Bool = true

    private var initials: String {
        let parts = name.components(separatedBy: " ")
        let first = parts.first?.prefix(1) ?? ""
        let last = parts.count > 1 ? parts.last?.prefix(1) ?? "" : ""
        return "\(first)\(last)".uppercased()
    }

    var body: some View {
        ZStack {
            if showBorder {
                Circle()
                    .fill(LinearGradient.roseGoldGradient)
                    .frame(width: size + 4, height: size + 4)
            }

            Circle()
                .fill(Color.blushPink.opacity(0.3))
                .frame(width: size, height: size)
                .overlay(
                    Text(initials)
                        .font(.system(size: size * 0.35, weight: .semibold, design: .rounded))
                        .foregroundColor(.deepRose)
                )
        }
    }
}

// MARK: - Status Badge
struct AppStatusBadge: View {
    let text: String
    var status: String? = nil
    var color: Color? = nil

    private var badgeColor: Color {
        if let color = color { return color }
        if let status = status { return Color.statusColor(for: status) }
        return .roseGold
    }

    var body: some View {
        Text(text)
            .font(.appCaption)
            .foregroundColor(badgeColor)
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, Spacing.xs)
            .background(badgeColor.opacity(0.15))
            .clipShape(Capsule())
    }
}

// MARK: - Section Header
struct AppSectionHeader: View {
    let title: String
    var subtitle: String? = nil
    var action: (() -> Void)? = nil
    var actionLabel: String = "See All"

    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.appTitle3)
                    .foregroundColor(.charcoal)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
            }

            Spacer()

            if let action = action {
                Button(action: action) {
                    HStack(spacing: 4) {
                        Text(actionLabel)
                            .font(.appSubheadline)
                        Image(systemName: "chevron.right")
                            .font(.caption)
                    }
                    .foregroundColor(.roseGold)
                }
            }
        }
        .padding(.horizontal, Spacing.lg)
        .padding(.vertical, Spacing.sm)
    }
}

// MARK: - Stat Card
struct AppStatCard: View {
    let icon: String
    let value: String
    let label: String
    var gradient: LinearGradient = .roseGoldGradient
    var valueColor: Color = .charcoal

    var body: some View {
        VStack(spacing: Spacing.md) {
            Image(systemName: icon)
                .gradientIcon(size: 48, gradient: gradient)

            VStack(spacing: Spacing.xs) {
                Text(value)
                    .font(.appTitle2)
                    .foregroundColor(valueColor)

                Text(label)
                    .font(.appCaption)
                    .foregroundColor(.softGray)
            }
        }
        .frame(maxWidth: .infinity)
        .cardStyle(padding: Spacing.lg)
    }
}

// MARK: - Metric Row
struct AppMetricRow: View {
    let label: String
    let value: String
    var icon: String? = nil
    var valueColor: Color = .charcoal

    var body: some View {
        HStack {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.appSubheadline)
                    .foregroundColor(.roseGold)
                    .frame(width: 24)
            }

            Text(label)
                .font(.appSubheadline)
                .foregroundColor(.softGray)

            Spacer()

            Text(value)
                .font(.appHeadline)
                .foregroundColor(valueColor)
        }
    }
}

// MARK: - Empty State
struct AppEmptyState: View {
    let icon: String
    let title: String
    let message: String
    var action: (() -> Void)? = nil
    var actionLabel: String = "Get Started"

    var body: some View {
        VStack(spacing: Spacing.lg) {
            ZStack {
                Circle()
                    .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                    .frame(width: 100, height: 100)

                Image(systemName: icon)
                    .font(.system(size: 40, weight: .medium))
                    .foregroundStyle(LinearGradient.roseGoldGradient)
            }

            VStack(spacing: Spacing.sm) {
                Text(title)
                    .font(.appTitle3)
                    .foregroundColor(.charcoal)

                Text(message)
                    .font(.appSubheadline)
                    .foregroundColor(.softGray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, Spacing.xl)
            }

            if let action = action {
                Button(actionLabel, action: action)
                    .buttonStyle(.secondary)
                    .padding(.top, Spacing.sm)
            }
        }
        .padding(Spacing.xxl)
    }
}

// MARK: - Quick Action Button
struct AppQuickAction: View {
    let icon: String
    let label: String
    var color: Color = .roseGold
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: Spacing.sm) {
                Image(systemName: icon)
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(
                        LinearGradient(
                            colors: [color, color.opacity(0.8)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                    .shadow(color: color.opacity(0.3), radius: 8, x: 0, y: 4)

                Text(label)
                    .font(.appCaption)
                    .foregroundColor(.charcoal)
            }
        }
    }
}

// MARK: - Gradient Header
struct AppGradientHeader<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        content
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity)
            .background(
                LinearGradient.roseGoldGradient
                    .ignoresSafeArea(edges: .top)
            )
    }
}

// MARK: - List Row
struct AppListRow<Leading: View, Trailing: View>: View {
    @ViewBuilder let leading: Leading
    let title: String
    var subtitle: String? = nil
    @ViewBuilder let trailing: Trailing
    var showChevron: Bool = true

    var body: some View {
        HStack(spacing: Spacing.md) {
            leading

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.appHeadline)
                    .foregroundColor(.charcoal)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                }
            }

            Spacer()

            trailing

            if showChevron {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.softGray)
            }
        }
        .padding(.vertical, Spacing.md)
    }
}

// MARK: - Filter Chip
struct AppFilterChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.appSubheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(isSelected ? .white : .charcoal)
                .padding(.horizontal, Spacing.lg)
                .padding(.vertical, Spacing.sm)
                .background(
                    Group {
                        if isSelected {
                            LinearGradient.roseGoldGradient
                        } else {
                            Color.blushPink.opacity(0.3)
                        }
                    }
                )
                .clipShape(Capsule())
        }
    }
}

// MARK: - Progress Bar
struct AppProgressBar: View {
    let progress: Double
    var height: CGFloat = 8
    var gradient: LinearGradient = .roseGoldGradient

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(Color.blushPink.opacity(0.3))
                    .frame(height: height)

                RoundedRectangle(cornerRadius: height / 2)
                    .fill(gradient)
                    .frame(width: geometry.size.width * min(progress, 1.0), height: height)
            }
        }
        .frame(height: height)
    }
}

// MARK: - Divider
struct AppDivider: View {
    var color: Color = .blushPink.opacity(0.5)

    var body: some View {
        Rectangle()
            .fill(color)
            .frame(height: 1)
    }
}

// MARK: - Loading View
struct AppLoadingView: View {
    var body: some View {
        VStack(spacing: Spacing.md) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .roseGold))
                .scaleEffect(1.2)

            Text("Loading...")
                .font(.appSubheadline)
                .foregroundColor(.softGray)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Previews
#Preview("Components") {
    ScrollView {
        VStack(spacing: 24) {
            AppAvatar(name: "John Doe", size: 60)

            AppStatusBadge(text: "Confirmed", status: "CONFIRMED")

            AppSectionHeader(title: "Recent Activity", subtitle: "Last 7 days") {
                print("See all")
            }

            HStack {
                AppStatCard(icon: "dollarsign.circle.fill", value: "$1,234", label: "Revenue")
                AppStatCard(icon: "calendar", value: "24", label: "Bookings", gradient: .deepRoseGradient)
            }
            .padding(.horizontal)

            AppEmptyState(
                icon: "calendar.badge.plus",
                title: "No Appointments",
                message: "Your upcoming appointments will appear here"
            )

            HStack(spacing: 16) {
                AppQuickAction(icon: "plus", label: "New") {}
                AppQuickAction(icon: "calendar", label: "Book", color: .deepRose) {}
                AppQuickAction(icon: "person", label: "Client", color: .champagneGold) {}
            }
            .padding(.horizontal)

            AppProgressBar(progress: 0.65)
                .padding(.horizontal)

            Button("Primary Button") {}
                .buttonStyle(.primary)
                .padding(.horizontal)

            Button("Secondary Button") {}
                .buttonStyle(.secondary)
        }
        .padding(.vertical)
    }
    .background(Color.screenBackground)
}
