import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:beautyhq_flutter/core/models/dashboard.dart';
import 'package:beautyhq_flutter/core/models/appointment.dart';
import 'package:beautyhq_flutter/core/services/dashboard_service.dart';

final dashboardServiceProvider =
    Provider<DashboardService>((ref) => DashboardService());

final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  return service.getStats();
});

final upcomingAppointmentsProvider =
    FutureProvider<List<Appointment>>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  return service.getUpcomingAppointments(limit: 5);
});

final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  return DashboardNotifier(ref.watch(dashboardServiceProvider));
});

class DashboardState {
  final DashboardStats? stats;
  final List<Appointment> upcomingAppointments;
  final bool isLoading;
  final String? error;

  const DashboardState({
    this.stats,
    this.upcomingAppointments = const [],
    this.isLoading = false,
    this.error,
  });

  DashboardState copyWith({
    DashboardStats? stats,
    List<Appointment>? upcomingAppointments,
    bool? isLoading,
    String? error,
  }) {
    return DashboardState(
      stats: stats ?? this.stats,
      upcomingAppointments: upcomingAppointments ?? this.upcomingAppointments,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class DashboardNotifier extends StateNotifier<DashboardState> {
  final DashboardService _service;

  DashboardNotifier(this._service) : super(const DashboardState()) {
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final stats = await _service.getStats();
      final appointments = await _service.getUpcomingAppointments(limit: 5);

      state = state.copyWith(
        stats: stats,
        upcomingAppointments: appointments,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load dashboard data',
      );
    }
  }

  Future<void> refresh() async {
    await loadDashboard();
  }
}
