import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView, Linking } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { orderService } from '@/services/order';
import { PaymentDetails } from '@/types/order';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/use-theme';

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes fallback
  const [paying, setPaying] = useState(false);
  
  const timerRef = useRef<any>(null);

  // Countdown timer expiration handler
  const handleExpiration = () => {
    Alert.alert('Hết Giờ', 'Đơn hàng của bạn đã hết hạn thanh toán (quá 10 phút). Vé đã được hoàn trả lại hệ thống.', [
      { text: 'Quay lại', onPress: () => router.replace('/(user)/(tabs)') }
    ]);
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleExpiration();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Fetch initial payment details and subscribe to updates
  useEffect(() => {
    let sseCleanup: (() => void) | null = null;

    const handleDeepLink = (event: { url: string }) => {
      console.log('Received deep link redirect:', event.url);
      // We keep the spinner showing, and let the SSE connection update the status
    };

    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    if (orderId) {
      sseCleanup = orderService.subscribeOrderSSE(
        orderId,
        (event) => {
          if (event.event === 'ORDER_UPDATED') {
            const data = event.data;
            
            setPaymentDetails({
              orderId: orderId as string,
              status: data.status,
              totalPrice: data.totalPrice || 0,
              paymentDeadline: data.paymentDeadline || new Date().toISOString(),
              paymentUrl: data.paymentUrl || undefined,
            });
            setLoading(false);

            if (data.paymentDeadline) {
              const deadline = new Date(data.paymentDeadline).getTime();
              const now = Date.now();
              const diff = Math.max(0, Math.floor((deadline - now) / 1000));
              setTimeLeft(diff);
            }

            // Handle automatic navigation based on status changes
            if (data.status === 'COMPLETED') {
              setPaying(false); // Stop Spinner
              Alert.alert('Thành Công', 'Thanh toán thành công! Vé của bạn đã được phát hành.', [
                { text: 'Xem Vé', onPress: () => router.replace('/(user)/(tabs)/tickets') }
              ]);
            } else if (data.status === 'FAILED') {
              setPaying(false);
              Alert.alert('Thất Bại', 'Đơn hàng hoặc thanh toán thất bại.');
            } else if (data.status === 'EXPIRED') {
              setPaying(false);
              Alert.alert('Hết Giờ', 'Đơn hàng của bạn đã hết hạn.');
              router.replace('/(user)/(tabs)');
            }
          }
        },
        (err) => {
          console.error('SSE connection error:', err);
          setLoading(false);
        }
      );
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sseCleanup) sseCleanup();
      linkingSubscription.remove();
    };
  }, [orderId, router]);

  const handleOpenPaymentUrl = async () => {
    if (paymentDetails?.paymentUrl) {
      try {
        setPaying(true); // Show Spinner immediately
        // Open Stripe check-out page in the WebBrowser via openAuthSessionAsync
        const result = await WebBrowser.openAuthSessionAsync(
          paymentDetails.paymentUrl,
          'ticketboxmobileapp://payment-result'
        );
        console.log('Auth session finished:', result);
      } catch (err) {
        console.error('Failed to open payment URL in WebBrowser', err);
        Alert.alert('Lỗi', 'Không thể mở cổng thanh toán. Hãy thử lại.');
        setPaying(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading || !paymentDetails) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText style={{ marginTop: Spacing.two }}>Đang khởi tạo luồng thanh toán...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Thanh Toán Đơn Hàng</ThemedText>
          <ThemedText style={styles.timer} themeColor="textSecondary">
            ⏳ Thời giữ vé còn lại: {formatTime(timeLeft)}
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.detailsCard}>
          <ThemedText style={styles.detailRow}>**Mã đơn hàng (Order ID):** {paymentDetails.orderId}</ThemedText>
          <ThemedText style={styles.detailRow}>
            **Số tiền cần trả:** {paymentDetails.totalPrice.toLocaleString('vi-VN')} VNĐ
          </ThemedText>
          <ThemedText style={styles.detailRow}>**Trạng thái thanh toán:** {paymentDetails.status}</ThemedText>
        </ThemedView>

        {paying ? (
          <ThemedView style={styles.processingCard}>
            <ActivityIndicator size="large" color={theme.text} />
            <ThemedText style={styles.processingText}>
              Đang xác thực thanh toán từ Stripe...
            </ThemedText>
            <ThemedText style={styles.pollingHint} themeColor="textSecondary">
              Vui lòng không tắt ứng dụng. Trạng thái vé sẽ cập nhật tự động sau giây lát.
            </ThemedText>
          </ThemedView>
        ) : (
          paymentDetails.paymentUrl && (
            <ThemedView style={styles.scenariosContainer}>
              <ThemedText style={styles.scenariosTitle}>Nhấn nút bên dưới để tiến hành thanh toán:</ThemedText>
              
              <Pressable
                onPress={handleOpenPaymentUrl}
                style={[styles.payButton, { backgroundColor: '#635bff' }]}
              >
                <ThemedText style={styles.payButtonText}>💳 Thanh Toán Qua Stripe</ThemedText>
              </Pressable>
            </ThemedView>
          )
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14.5,
  },
  scenariosContainer: {
    gap: Spacing.three,
    marginTop: Spacing.two,
    backgroundColor: 'transparent',
  },
  scenariosTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  payButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  processingCard: {
    padding: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
    gap: Spacing.three,
  },
  processingText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  pollingHint: {
    fontSize: 12,
    textAlign: 'center',
  },
});

