import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

enum PaymentMethod {
  cash,
  card,
  giftCard,
  loyalty,
  other,
}

extension PaymentMethodExtension on PaymentMethod {
  String get displayName {
    switch (this) {
      case PaymentMethod.cash:
        return 'Cash';
      case PaymentMethod.card:
        return 'Card';
      case PaymentMethod.giftCard:
        return 'Gift Card';
      case PaymentMethod.loyalty:
        return 'Loyalty Points';
      case PaymentMethod.other:
        return 'Other';
    }
  }

  IconData get icon {
    switch (this) {
      case PaymentMethod.cash:
        return Icons.payments;
      case PaymentMethod.card:
        return Icons.credit_card;
      case PaymentMethod.giftCard:
        return Icons.card_giftcard;
      case PaymentMethod.loyalty:
        return Icons.stars;
      case PaymentMethod.other:
        return Icons.more_horiz;
    }
  }

  static PaymentMethod fromString(String value) {
    switch (value.toLowerCase()) {
      case 'cash':
        return PaymentMethod.cash;
      case 'card':
        return PaymentMethod.card;
      case 'gift_card':
      case 'giftcard':
        return PaymentMethod.giftCard;
      case 'loyalty':
        return PaymentMethod.loyalty;
      default:
        return PaymentMethod.other;
    }
  }
}

enum TransactionStatus {
  pending,
  completed,
  refunded,
  failed,
}

extension TransactionStatusExtension on TransactionStatus {
  String get displayName {
    switch (this) {
      case TransactionStatus.pending:
        return 'Pending';
      case TransactionStatus.completed:
        return 'Completed';
      case TransactionStatus.refunded:
        return 'Refunded';
      case TransactionStatus.failed:
        return 'Failed';
    }
  }

  Color get color {
    switch (this) {
      case TransactionStatus.pending:
        return Colors.orange;
      case TransactionStatus.completed:
        return Colors.green;
      case TransactionStatus.refunded:
        return Colors.blue;
      case TransactionStatus.failed:
        return Colors.red;
    }
  }

  static TransactionStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return TransactionStatus.pending;
      case 'completed':
        return TransactionStatus.completed;
      case 'refunded':
        return TransactionStatus.refunded;
      case 'failed':
        return TransactionStatus.failed;
      default:
        return TransactionStatus.pending;
    }
  }
}

class Transaction extends Equatable {
  final String id;
  final String businessId;
  final String? clientId;
  final String? clientName;
  final String? appointmentId;
  final double amount;
  final double? tip;
  final double? discount;
  final double total;
  final PaymentMethod paymentMethod;
  final TransactionStatus status;
  final String? notes;
  final List<TransactionItem>? items;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Transaction({
    required this.id,
    required this.businessId,
    this.clientId,
    this.clientName,
    this.appointmentId,
    required this.amount,
    this.tip,
    this.discount,
    required this.total,
    required this.paymentMethod,
    required this.status,
    this.notes,
    this.items,
    required this.createdAt,
    required this.updatedAt,
  });

  String get formattedTotal => '\$${total.toStringAsFixed(2)}';

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as String,
      businessId: json['businessId'] as String,
      clientId: json['clientId'] as String?,
      clientName: json['clientName'] as String?,
      appointmentId: json['appointmentId'] as String?,
      amount: (json['amount'] as num).toDouble(),
      tip: (json['tip'] as num?)?.toDouble(),
      discount: (json['discount'] as num?)?.toDouble(),
      total: (json['total'] as num).toDouble(),
      paymentMethod:
          PaymentMethodExtension.fromString(json['paymentMethod'] as String),
      status:
          TransactionStatusExtension.fromString(json['status'] as String),
      notes: json['notes'] as String?,
      items: json['items'] != null
          ? (json['items'] as List)
              .map((i) => TransactionItem.fromJson(i as Map<String, dynamic>))
              .toList()
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'businessId': businessId,
      'clientId': clientId,
      'clientName': clientName,
      'appointmentId': appointmentId,
      'amount': amount,
      'tip': tip,
      'discount': discount,
      'total': total,
      'paymentMethod': paymentMethod.name,
      'status': status.name,
      'notes': notes,
      'items': items?.map((i) => i.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        businessId,
        clientId,
        clientName,
        appointmentId,
        amount,
        tip,
        discount,
        total,
        paymentMethod,
        status,
        notes,
        items,
        createdAt,
        updatedAt,
      ];
}

class TransactionItem extends Equatable {
  final String id;
  final String name;
  final int quantity;
  final double price;
  final double total;

  const TransactionItem({
    required this.id,
    required this.name,
    required this.quantity,
    required this.price,
    required this.total,
  });

  factory TransactionItem.fromJson(Map<String, dynamic> json) {
    return TransactionItem(
      id: json['id'] as String,
      name: json['name'] as String,
      quantity: json['quantity'] as int,
      price: (json['price'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'quantity': quantity,
      'price': price,
      'total': total,
    };
  }

  @override
  List<Object?> get props => [id, name, quantity, price, total];
}
