import 'package:beautyhq_flutter/core/models/dashboard.dart';
import 'package:beautyhq_flutter/core/models/appointment.dart';
import 'package:beautyhq_flutter/core/services/api_client.dart';

class DashboardService {
  final ApiClient _api = ApiClient();

  Future<DashboardStats> getStats() async {
    try {
      final response = await _api.get('/dashboard/stats');
      return DashboardStats.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      return DashboardStats.empty();
    }
  }

  Future<List<Appointment>> getUpcomingAppointments({int limit = 5}) async {
    try {
      final response = await _api.get(
        '/dashboard/upcoming-appointments',
        queryParameters: {'limit': limit},
      );

      final data = response.data as List;
      return data
          .map((item) => Appointment.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, double>> getRevenueChart({int days = 7}) async {
    try {
      final response = await _api.get(
        '/dashboard/revenue-chart',
        queryParameters: {'days': days},
      );

      final data = response.data as Map<String, dynamic>;
      return data.map((key, value) => MapEntry(key, (value as num).toDouble()));
    } catch (e) {
      return {};
    }
  }

  Future<Map<String, int>> getAppointmentsByStatus() async {
    try {
      final response = await _api.get('/dashboard/appointments-by-status');
      final data = response.data as Map<String, dynamic>;
      return data.map((key, value) => MapEntry(key, value as int));
    } catch (e) {
      return {};
    }
  }
}
