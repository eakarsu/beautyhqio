# BeautyHQ Mobile

React Native mobile app for BeautyHQ salon management platform, built with Expo.

## Features

- **Dashboard** - Overview of today's appointments, revenue, and quick actions
- **Appointments** - View, manage, and track appointments
- **Clients** - Client database with profiles, history, and loyalty points
- **POS** - Point of sale for processing payments
- **Settings** - App and business configuration

## Tech Stack

- **React Native** with Expo SDK 51
- **Expo Router** for file-based navigation
- **TypeScript** for type safety
- **Zustand** for state management
- **Axios** for API communication
- **Expo Notifications** for push notifications

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device (for development)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `EXPO_PUBLIC_API_URL` - Backend API URL

## Project Structure

```
beautyhq-mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab screens
│   ├── appointment/       # Appointment details
│   ├── client/            # Client profile
│   ├── booking/           # New booking flow
│   └── checkout.tsx       # Checkout/POS
├── src/
│   ├── components/        # Reusable components
│   │   └── ui/           # UI primitives
│   ├── contexts/         # State management
│   ├── hooks/            # Custom hooks
│   ├── services/         # API services
│   ├── types/            # TypeScript types
│   └── utils/            # Utilities & helpers
└── assets/               # Images & fonts
```

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## API Integration

The app connects to the BeautyHQ backend API. Ensure the API is running and accessible from your device/emulator.

## License

Proprietary - BeautyHQ
