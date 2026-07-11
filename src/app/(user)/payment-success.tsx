import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/hooks/use-theme';

export default function PaymentSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const router = useRouter();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <SymbolView
            name={{
              ios: 'checkmark.circle.fill',
              android: 'check_circle',
              web: 'check_circle',
            }}
            size={80}
            tintColor="#34c759"
          />
        </View>

        <ThemedText style={styles.successTitle} type="title">
          Thanh toán thành công!
        </ThemedText>

        <ThemedText style={styles.successSub} themeColor="textSecondary">
          Đơn hàng của bạn đã được thanh toán và xử lý thành công. Vé xem ca nhạc đã được phát hành trong ví vé của bạn.
        </ThemedText>

        {orderId ? (
          <View style={styles.orderCard}>
            <ThemedText style={styles.orderLabel} themeColor="textSecondary">
              MÃ ĐƠN HÀNG (ORDER ID)
            </ThemedText>
            <ThemedText style={styles.orderId} type="defaultSemiBold" selectable>
              {orderId}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => router.replace('/(user)/(tabs)/tickets')}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          { backgroundColor: theme.text }
        ]}
      >
        <ThemedText style={[styles.buttonText, { color: theme.background }]}>
          🎟️ Xem vé của tôi
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.six,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: Spacing.four,
  },
  iconContainer: {
    marginBottom: Spacing.two,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  successSub: {
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.two,
  },
  orderCard: {
    width: '100%',
    padding: Spacing.three,
    backgroundColor: 'rgba(52, 199, 89, 0.05)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.1)',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  orderLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: Spacing.one,
  },
  orderId: {
    fontSize: 14.5,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
