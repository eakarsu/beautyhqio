import 'dart:convert';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Request permissions for iOS
    await _notifications
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );
  }

  static void _onNotificationTap(NotificationResponse response) {
    final payload = response.payload;
    if (payload != null) {
      final data = jsonDecode(payload) as Map<String, dynamic>;
      _handleNotificationAction(data);
    }
  }

  static void _handleNotificationAction(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    final id = data['id'] as String?;

    switch (type) {
      case 'appointment':
        // Navigate to appointment detail
        break;
      case 'client':
        // Navigate to client detail
        break;
      default:
        // Navigate to dashboard
        break;
    }
  }

  static Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    Map<String, dynamic>? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'beautyhq_channel',
      'BeautyHQ Notifications',
      channelDescription: 'Notifications from BeautyHQ',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      id,
      title,
      body,
      details,
      payload: payload != null ? jsonEncode(payload) : null,
    );
  }

  static Future<void> showAppointmentReminder({
    required String appointmentId,
    required String clientName,
    required String serviceName,
    required DateTime time,
  }) async {
    await showNotification(
      id: appointmentId.hashCode,
      title: 'Upcoming Appointment',
      body: '$clientName - $serviceName at ${_formatTime(time)}',
      payload: {
        'type': 'appointment',
        'id': appointmentId,
      },
    );
  }

  static String _formatTime(DateTime time) {
    final hour = time.hour > 12 ? time.hour - 12 : time.hour;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }

  static Future<void> cancelNotification(int id) async {
    await _notifications.cancel(id);
  }

  static Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }
}
