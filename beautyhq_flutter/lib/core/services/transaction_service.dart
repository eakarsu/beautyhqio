import 'package:beautyhq_flutter/core/models/transaction.dart';
import 'package:beautyhq_flutter/core/services/api_client.dart';

class TransactionService {
  final ApiClient _api = ApiClient();

  Future<List<Transaction>> getTransactions({
    DateTime? startDate,
    DateTime? endDate,
    PaymentMethod? paymentMethod,
    TransactionStatus? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }
      if (paymentMethod != null) {
        queryParams['paymentMethod'] = paymentMethod.name;
      }
      if (status != null) {
        queryParams['status'] = status.name;
      }

      final response = await _api.get(
        '/transactions',
        queryParameters: queryParams,
      );

      final data = response.data as Map<String, dynamic>;
      final transactions =
          data['transactions'] as List? ?? data['data'] as List? ?? [];
      return transactions
          .map((item) => Transaction.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  Future<Transaction?> getTransaction(String id) async {
    try {
      final response = await _api.get('/transactions/$id');
      return Transaction.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  Future<Transaction?> createTransaction({
    required double amount,
    required PaymentMethod paymentMethod,
    String? clientId,
    String? appointmentId,
    double? tip,
    double? discount,
    String? notes,
    List<TransactionItem>? items,
  }) async {
    try {
      final total = amount + (tip ?? 0) - (discount ?? 0);

      final response = await _api.post(
        '/transactions',
        data: {
          'amount': amount,
          'total': total,
          'paymentMethod': paymentMethod.name,
          if (clientId != null) 'clientId': clientId,
          if (appointmentId != null) 'appointmentId': appointmentId,
          if (tip != null) 'tip': tip,
          if (discount != null) 'discount': discount,
          if (notes != null) 'notes': notes,
          if (items != null)
            'items': items.map((i) => i.toJson()).toList(),
        },
      );
      return Transaction.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  Future<bool> refundTransaction(String id, {String? reason}) async {
    try {
      await _api.post(
        '/transactions/$id/refund',
        data: {
          if (reason != null) 'reason': reason,
        },
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<List<Transaction>> getTodayTransactions() async {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));

    return getTransactions(
      startDate: startOfDay,
      endDate: endOfDay,
    );
  }

  Future<double> getTodayRevenue() async {
    final transactions = await getTodayTransactions();
    return transactions
        .where((t) => t.status == TransactionStatus.completed)
        .fold(0.0, (sum, t) => sum + t.total);
  }
}
