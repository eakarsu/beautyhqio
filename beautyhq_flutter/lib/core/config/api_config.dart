class ApiConfig {
  static const String baseUrl = 'https://api.beautyhq.io';
  static const String apiVersion = 'v1';

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  static String get apiUrl => '$baseUrl/api/$apiVersion';
}
