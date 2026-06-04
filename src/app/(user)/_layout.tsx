import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function UserLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="concert/[id]" options={{ title: 'Chi Tiết Sự Kiện' }} />
      <Stack.Screen name="booking/[id]" options={{ title: 'Đặt Vé' }} />
      <Stack.Screen name="payment/[orderId]" options={{ title: 'Thanh Toán', headerLeft: () => null }} />
    </Stack>
  );
}
