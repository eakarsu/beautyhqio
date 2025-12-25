# BeautyHQ Mobile

React Native mobile app for BeautyHQ salon management platform, built with Expo SDK 51.

## Features

- **Dashboard** - Overview of today's appointments, revenue, and quick actions
- **Appointments** - View, manage, and track appointments with status updates
- **Clients** - Client database with profiles, history, and loyalty points
- **POS** - Point of sale for processing payments with Stripe
- **Booking** - Multi-step appointment booking flow
- **Settings** - App and business configuration
- **Push Notifications** - Appointment reminders and updates

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React Native | Cross-platform mobile framework |
| Expo SDK 51 | Development platform & build tools |
| Expo Router | File-based navigation |
| TypeScript | Type safety |
| Zustand | State management |
| Axios | API communication |
| Stripe | Payment processing |

## Quick Start

### Prerequisites

```bash
# Required
node --version  # >= 18.0.0
npm install -g expo-cli eas-cli

# Optional (for local builds)
# macOS: Xcode 15+
# All: Android Studio with SDK 34
```

### Installation

```bash
cd beautyhq-mobile
npm install
```

### Running

```bash
# Development with Expo Go
npm start

# Development with native modules
npm run start:dev

# Clear cache
npm run start:clear
```

## Build Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run build:dev:ios` | Development build for iOS |
| `npm run build:dev:android` | Development build for Android |
| `npm run build:preview:ios` | Preview build for iOS (TestFlight) |
| `npm run build:preview:android` | Preview APK for Android |
| `npm run build:prod:all` | Production builds for both platforms |
| `npm run submit:ios` | Submit to App Store |
| `npm run submit:android` | Submit to Play Store |
| `npm run update:production` | OTA update to production |

## Building Production Apps

### Step 1: Configure EAS

```bash
# Login to Expo
eas login

# Initialize project (first time)
eas init
eas build:configure
```

### Step 2: Build

```bash
# Build for both platforms
npm run build:prod:all

# Or individually
npm run build:prod:ios
npm run build:prod:android
```

### Step 3: Submit to Stores

```bash
# iOS App Store
npm run submit:ios

# Google Play Store
npm run submit:android
```

## Project Structure

```
beautyhq-mobile/
├── app/                    # Screens (Expo Router)
│   ├── (auth)/            # Login, register, forgot password
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/            # Main tab screens
│   │   ├── index.tsx      # Dashboard
│   │   ├── appointments.tsx
│   │   ├── clients.tsx
│   │   ├── pos.tsx
│   │   └── settings.tsx
│   ├── appointment/[id].tsx  # Appointment details
│   ├── client/[id].tsx       # Client profile
│   ├── booking/new.tsx       # New booking flow
│   └── checkout.tsx          # Payment checkout
├── src/
│   ├── components/ui/     # Button, Input, Card, Avatar, etc.
│   ├── services/          # API clients
│   ├── contexts/          # Auth store (Zustand)
│   ├── hooks/             # usePushNotifications
│   ├── types/             # TypeScript interfaces
│   └── utils/             # Colors, helpers
├── assets/                # Icons, splash screen
├── app.json              # Expo config
├── eas.json              # EAS Build config
└── BUILD_GUIDE.md        # Detailed build documentation
```

## Environment Variables

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API URL |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key |

## API Integration

The app connects to the BeautyHQ Next.js backend. Endpoints used:

- `/api/auth/*` - Authentication
- `/api/appointments/*` - Appointment management
- `/api/clients/*` - Client database
- `/api/transactions/*` - POS transactions
- `/api/services/*` - Service catalog
- `/api/staff/*` - Staff management

## Detailed Documentation

See [BUILD_GUIDE.md](./BUILD_GUIDE.md) for:
- Complete build instructions
- App Store submission process
- Over-the-air updates
- Troubleshooting

## License

Proprietary - BeautyHQ
