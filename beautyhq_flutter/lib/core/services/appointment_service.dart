import 'package:beautyhq_flutter/core/models/appointment.dart';
import 'package:beautyhq_flutter/core/services/api_client.dart';

class AppointmentService {
  final ApiClient _api = ApiClient();

  Future<List<Appointment>> getAppointments({
    DateTime? date,
    DateTime? startDate,
    DateTime? endDate,
    AppointmentStatus? status,
    String? clientId,
    String? staffId,
  }) async {
    try {
      final queryParams = <String, dynamic>{};

      if (date != null) {
        queryParams['date'] = date.toIso8601String().split('T')[0];
      }
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }
      if (status != null) {
        queryParams['status'] = status.name;
      }
      if (clientId != null) {
        queryParams['clientId'] = clientId;
      }
      if (staffId != null) {
        queryParams['staffId'] = staffId;
      }

      final response = await _api.get(
        '/appointments',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      final data = response.data as List;
      return data
          .map((item) => Appointment.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  Future<Appointment?> getAppointment(String id) async {
    try {
      final response = await _api.get('/appointments/$id');
      return Appointment.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  Future<Appointment?> createAppointment({
    required String clientId,
    required DateTime startTime,
    required List<String> serviceIds,
    String? staffId,
    String? notes,
  }) async {
    try {
      final response = await _api.post(
        '/appointments',
        data: {
          'clientId': clientId,
          'startTime': startTime.toIso8601String(),
          'serviceIds': serviceIds,
          if (staffId != null) 'staffId': staffId,
          if (notes != null) 'notes': notes,
        },
      );
      return Appointment.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  Future<Appointment?> updateAppointment(
    String id, {
    DateTime? startTime,
    List<String>? serviceIds,
    String? staffId,
    String? notes,
  }) async {
    try {
      final response = await _api.patch(
        '/appointments/$id',
        data: {
          if (startTime != null) 'startTime': startTime.toIso8601String(),
          if (serviceIds != null) 'serviceIds': serviceIds,
          if (staffId != null) 'staffId': staffId,
          if (notes != null) 'notes': notes,
        },
      );
      return Appointment.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  Future<bool> updateAppointmentStatus(
    String id,
    AppointmentStatus status,
  ) async {
    try {
      await _api.patch(
        '/appointments/$id/status',
        data: {'status': status.name},
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> cancelAppointment(String id, {String? reason}) async {
    try {
      await _api.post(
        '/appointments/$id/cancel',
        data: {
          if (reason != null) 'reason': reason,
        },
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> deleteAppointment(String id) async {
    try {
      await _api.delete('/appointments/$id');
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<List<Appointment>> getTodayAppointments() async {
    final now = DateTime.now();
    return getAppointments(date: now);
  }

  Future<List<Appointment>> getUpcomingAppointments({int limit = 10}) async {
    try {
      final response = await _api.get(
        '/appointments/upcoming',
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
}
