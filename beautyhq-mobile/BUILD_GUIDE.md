# BeautyHQ Mobile - Complete Build Guide

This guide covers everything you need to build, test, and deploy the BeautyHQ mobile app for iOS and Android.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Running the App](#running-the-app)
4. [Building for Production](#building-for-production)
5. [App Store Submission](#app-store-submission)
6. [Over-the-Air Updates](#over-the-air-updates)

---

## Prerequisites

### Required Software

```bash
# Node.js 18 or higher
node --version  # Should be >= 18.0.0

# Install Expo CLI globally
npm install -g expo-cli

# Install EAS CLI for builds
npm install -g eas-cli

# Login to Expo account
eas login
```

### For iOS Development (macOS only)

- Xcode 15+ from App Store
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer Account ($99/year for App Store)

### For Android Development

- Android Studio (with SDK 34)
- Java JDK 17
- Set `ANDROID_HOME` environment variable
- Google Play Developer Account ($25 one-time)

---

## Development Setup

### 1. Install Dependencies

```bash
cd beautyhq-mobile
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

Required environment variables:
```env
EXPO_PUBLIC_API_URL=https://api.beautyhq.io
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### 3. Link to EAS Project

```bash
# Initialize EAS project (first time only)
eas init

# This will create/update your eas.json
eas build:configure
```

---

## Running the App

### Option 1: Expo Go (Quickest for Development)

```bash
# Start development server
npm start

# Scan QR code with:
# - iOS: Camera app
# - Android: Expo Go app
```

**Limitations:** No native modules (Stripe, notifications) in Expo Go.

### Option 2: Development Build (Recommended)

Development builds include all native modules:

```bash
# Build for iOS Simulator
npm run build:dev:ios

# Build for Android Emulator
npm run build:dev:android

# Or build locally (requires Xcode/Android Studio)
npm run prebuild
npx expo run:ios
npx expo run:android
```

### Option 3: Physical Device Testing

```bash
# Build APK for Android device
eas build --profile development --platform android

# Download and install the APK from the EAS dashboard

# For iOS, use TestFlight or Ad Hoc distribution
eas build --profile preview --platform ios
```

---

## Building for Production

### Step 1: Configure Build Settings

Edit `eas.json` for your requirements:

```json
{
  "build": {
    "production": {
      "channel": "production",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Step 2: Create Production Builds

```bash
# Build for both platforms
npm run build:prod:all

# Or build individually
npm run build:prod:ios
npm run build:prod:android
```

### Step 3: Monitor Build Progress

```bash
# Check build status
eas build:list

# View build logs
eas build:view
```

Builds run on Expo's cloud infrastructure. iOS builds take ~15-20 minutes, Android ~10-15 minutes.

---

## App Store Submission

### iOS App Store

#### 1. Apple Developer Setup

1. Create App ID in [Apple Developer Portal](https://developer.apple.com)
2. Create App Store Connect entry
3. Configure certificates and provisioning profiles (EAS handles this automatically)

#### 2. Update `eas.json`

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234"
      }
    }
  }
}
```

#### 3. Submit to App Store

```bash
# Build and submit in one command
eas build --platform ios --auto-submit

# Or submit an existing build
npm run submit:ios
```

### Google Play Store

#### 1. Google Play Console Setup

1. Create app in [Google Play Console](https://play.google.com/console)
2. Complete store listing
3. Create service account for automated uploads

#### 2. Configure Service Account

```bash
# Download JSON key from Google Cloud Console
# Save as google-services-key.json in project root
```

Update `eas.json`:
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services-key.json",
        "track": "production"
      }
    }
  }
}
```

#### 3. Submit to Play Store

```bash
# Build and submit
eas build --platform android --auto-submit

# Or submit existing build
npm run submit:android
```

---

## Over-the-Air Updates

EAS Update allows pushing JavaScript updates without app store review.

### Configuration

Updates are already configured in `app.json`:

```json
{
  "updates": {
    "url": "https://u.expo.dev/your-project-id"
  },
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

### Publishing Updates

```bash
# Push update to production
npm run update:production

# Push update to preview channel
npm run update:preview

# Push with message
eas update --branch production --message "Fixed checkout bug"
```

### When to Use OTA vs New Build

| Change Type | OTA Update | New Build |
|-------------|------------|-----------|
| JavaScript/TypeScript code | ✅ Yes | Not needed |
| Assets (images, fonts) | ✅ Yes | Not needed |
| Native dependencies | ❌ No | Required |
| app.json changes | ❌ No | Required |
| SDK version upgrade | ❌ No | Required |

---

## Build Profiles Summary

| Profile | Purpose | Distribution |
|---------|---------|--------------|
| `development` | Local dev with dev client | Internal |
| `preview` | QA testing | Internal/TestFlight |
| `production` | App Store release | Public |

---

## Common Commands Reference

```bash
# Development
npm start              # Start Expo dev server
npm run start:clear    # Clear cache and start
npm run prebuild       # Generate native projects

# Testing
npm test              # Run Jest tests
npm run lint          # ESLint check
npm run typecheck     # TypeScript check

# Building
npm run build:dev:ios          # iOS development build
npm run build:dev:android      # Android development build
npm run build:preview:ios      # iOS preview build
npm run build:preview:android  # Android preview build
npm run build:prod:all         # Production builds (both)

# Submitting
npm run submit:ios     # Submit to App Store
npm run submit:android # Submit to Play Store

# Updates
npm run update:production  # OTA update to production
npm run update:preview     # OTA update to preview
```

---

## Troubleshooting

### Build Failures

```bash
# Clear all caches
npm run start:clear
rm -rf node_modules
npm install

# Regenerate native projects
npm run prebuild:clean
```

### iOS Signing Issues

```bash
# Clear EAS credentials cache
eas credentials --platform ios

# Revoke and recreate certificates
eas credentials --platform ios --clear
```

### Android Build Issues

```bash
# Clean Gradle cache
cd android && ./gradlew clean

# Update Gradle wrapper
cd android && ./gradlew wrapper --gradle-version 8.0
```

---

## Environment-Specific API URLs

Configure different API endpoints per environment:

```javascript
// In app.config.js
export default {
  expo: {
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL ||
        (process.env.EAS_BUILD_PROFILE === 'production'
          ? 'https://api.beautyhq.io'
          : 'https://staging-api.beautyhq.io')
    }
  }
}
```

---

## Support

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [React Native Docs](https://reactnative.dev)
