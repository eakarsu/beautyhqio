import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:beautyhq_flutter/core/services/api_client.dart';

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await PushNotificationService._handleBackgroundMessage(message);
}

class PushNotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'beautyhq_high_importance',
    'BeautyHQ Notifications',
    description: 'High importance notifications from BeautyHQ',
    importance: Importance.high,
  );

  static String? _fcmToken;
  static String? get fcmToken => _fcmToken;

  /// Initialize push notifications
  static Future<void> initialize() async {
    // Initialize Firebase
    await Firebase.initializeApp();

    // Set background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request permission
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Get FCM token
      _fcmToken = await _messaging.getToken();

      // Listen for token refresh
      _messaging.onTokenRefresh.listen(_onTokenRefresh);

      // Initialize local notifications
      await _initializeLocalNotifications();

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle notification taps
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // Check for initial message (app opened from notification)
      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }

      // Subscribe to topics
      await _subscribeToTopics();
    }
  }

  static Future<void> _initializeLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onLocalNotificationTap,
    );

    // Create Android notification channel
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);
  }

  static void _onTokenRefresh(String token) async {
    _fcmToken = token;
    await _registerTokenWithServer(token);
  }

  static Future<void> _registerTokenWithServer(String token) async {
    try {
      final api = ApiClient();
      await api.post('/notifications/register', data: {'token': token});
    } catch (e) {
      // Silently fail - will retry on next app start
    }
  }

  static Future<void> registerToken() async {
    if (_fcmToken != null) {
      await _registerTokenWithServer(_fcmToken!);
    }
  }

  static Future<void> _subscribeToTopics() async {
    await _messaging.subscribeToTopic('all');
    await _messaging.subscribeToTopic('appointments');
    await _messaging.subscribeToTopic('promotions');
  }

  static Future<void> unsubscribeFromTopics() async {
    await _messaging.unsubscribeFromTopic('all');
    await _messaging.unsubscribeFromTopic('appointments');
    await _messaging.unsubscribeFromTopic('promotions');
  }

  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    final android = message.notification?.android;

    if (notification != null && android != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channel.id,
            _channel.name,
            channelDescription: _channel.description,
            icon: android.smallIcon ?? '@mipmap/ic_launcher',
            importance: Importance.high,
            priority: Priority.high,
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: jsonEncode(message.data),
      );
    }
  }

  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    // Handle data message in background
    final data = message.data;
    final type = data['type'] as String?;

    switch (type) {
      case 'appointment_reminder':
        // Schedule local reminder
        break;
      case 'appointment_cancelled':
        // Handle cancellation
        break;
      default:
        break;
    }
  }

  static void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    _navigateBasedOnData(data);
  }

  static void _onLocalNotificationTap(NotificationResponse response) {
    if (response.payload != null) {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      _navigateBasedOnData(data);
    }
  }

  static void _navigateBasedOnData(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    final id = data['id'] as String?;

    switch (type) {
      case 'appointment':
        if (id != null) {
          // Navigate to appointment detail
          // GoRouter.of(context).go('/appointments/$id');
        }
        break;
      case 'client':
        if (id != null) {
          // Navigate to client detail
          // GoRouter.of(context).go('/clients/$id');
        }
        break;
      default:
        // Navigate to home
        break;
    }
  }

  /// Show a local notification
  static Future<void> showLocalNotification({
    required int id,
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    await _localNotifications.show(
      id,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: data != null ? jsonEncode(data) : null,
    );
  }

  /// Schedule a notification
  static Future<void> scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledTime,
    Map<String, dynamic>? data,
  }) async {
    // Note: For production, use timezone-aware scheduling
    final difference = scheduledTime.difference(DateTime.now());

    if (difference.isNegative) return;

    await Future.delayed(difference, () {
      showLocalNotification(id: id, title: title, body: body, data: data);
    });
  }

  /// Cancel a notification
  static Future<void> cancelNotification(int id) async {
    await _localNotifications.cancel(id);
  }

  /// Cancel all notifications
  static Future<void> cancelAllNotifications() async {
    await _localNotifications.cancelAll();
  }
}
