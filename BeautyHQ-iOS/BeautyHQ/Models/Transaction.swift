import Foundation
import SwiftUI

// Line item from backend
struct TransactionLineItem: Codable, Identifiable {
    var id: String { "\(type)-\(name)" }
    let type: String
    let name: String
    let quantity: Int
    let unitPrice: Double
    let totalPrice: Double

    // Custom decoder for Prisma Decimal fields
    enum CodingKeys: String, CodingKey {
        case type, name, quantity, unitPrice, totalPrice
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(String.self, forKey: .type)
        name = try container.decode(String.self, forKey: .name)
        quantity = try container.decode(Int.self, forKey: .quantity)
        unitPrice = try container.decodeFlexibleDouble(forKey: .unitPrice)
        totalPrice = try container.decodeFlexibleDouble(forKey: .totalPrice)
    }
}

struct Transaction: Codable, Identifiable {
    let id: String
    let transactionNumber: String?
    let date: Date?
    let createdAt: Date?
    let clientName: String?
    let staffName: String?
    let subtotal: Double?
    let taxAmount: Double?
    let tipAmount: Double?
    let discountAmount: Double?
    let totalAmount: Double?
    let paymentMethod: String?
    let status: TransactionStatus?
    let type: TransactionType?
    let lineItems: [TransactionLineItem]?

    // Custom decoder for Prisma Decimal fields
    enum CodingKeys: String, CodingKey {
        case id, transactionNumber, date, createdAt, clientName, staffName
        case subtotal, taxAmount, tipAmount, discountAmount, totalAmount
        case paymentMethod, status, type, lineItems
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        transactionNumber = try container.decodeIfPresent(String.self, forKey: .transactionNumber)
        date = try container.decodeIfPresent(Date.self, forKey: .date)
        createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt)
        clientName = try container.decodeIfPresent(String.self, forKey: .clientName)
        staffName = try container.decodeIfPresent(String.self, forKey: .staffName)
        subtotal = try container.decodeFlexibleDoubleIfPresent(forKey: .subtotal)
        taxAmount = try container.decodeFlexibleDoubleIfPresent(forKey: .taxAmount)
        tipAmount = try container.decodeFlexibleDoubleIfPresent(forKey: .tipAmount)
        discountAmount = try container.decodeFlexibleDoubleIfPresent(forKey: .discountAmount)
        totalAmount = try container.decodeFlexibleDoubleIfPresent(forKey: .totalAmount)
        paymentMethod = try container.decodeIfPresent(String.self, forKey: .paymentMethod)
        status = try container.decodeIfPresent(TransactionStatus.self, forKey: .status)
        type = try container.decodeIfPresent(TransactionType.self, forKey: .type)
        lineItems = try container.decodeIfPresent([TransactionLineItem].self, forKey: .lineItems)
    }

    // Convenience computed properties
    var total: Double { totalAmount ?? 0 }
    var tax: Double { taxAmount ?? 0 }
    var tip: Double { tipAmount ?? 0 }
    var discount: Double { discountAmount ?? 0 }

    var formattedTotal: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: total)) ?? "$\(total)"
    }

    var paymentMethodDisplay: String {
        paymentMethod ?? "Unknown"
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

enum TransactionItemType: String, Codable {
    case service = "SERVICE"
    case product = "PRODUCT"
    case giftCard = "GIFT_CARD"
}

struct CreateTransactionItem: Codable {
    let type: TransactionItemType
    let itemId: String
    let quantity: Int
    let unitPrice: Double
    let discount: Double?
}
