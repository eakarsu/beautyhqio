import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:beautyhq_flutter/core/models/transaction.dart';
import 'package:beautyhq_flutter/core/models/service.dart';
import 'package:beautyhq_flutter/core/services/transaction_service.dart';

final transactionServiceProvider =
    Provider<TransactionService>((ref) => TransactionService());

final posProvider = StateNotifierProvider<POSNotifier, POSState>((ref) {
  return POSNotifier(ref.watch(transactionServiceProvider));
});

final todayTransactionsProvider =
    FutureProvider<List<Transaction>>((ref) async {
  final service = ref.watch(transactionServiceProvider);
  return service.getTodayTransactions();
});

class CartItem {
  final Service service;
  final int quantity;

  const CartItem({
    required this.service,
    this.quantity = 1,
  });

  double get total => service.price * quantity;

  CartItem copyWith({
    Service? service,
    int? quantity,
  }) {
    return CartItem(
      service: service ?? this.service,
      quantity: quantity ?? this.quantity,
    );
  }
}

class POSState {
  final List<CartItem> cart;
  final List<Transaction> todayTransactions;
  final String? selectedClientId;
  final String? selectedClientName;
  final PaymentMethod selectedPaymentMethod;
  final double tip;
  final double discount;
  final bool isProcessing;
  final bool isLoading;
  final String? error;

  const POSState({
    this.cart = const [],
    this.todayTransactions = const [],
    this.selectedClientId,
    this.selectedClientName,
    this.selectedPaymentMethod = PaymentMethod.cash,
    this.tip = 0,
    this.discount = 0,
    this.isProcessing = false,
    this.isLoading = false,
    this.error,
  });

  double get subtotal => cart.fold(0, (sum, item) => sum + item.total);
  double get total => subtotal + tip - discount;
  int get itemCount => cart.fold(0, (sum, item) => sum + item.quantity);

  POSState copyWith({
    List<CartItem>? cart,
    List<Transaction>? todayTransactions,
    String? selectedClientId,
    String? selectedClientName,
    PaymentMethod? selectedPaymentMethod,
    double? tip,
    double? discount,
    bool? isProcessing,
    bool? isLoading,
    String? error,
  }) {
    return POSState(
      cart: cart ?? this.cart,
      todayTransactions: todayTransactions ?? this.todayTransactions,
      selectedClientId: selectedClientId ?? this.selectedClientId,
      selectedClientName: selectedClientName ?? this.selectedClientName,
      selectedPaymentMethod:
          selectedPaymentMethod ?? this.selectedPaymentMethod,
      tip: tip ?? this.tip,
      discount: discount ?? this.discount,
      isProcessing: isProcessing ?? this.isProcessing,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class POSNotifier extends StateNotifier<POSState> {
  final TransactionService _service;

  POSNotifier(this._service) : super(const POSState()) {
    loadTodayTransactions();
  }

  Future<void> loadTodayTransactions() async {
    state = state.copyWith(isLoading: true);
    try {
      final transactions = await _service.getTodayTransactions();
      state = state.copyWith(
        todayTransactions: transactions,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false);
    }
  }

  void addToCart(Service service) {
    final existingIndex =
        state.cart.indexWhere((item) => item.service.id == service.id);

    if (existingIndex >= 0) {
      final updatedCart = [...state.cart];
      updatedCart[existingIndex] = updatedCart[existingIndex].copyWith(
        quantity: updatedCart[existingIndex].quantity + 1,
      );
      state = state.copyWith(cart: updatedCart);
    } else {
      state = state.copyWith(
        cart: [...state.cart, CartItem(service: service)],
      );
    }
  }

  void removeFromCart(String serviceId) {
    state = state.copyWith(
      cart: state.cart.where((item) => item.service.id != serviceId).toList(),
    );
  }

  void updateQuantity(String serviceId, int quantity) {
    if (quantity <= 0) {
      removeFromCart(serviceId);
      return;
    }

    final updatedCart = state.cart.map((item) {
      if (item.service.id == serviceId) {
        return item.copyWith(quantity: quantity);
      }
      return item;
    }).toList();

    state = state.copyWith(cart: updatedCart);
  }

  void setClient(String? clientId, String? clientName) {
    state = state.copyWith(
      selectedClientId: clientId,
      selectedClientName: clientName,
    );
  }

  void setPaymentMethod(PaymentMethod method) {
    state = state.copyWith(selectedPaymentMethod: method);
  }

  void setTip(double tip) {
    state = state.copyWith(tip: tip);
  }

  void setDiscount(double discount) {
    state = state.copyWith(discount: discount);
  }

  void clearCart() {
    state = state.copyWith(
      cart: [],
      selectedClientId: null,
      selectedClientName: null,
      tip: 0,
      discount: 0,
    );
  }

  Future<bool> processPayment() async {
    if (state.cart.isEmpty) return false;

    state = state.copyWith(isProcessing: true, error: null);

    try {
      final items = state.cart
          .map((item) => TransactionItem(
                id: item.service.id,
                name: item.service.name,
                quantity: item.quantity,
                price: item.service.price,
                total: item.total,
              ))
          .toList();

      final transaction = await _service.createTransaction(
        amount: state.subtotal,
        paymentMethod: state.selectedPaymentMethod,
        clientId: state.selectedClientId,
        tip: state.tip,
        discount: state.discount,
        items: items,
      );

      if (transaction != null) {
        clearCart();
        await loadTodayTransactions();
        state = state.copyWith(isProcessing: false);
        return true;
      } else {
        state = state.copyWith(
          isProcessing: false,
          error: 'Failed to process payment',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Failed to process payment',
      );
      return false;
    }
  }
}
