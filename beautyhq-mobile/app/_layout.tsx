import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/contexts/auth-store';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        await checkAuth();
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    initApp();
  }, [checkAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="appointment/[id]"
            options={{
              headerShown: true,
              title: 'Appointment Details',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="client/[id]"
            options={{
              headerShown: true,
              title: 'Client Profile',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="booking/new"
            options={{
              headerShown: true,
              title: 'New Booking',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="checkout"
            options={{
              headerShown: true,
              title: 'Checkout',
              presentation: 'modal',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
