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
| Authentication | Keychain + JWT |
| Push Notifications | UserNotifications |

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
