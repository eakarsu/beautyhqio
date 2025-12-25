import 'package:beautyhq_flutter/core/models/user.dart';
import 'package:beautyhq_flutter/core/services/api_client.dart';

class AuthService {
  final ApiClient _api = ApiClient();

  Future<AuthResult> login(String email, String password) async {
    try {
      final response = await _api.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final user = User.fromJson(data['user'] as Map<String, dynamic>);
      final token = data['token'] as String;
      final refreshToken = data['refreshToken'] as String;

      await _api.setTokens(token, refreshToken);

      return AuthResult.success(user);
    } catch (e) {
      return AuthResult.failure(_parseError(e));
    }
  }

  Future<AuthResult> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    String? businessName,
  }) async {
    try {
      final response = await _api.post(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'firstName': firstName,
          'lastName': lastName,
          'phone': phone,
          'businessName': businessName,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final user = User.fromJson(data['user'] as Map<String, dynamic>);
      final token = data['token'] as String;
      final refreshToken = data['refreshToken'] as String;

      await _api.setTokens(token, refreshToken);

      return AuthResult.success(user);
    } catch (e) {
      return AuthResult.failure(_parseError(e));
    }
  }

  Future<bool> forgotPassword(String email) async {
    try {
      await _api.post(
        '/auth/forgot-password',
        data: {'email': email},
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<User?> getCurrentUser() async {
    try {
      final token = await _api.getToken();
      if (token == null) return null;

      final response = await _api.get('/auth/me');
      final data = response.data as Map<String, dynamic>;
      return User.fromJson(data);
    } catch (e) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } finally {
      await _api.clearTokens();
    }
  }

  Future<bool> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    try {
      await _api.patch(
        '/auth/profile',
        data: {
          if (firstName != null) 'firstName': firstName,
          if (lastName != null) 'lastName': lastName,
          if (phone != null) 'phone': phone,
        },
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> changePassword(String currentPassword, String newPassword) async {
    try {
      await _api.post(
        '/auth/change-password',
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  String _parseError(dynamic error) {
    if (error is Exception) {
      return error.toString();
    }
    return 'An error occurred. Please try again.';
  }
}

class AuthResult {
  final User? user;
  final String? error;
  final bool isSuccess;

  const AuthResult._({
    this.user,
    this.error,
    required this.isSuccess,
  });

  factory AuthResult.success(User user) {
    return AuthResult._(user: user, isSuccess: true);
  }

  factory AuthResult.failure(String error) {
    return AuthResult._(error: error, isSuccess: false);
  }
}
