# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Expo dev server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator
npm run ios

# Type-check without emitting
npx tsc --noEmit
```

No test or lint scripts are defined in package.json. TypeScript is the primary correctness gate.

## Environment Setup

Copy `.env.example` to `.env` and fill in the values:

```
EXPO_PUBLIC_API_BASE_URL            # Backend URL (default: http://127.0.0.1:3000)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
```

`app.config.ts` loads these vars and injects them into the Expo build + configures the Google Sign-In plugin. The runtime resolution lives in `src/config/env.ts`.

## Architecture

BetHunter is a React Native (Expo 54 / RN 0.81.5) educational app that gamifies financial literacy for betting enthusiasts.

### Layer Structure

The code follows Clean Architecture with four layers:

**Presentation** — `src/screens/`, `src/components/`, `src/storage/` (Zustand stores)

**Domain** — `src/domain/usercases/`, `src/domain/repositories/` (interfaces), `src/domain/entities/`, `src/domain/errors/`

**Data** — `src/domain/data/repositories/` — `*RepositoryImpl` classes that implement the domain interfaces

**Infrastructure** — `src/infrastructure/` — API datasource services, AsyncStorage wrappers, and the DI container

### Dependency Injection

`src/infrastructure/di/Container.ts` is a singleton that wires all repositories and use cases together. Screens retrieve use cases through the container rather than instantiating them directly.

### Authentication Flow

- JWT tokens are stored in AsyncStorage via `AuthStorageService`.
- `src/storage/authStore.ts` (Zustand) syncs auth state for reactive UI.
- `src/services/api/apiClient.ts` is an Axios instance that injects `Authorization: Bearer {token}` on every request. A 401 response triggers automatic logout via a registered callback.

### State Management

Zustand stores in `src/storage/`:
- `authStore` — token, user, `isAuthenticated`
- `subscriptionStore` — RevenueCat subscription status
- `accountStore` — financial balance and transactions
- `profileStore` — user profile data
- `savedCoursesStore` — bookmarked courses

### Navigation

React Navigation Native Stack. All route names and their params are typed in `src/types/navigation.ts` as `RootStackParamList`. The navigator is bootstrapped in `src/App.tsx`.

### Error Handling

Domain-layer custom error classes live in `src/domain/errors/`: `ValidationError`, `AuthenticationError`, `InsufficientBalanceError`, `BusinessRuleError`. Use cases throw these; screens catch and display them.

### Design System

`src/config/colors.ts` defines all gradients, palette, and button style presets used across the app. Prefer these constants over inline color values.

## Key Third-Party Integrations

- **RevenueCat** (`react-native-purchases`) — subscription paywall; initialized in `src/services/api/revenueCat.ts`
- **Google Sign-In** (`@react-native-google-signin/google-signin`) — credentials come from env vars; iOS URL scheme is auto-derived from the iOS client ID in `app.config.ts`
- **Expo Linear Gradient / SVG / Blur / Notifications / Image Picker** — standard Expo modules; native code is auto-linked

## Native Projects

Both `android/` and `ios/` are managed by Expo (auto-linking). Avoid manually editing native files unless adding a native module not handled by Expo config plugins.

- Bundle ID / package: `com.bethunter.app`
- iOS minimum deployment: 15.1
- Android build config: `android/app/build.gradle`
