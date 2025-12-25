import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:beautyhq_flutter/core/models/appointment.dart';
import 'package:beautyhq_flutter/core/services/appointment_service.dart';

final appointmentServiceProvider =
    Provider<AppointmentService>((ref) => AppointmentService());

final selectedDateProvider = StateProvider<DateTime>((ref) => DateTime.now());

final appointmentsProvider =
    StateNotifierProvider<AppointmentsNotifier, AppointmentsState>((ref) {
  return AppointmentsNotifier(ref.watch(appointmentServiceProvider));
});

class AppointmentsState {
  final List<Appointment> appointments;
  final bool isLoading;
  final String? error;
  final DateTime selectedDate;

  const AppointmentsState({
    this.appointments = const [],
    this.isLoading = false,
    this.error,
    DateTime? selectedDate,
  }) : selectedDate = selectedDate ?? const _DefaultDate();

  AppointmentsState copyWith({
    List<Appointment>? appointments,
    bool? isLoading,
    String? error,
    DateTime? selectedDate,
  }) {
    return AppointmentsState(
      appointments: appointments ?? this.appointments,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedDate: selectedDate ?? this.selectedDate,
    );
  }
}

class _DefaultDate implements DateTime {
  const _DefaultDate();

  @override
  dynamic noSuchMethod(Invocation invocation) => DateTime.now();
}

class AppointmentsNotifier extends StateNotifier<AppointmentsState> {
  final AppointmentService _service;

  AppointmentsNotifier(this._service)
      : super(AppointmentsState(selectedDate: DateTime.now())) {
    loadAppointments();
  }

  Future<void> loadAppointments({DateTime? date}) async {
    final targetDate = date ?? state.selectedDate;
    state = state.copyWith(isLoading: true, error: null, selectedDate: targetDate);

    try {
      final appointments = await _service.getAppointments(date: targetDate);
      state = state.copyWith(
        appointments: appointments,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load appointments',
      );
    }
  }

  void changeDate(DateTime date) {
    loadAppointments(date: date);
  }

  void goToNextDay() {
    final nextDay = state.selectedDate.add(const Duration(days: 1));
    changeDate(nextDay);
  }

  void goToPreviousDay() {
    final previousDay = state.selectedDate.subtract(const Duration(days: 1));
    changeDate(previousDay);
  }

  void goToToday() {
    changeDate(DateTime.now());
  }

  Future<bool> updateStatus(String id, AppointmentStatus status) async {
    final success = await _service.updateAppointmentStatus(id, status);
    if (success) {
      await loadAppointments();
    }
    return success;
  }

  Future<bool> cancelAppointment(String id, {String? reason}) async {
    final success = await _service.cancelAppointment(id, reason: reason);
    if (success) {
      await loadAppointments();
    }
    return success;
  }
}
