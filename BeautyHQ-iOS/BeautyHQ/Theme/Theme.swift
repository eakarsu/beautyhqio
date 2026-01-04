import SwiftUI

// MARK: - Color Palette
extension Color {
    // Primary Colors
    static let roseGold = Color(hex: "B76E79")
    static let blushPink = Color(hex: "F4C2C2")
    static let deepRose = Color(hex: "8B4557")
    static let champagneGold = Color(hex: "D4AF37")
    static let cream = Color(hex: "FFF8F0")

    // Text Colors
    static let charcoal = Color(hex: "2C2C2C")
    static let softGray = Color(hex: "8E8E93")

    // Semantic Colors
    static let success = Color(hex: "34C759")
    static let warning = Color(hex: "FF9500")
    static let error = Color(hex: "FF3B30")

    // Background Colors
    static let cardBackground = Color(.systemBackground)
    static let screenBackground = Color(hex: "FAF7F5")

    // Hex initializer
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Gradients
extension LinearGradient {
    static let roseGoldGradient = LinearGradient(
        colors: [.roseGold, .blushPink],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let deepRoseGradient = LinearGradient(
        colors: [.deepRose, .roseGold],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let goldGradient = LinearGradient(
        colors: [.champagneGold, Color(hex: "E8C872")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let subtleGradient = LinearGradient(
        colors: [.cream, .white],
        startPoint: .top,
        endPoint: .bottom
    )

    static let successGradient = LinearGradient(
        colors: [.success, Color(hex: "32D74B")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

// MARK: - Spacing
enum Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
}

// MARK: - Corner Radius
enum CornerRadius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let full: CGFloat = 100
}

// MARK: - Shadows
struct AppShadow {
    let color: Color
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat

    static let soft = AppShadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 4)
    static let medium = AppShadow(color: .black.opacity(0.12), radius: 12, x: 0, y: 6)
    static let prominent = AppShadow(color: .black.opacity(0.16), radius: 20, x: 0, y: 10)
    static let glow = AppShadow(color: .roseGold.opacity(0.3), radius: 12, x: 0, y: 4)
}

// MARK: - Typography
extension Font {
    static let appLargeTitle = Font.system(size: 34, weight: .bold, design: .rounded)
    static let appTitle = Font.system(size: 28, weight: .bold, design: .rounded)
    static let appTitle2 = Font.system(size: 22, weight: .semibold, design: .rounded)
    static let appTitle3 = Font.system(size: 20, weight: .semibold, design: .rounded)
    static let appHeadline = Font.system(size: 17, weight: .semibold, design: .rounded)
    static let appBody = Font.system(size: 17, weight: .regular, design: .rounded)
    static let appCallout = Font.system(size: 16, weight: .regular, design: .rounded)
    static let appSubheadline = Font.system(size: 15, weight: .regular, design: .rounded)
    static let appFootnote = Font.system(size: 13, weight: .regular, design: .rounded)
    static let appCaption = Font.system(size: 12, weight: .medium, design: .rounded)
    static let appCaption2 = Font.system(size: 11, weight: .regular, design: .rounded)
}

// MARK: - View Modifiers

struct CardStyle: ViewModifier {
    var padding: CGFloat = Spacing.lg
    var cornerRadius: CGFloat = CornerRadius.lg
    var shadow: AppShadow = .soft

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
    }
}

struct GradientCardStyle: ViewModifier {
    var gradient: LinearGradient = .roseGoldGradient
    var padding: CGFloat = Spacing.lg
    var cornerRadius: CGFloat = CornerRadius.lg
    var shadow: AppShadow = .glow

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(gradient)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
    }
}

struct GlassStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
    }
}

extension View {
    func cardStyle(padding: CGFloat = Spacing.lg, cornerRadius: CGFloat = CornerRadius.lg, shadow: AppShadow = .soft) -> some View {
        modifier(CardStyle(padding: padding, cornerRadius: cornerRadius, shadow: shadow))
    }

    func gradientCardStyle(gradient: LinearGradient = .roseGoldGradient, padding: CGFloat = Spacing.lg) -> some View {
        modifier(GradientCardStyle(gradient: gradient, padding: padding))
    }

    func glassStyle() -> some View {
        modifier(GlassStyle())
    }

    func appShadow(_ shadow: AppShadow = .soft) -> some View {
        self.shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
    }
}

// MARK: - Button Styles

struct PrimaryButtonStyle: ButtonStyle {
    var isFullWidth: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.appHeadline)
            .foregroundColor(.white)
            .frame(maxWidth: isFullWidth ? .infinity : nil)
            .padding(.vertical, Spacing.lg)
            .padding(.horizontal, Spacing.xl)
            .background(LinearGradient.roseGoldGradient)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
            .shadow(color: Color.roseGold.opacity(0.4), radius: 8, x: 0, y: 4)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.appHeadline)
            .foregroundColor(.roseGold)
            .padding(.vertical, Spacing.md)
            .padding(.horizontal, Spacing.lg)
            .background(Color.roseGold.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
    }
}

struct GhostButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.appSubheadline)
            .foregroundColor(.roseGold)
            .scaleEffect(configuration.isPressed ? 0.95 : 1)
            .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PrimaryButtonStyle {
    static var primary: PrimaryButtonStyle { PrimaryButtonStyle() }
    static var primaryCompact: PrimaryButtonStyle { PrimaryButtonStyle(isFullWidth: false) }
}

extension ButtonStyle where Self == SecondaryButtonStyle {
    static var secondary: SecondaryButtonStyle { SecondaryButtonStyle() }
}

extension ButtonStyle where Self == GhostButtonStyle {
    static var ghost: GhostButtonStyle { GhostButtonStyle() }
}

// MARK: - Icon Styles

struct GradientIconStyle: ViewModifier {
    var size: CGFloat = 44
    var gradient: LinearGradient = .roseGoldGradient

    func body(content: Content) -> some View {
        content
            .font(.system(size: size * 0.5, weight: .semibold))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(gradient)
            .clipShape(RoundedRectangle(cornerRadius: size * 0.25, style: .continuous))
    }
}

extension View {
    func gradientIcon(size: CGFloat = 44, gradient: LinearGradient = .roseGoldGradient) -> some View {
        modifier(GradientIconStyle(size: size, gradient: gradient))
    }
}

// MARK: - Status Colors
extension Color {
    static func statusColor(for status: String) -> Color {
        switch status.uppercased() {
        case "CONFIRMED", "COMPLETED", "ACTIVE", "PAID":
            return .success
        case "PENDING", "SCHEDULED", "TRIALING":
            return .roseGold
        case "CANCELLED", "FAILED", "PAST_DUE":
            return .error
        case "IN_SERVICE", "CHECKED_IN":
            return .champagneGold
        case "NO_SHOW":
            return .warning
        default:
            return .softGray
        }
    }
}
