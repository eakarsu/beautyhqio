import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:beautyhq_flutter/core/models/client.dart';
import 'package:beautyhq_flutter/core/services/client_service.dart';

final clientServiceProvider = Provider<ClientService>((ref) => ClientService());

final clientsProvider =
    StateNotifierProvider<ClientsNotifier, ClientsState>((ref) {
  return ClientsNotifier(ref.watch(clientServiceProvider));
});

class ClientsState {
  final List<Client> clients;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String searchQuery;
  final int currentPage;
  final bool hasMore;

  const ClientsState({
    this.clients = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.searchQuery = '',
    this.currentPage = 1,
    this.hasMore = true,
  });

  ClientsState copyWith({
    List<Client>? clients,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? searchQuery,
    int? currentPage,
    bool? hasMore,
  }) {
    return ClientsState(
      clients: clients ?? this.clients,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      searchQuery: searchQuery ?? this.searchQuery,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class ClientsNotifier extends StateNotifier<ClientsState> {
  final ClientService _service;

  ClientsNotifier(this._service) : super(const ClientsState()) {
    loadClients();
  }

  Future<void> loadClients({bool refresh = false}) async {
    if (refresh) {
      state = state.copyWith(
        isLoading: true,
        error: null,
        currentPage: 1,
        hasMore: true,
      );
    } else {
      state = state.copyWith(isLoading: true, error: null);
    }

    try {
      final clients = await _service.getClients(
        search: state.searchQuery.isEmpty ? null : state.searchQuery,
        page: 1,
      );

      state = state.copyWith(
        clients: clients,
        isLoading: false,
        currentPage: 1,
        hasMore: clients.length >= 20,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load clients',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final nextPage = state.currentPage + 1;
      final clients = await _service.getClients(
        search: state.searchQuery.isEmpty ? null : state.searchQuery,
        page: nextPage,
      );

      state = state.copyWith(
        clients: [...state.clients, ...clients],
        isLoadingMore: false,
        currentPage: nextPage,
        hasMore: clients.length >= 20,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void search(String query) {
    state = state.copyWith(searchQuery: query);
    loadClients(refresh: true);
  }

  void clearSearch() {
    state = state.copyWith(searchQuery: '');
    loadClients(refresh: true);
  }

  Future<void> refresh() async {
    await loadClients(refresh: true);
  }
}
