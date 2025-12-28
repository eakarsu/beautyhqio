# BeautyHQ iOS

Native iOS app for BeautyHQ salon management platform, built with Swift and SwiftUI.

## Features

- **Dashboard** - Overview with stats, quick actions, and upcoming appointments
- **Appointments** - View, manage, and track appointments by date/status
- **Clients** - Client database with profiles, history, and loyalty points
- **POS** - Point of sale with transaction history
- **Settings** - Account, business, and app preferences

## Requirements

- iOS 16.0+
- Xcode 15.0+
- Swift 5.9+

## Architecture

```
BeautyHQ-iOS/
├── BeautyHQ/
│   ├── App/                    # App entry point, configuration
│   │   ├── BeautyHQApp.swift
│   │   ├── ContentView.swift
│   │   └── Config.swift
│   ├── Models/                 # Data models
│   │   ├── User.swift
│   │   ├── Appointment.swift
│   │   ├── Client.swift
│   │   ├── Service.swift
│   │   ├── Staff.swift
│   │   └── Transaction.swift
│   ├── Views/                  # SwiftUI views
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Appointments/
│   │   ├── Clients/
│   │   ├── POS/
│   │   ├── Settings/
│   │   └── Components/
│   ├── ViewModels/             # View models (MVVM)
│   ├── Services/               # API & business logic
│   │   ├── APIClient.swift
│   │   ├── AuthManager.swift
│   │   └── *Service.swift
│   └── Utils/                  # Utilities
│       └── NotificationManager.swift
└── BeautyHQ.xcodeproj/
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| UI Framework | SwiftUI |
| Architecture | MVVM |
| Networking | URLSession + async/await |
| State Management | @StateObject, @Published |
| Authentication | Keychain + JWT + Sign in with Apple |
| Push Notifications | UserNotifications |

## Sign in with Apple

The app supports Sign in with Apple for authentication.

### Setup in Xcode

1. Select your project in Xcode
2. Go to "Signing & Capabilities" tab
3. Click "+ Capability"
4. Add "Sign in with Apple"

### Setup in Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles
3. Select your App ID
4. Enable "Sign in with Apple" capability
5. Configure the App ID for Sign in with Apple

### Backend Integration

The app sends Apple credentials to your backend at `POST /api/auth/apple`:

```json
{
  "identityToken": "eyJ...",
  "authorizationCode": "abc123...",
  "nonce": "random_nonce",
  "userIdentifier": "001234.abc...",
  "email": "user@email.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

Your backend should:
1. Verify the `identityToken` with Apple's servers
2. Create or update the user account
3. Return a JWT token for the app

### Key Files

| File | Purpose |
|------|---------|
| `AppleSignInManager.swift` | Handles Sign in with Apple flow |
| `AuthManager.swift` | Orchestrates authentication |
| `LoginView.swift` | UI with Apple Sign In button |
| `BeautyHQ.entitlements` | App entitlements for Apple Sign In |

## Getting Started

### 1. Open in Xcode

```bash
open BeautyHQ-iOS/BeautyHQ.xcodeproj
```

### 2. Configure API URL

Edit `BeautyHQ/App/Config.swift`:

```swift
static let apiBaseURL = "https://api.beautyhq.io/api"
```

### 3. Build & Run

Select a simulator or device and press `Cmd + R`.

## Key Files

| File | Purpose |
|------|---------|
| `BeautyHQApp.swift` | App entry point |
| `ContentView.swift` | Root view with auth flow |
| `AuthManager.swift` | Authentication state |
| `APIClient.swift` | Network layer with JWT |
| `NotificationManager.swift` | Push notifications |

## API Integration

The app communicates with the BeautyHQ backend API:

- Authentication: `/api/auth/*`
- Appointments: `/api/appointments/*`
- Clients: `/api/clients/*`
- Transactions: `/api/transactions/*`
- Services: `/api/services/*`
- Staff: `/api/staff/*`

## Building for Release

1. Set your Team in Xcode project settings
2. Update Bundle Identifier
3. Configure signing certificates
4. Archive: Product → Archive
5. Distribute to App Store Connect

## Swift Concurrency

The app uses modern Swift concurrency:

```swift
// Async service calls
let appointments = try await AppointmentService.shared.getTodayAppointments()

// Main actor for UI updates
@MainActor
class ViewModel: ObservableObject {
    @Published var data: [Item] = []

    func loadData() async {
        data = try await service.fetch()
    }
}
```

## License

Proprietary - BeautyHQ
