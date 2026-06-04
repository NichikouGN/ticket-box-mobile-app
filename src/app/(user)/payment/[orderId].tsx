import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  const [paying, setPaying] = useState(false);
  const [status, setStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePay = () => {
    setPaying(true);
    // Simulate Payment Gateway call + API polling for SUCCESS
    setTimeout(() => {
      setPaying(false);
      setStatus('SUCCESS');
      // Redirect to Tickets tab after showing success
      setTimeout(() => {
        router.replace('/(user)/(tabs)/tickets');
      }, 1500);
    }, 2000);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">Thanh Toán Đơn Hàng</ThemedText>
        <ThemedText style={styles.timer} themeColor="textSecondary">
          ⏳ Vui lòng thanh toán trong: {formatTime(timeLeft)}
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.detailsCard}>
        <ThemedText style={styles.detailRow}>**Mã đơn hàng:** {orderId}</ThemedText>
        <ThemedText style={styles.detailRow}>**Tổng số tiền:** 4,300,000 VNĐ</ThemedText>
        <ThemedText style={styles.detailRow}>**Trạng thái:** {status}</ThemedText>
      </ThemedView>

      {status === 'PENDING' && (
        <Pressable
          onPress={handlePay}
          disabled={paying}
          style={({ pressed }) => [
            styles.payButton,
            pressed && styles.payButtonPressed,
          ]}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.payButtonText}>Thanh Toán Thử Nghiệm (Mock Pay)</ThemedText>
          )}
        </Pressable>
      )}

      {status === 'SUCCESS' && (
        <ThemedView style={styles.successMessage}>
          <ThemedText style={styles.successText}>🎉 Thanh toán thành công! Đang chuyển hướng...</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  detailRow: {
    fontSize: 14,
  },
  payButton: {
    height: 50,
    backgroundColor: '#43a047',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
    marginTop: Spacing.four,
  },
  payButtonPressed: {
    opacity: 0.8,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  successMessage: {
    padding: Spacing.three,
    backgroundColor: '#e8f5e9',
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  successText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
});
