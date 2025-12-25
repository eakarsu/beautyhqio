import 'package:beautyhq_flutter/core/models/client.dart';
import 'package:beautyhq_flutter/core/models/appointment.dart';
import 'package:beautyhq_flutter/core/services/api_client.dart';

class ClientService {
  final ApiClient _api = ApiClient();

  Future<List<Client>> getClients({
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final response = await _api.get(
        '/clients',
        queryParameters: queryParams,
      );

      final data = response.data as Map<String, dynamic>;
      final clients = data['clients'] as List? ?? data['data'] as List? ?? [];
      return clients
          .map((item) => Client.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  Future<Client?> getClient(String id) async {
    try {
      final response = await _api.get('/clients/$id');
      return Client.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  Future<Client?> createClient({
    required String firstName,
    required String lastName,
    String? email,
    String? phone,
    String? notes,
    DateTime? birthday,
    List<String>? tags,
  }) async {
    try {
      final response = await _api.post(
        '/clients',
        data: {
          'firstName': firstName,
          'lastName': lastName,
          if (email != null) 'email': email,
          if (phone != null) 'phone': phone,
          if (notes != null) 'notes': notes,
          if (birthday != null) 'birthday': birthday.toIso8601String(),
          if (tags != null) 'tags': tags,
        },
      );
      return Client.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  Future<Client?> updateClient(
    String id, {
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? notes,
    DateTime? birthday,
    List<String>? tags,
  }) async {
    try {
      final response = await _api.patch(
        '/clients/$id',
        data: {
          if (firstName != null) 'firstName': firstName,
          if (lastName != null) 'lastName': lastName,
          if (email != null) 'email': email,
          if (phone != null) 'phone': phone,
          if (notes != null) 'notes': notes,
          if (birthday != null) 'birthday': birthday.toIso8601String(),
          if (tags != null) 'tags': tags,
        },
      );
      return Client.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  Future<bool> deleteClient(String id) async {
    try {
      await _api.delete('/clients/$id');
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<List<Appointment>> getClientAppointments(
    String clientId, {
    int limit = 10,
  }) async {
    try {
      final response = await _api.get(
        '/clients/$clientId/appointments',
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

  Future<bool> addLoyaltyPoints(String clientId, int points) async {
    try {
      await _api.post(
        '/clients/$clientId/loyalty',
        data: {'points': points},
      );
      return true;
    } catch (e) {
      return false;
    }
  }
}
