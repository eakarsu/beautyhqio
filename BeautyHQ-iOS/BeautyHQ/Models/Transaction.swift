import Foundation
import SwiftUI

struct Transaction: Codable, Identifiable {
    let id: String
    let businessId: String
    let clientId: String?
    let staffId: String?
    let appointmentId: String?
    let type: TransactionType
    let status: TransactionStatus
    let subtotal: Double
    let tax: Double
    let discount: Double
    let tip: Double
    let total: Double
    let paymentMethod: PaymentMethod
    let items: [TransactionItem]
    let createdAt: Date
    let updatedAt: Date

    var formattedTotal: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: total)) ?? "$\(total)"
    }
}

struct TransactionItem: Codable, Identifiable {
    let id: String
    let transactionId: String
    let type: ItemType
    let itemId: String
    let name: String
    let quantity: Int
    let unitPrice: Double
    let discount: Double
    let total: Double

    enum ItemType: String, Codable {
        case service = "SERVICE"
        case product = "PRODUCT"
        case giftCard = "GIFT_CARD"
    }
}

enum TransactionType: String, Codable, CaseIterable {
    case sale = "SALE"
    case refund = "REFUND"
    case void = "VOID"
    case adjustment = "ADJUSTMENT"

    var displayName: String {
        rawValue.capitalized
    }

    var color: Color {
        switch self {
        case .sale: return .green
        case .refund: return .orange
        case .void: return .red
        case .adjustment: return .gray
        }
    }

    var icon: String {
        switch self {
        case .sale: return "cart.fill"
        case .refund: return "arrow.uturn.backward"
        case .void: return "xmark.circle.fill"
        case .adjustment: return "arrow.left.arrow.right"
        }
    }
}

enum TransactionStatus: String, Codable {
    case pending = "PENDING"
    case completed = "COMPLETED"
    case failed = "FAILED"
    case refunded = "REFUNDED"
}

enum PaymentMethod: String, Codable, CaseIterable {
    case cash = "CASH"
    case card = "CARD"
    case applePay = "APPLE_PAY"
    case googlePay = "GOOGLE_PAY"
    case giftCard = "GIFT_CARD"
    case points = "POINTS"
    case split = "SPLIT"

    var displayName: String {
        switch self {
        case .cash: return "Cash"
        case .card: return "Card"
        case .applePay: return "Apple Pay"
        case .googlePay: return "Google Pay"
        case .giftCard: return "Gift Card"
        case .points: return "Points"
        case .split: return "Split"
        }
    }

    var icon: String {
        switch self {
        case .cash: return "banknote.fill"
        case .card: return "creditcard.fill"
        case .applePay: return "apple.logo"
        case .googlePay: return "g.circle.fill"
        case .giftCard: return "giftcard.fill"
        case .points: return "star.fill"
        case .split: return "rectangle.split.2x1.fill"
        }
    }
}

// MARK: - Create Transaction
struct CreateTransactionRequest: Codable {
    let clientId: String?
    let staffId: String?
    let appointmentId: String?
    let items: [CreateTransactionItem]
    let paymentMethod: PaymentMethod
    let tip: Double?
    let discount: Double?
    let notes: String?
}

struct CreateTransactionItem: Codable {
    let type: TransactionItem.ItemType
    let itemId: String
    let quantity: Int
    let unitPrice: Double
    let discount: Double?
}
