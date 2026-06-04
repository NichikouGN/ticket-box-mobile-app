import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import React, { useEffect } from 'react';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

function NavigationGate() {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inUserGroup = segments[0] === '(user)';
    const inStaffGroup = segments[0] === '(staff)';

    if (!isAuthenticated) {
      // Redirect to login if not authenticated and not already in auth group
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // If authenticated, redirect to appropriate entry screens if in wrong group
      if (userRole === 'staff') {
        if (!inStaffGroup) {
          router.replace('/(staff)/scanner');
        }
      } else {
        if (!inUserGroup) {
          router.replace('/(user)/(tabs)');
        }
      }
    }
  }, [isAuthenticated, isLoading, userRole, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(user)" />
      <Stack.Screen name="(staff)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <NavigationGate />
      </AuthProvider>
    </ThemeProvider>
  );
}
