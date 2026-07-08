import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function StaffLayout() {
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
      <Stack.Screen name="scanner" options={{ title: 'Soát Vé (Scanner)' }} />
      <Stack.Screen name="stats" options={{ title: 'Thống Kê Check-in' }} />
      <Stack.Screen name="vip-checkin" options={{ title: 'Soát Vé VIP' }} />
    </Stack>
  );
}
