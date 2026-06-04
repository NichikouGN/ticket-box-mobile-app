import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.backgroundElement,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sự Kiện',
          tabBarLabel: 'Sự Kiện',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              tintColor={color}
              name={{ ios: 'music.note.house.fill', android: 'home', web: 'home' }}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Vé Của Tôi',
          tabBarLabel: 'Vé Của Tôi',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              tintColor={color}
              name={{ ios: 'ticket.fill', android: 'local_activity', web: 'local_activity' }}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá Nhân',
          tabBarLabel: 'Cá Nhân',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              tintColor={color}
              name={{ ios: 'person.crop.circle.fill', android: 'person', web: 'person' }}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
