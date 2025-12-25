# BeautyHQ Flutter Mobile App

A complete Flutter mobile application for the BeautyHQ salon and wellness management platform.

## Features

- **Dashboard**: Overview with stats, quick actions, and upcoming appointments
- **Appointments**: Full appointment management with date navigation and status updates
- **Clients**: Client directory with search, profiles, and visit history
- **POS**: Point of sale with cart management and payment processing
- **Settings**: Account, business, and app preferences
- **Push Notifications**: Firebase Cloud Messaging integration

## Tech Stack

- **Flutter 3.x** with Dart
- **Riverpod** for state management
- **Go Router** for navigation
- **Dio** for networking
- **Firebase** for push notifications
- **Flutter Secure Storage** for token management

## Project Structure

```
lib/
├── main.dart                    # App entry point
├── app/
│   ├── app.dart                 # Main app widget
│   ├── router.dart              # Route configuration
│   └── theme.dart               # Theme and colors
├── core/
│   ├── config/
│   │   └── api_config.dart      # API configuration
│   ├── models/                  # Data models
│   │   ├── user.dart
│   │   ├── business.dart
│   │   ├── client.dart
│   │   ├── appointment.dart
│   │   ├── service.dart
│   │   ├── staff.dart
│   │   ├── transaction.dart
│   │   └── dashboard.dart
│   └── services/                # API services
│       ├── api_client.dart
│       ├── auth_service.dart
│       ├── appointment_service.dart
│       ├── client_service.dart
│       ├── dashboard_service.dart
│       ├── transaction_service.dart
│       ├── notification_service.dart
│       └── push_notification_service.dart
└── features/
    ├── auth/
    │   ├── providers/
    │   ├── screens/
    │   └── widgets/
    ├── home/
    │   └── screens/
    ├── dashboard/
    │   ├── providers/
    │   ├── screens/
    │   └── widgets/
    ├── appointments/
    │   ├── providers/
    │   └── screens/
    ├── clients/
    │   ├── providers/
    │   ├── screens/
    │   └── widgets/
    ├── pos/
    │   ├── providers/
    │   └── screens/
    └── settings/
        └── screens/
```

## Getting Started

### Prerequisites

- Flutter SDK 3.2.0 or higher
- Dart SDK 3.2.0 or higher
- Android Studio / Xcode
- Firebase project (for push notifications)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Configure the API URL in `lib/core/config/api_config.dart`:
   ```dart
   static const String baseUrl = 'https://your-api-url.com';
   ```

4. Set up Firebase:
   - Create a Firebase project
   - Add your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Enable Cloud Messaging

5. Run the app:
   ```bash
   flutter run
   ```

## Building for Production

### Android

```bash
flutter build apk --release
# or for App Bundle
flutter build appbundle --release
```

### iOS

```bash
flutter build ios --release
```

Then open `ios/Runner.xcworkspace` in Xcode and archive.

## Configuration

### API Configuration

Update `lib/core/config/api_config.dart`:

```dart
class ApiConfig {
  static const String baseUrl = 'https://api.beautyhq.io';
  static const String apiVersion = 'v1';
}
```

### Theme Customization

Modify `lib/app/theme.dart` to customize colors, typography, and component styles.

## State Management

This app uses **Riverpod** for state management:

- `StateNotifierProvider` for complex state with business logic
- `FutureProvider` for async data fetching
- `Provider` for dependency injection

## Architecture

The app follows a feature-first architecture:

- **features/**: Feature modules with their own screens, providers, and widgets
- **core/**: Shared code including models, services, and configurations
- **app/**: App-level configuration (theme, router, main app widget)

## API Integration

The `ApiClient` class handles:
- Authentication token management
- Automatic token refresh
- Request/response interceptors
- Error handling

## Push Notifications

Firebase Cloud Messaging is used for push notifications:

- Foreground notifications with local display
- Background message handling
- Deep linking from notification taps
- Topic subscriptions (appointments, promotions)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary and confidential.
