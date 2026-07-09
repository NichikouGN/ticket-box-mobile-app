import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView, Linking } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { orderService } from '@/services/order';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/use-theme';

export default function PaymentScreen() {
  const { orderId, totalPrice } = useLocalSearchParams<{ orderId: string; totalPrice?: string }>();
  const router = useRouter();
  const theme = useTheme();

  // State management
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes fallback
  const [paying, setPaying] = useState(false);
  const [status, setStatus] = useState<string>('PENDING_PAYMENT');
  const [retryCount, setRetryCount] = useState(0);

  // Refs for timers
  const timerRef = useRef<any>(null);
  const phase2TimeoutRef = useRef<any>(null);

  // Parse total price for display
  const parsedTotalPrice = totalPrice ? parseInt(totalPrice, 10) : 0;

  // Clear Phase 2 timeout
  const clearPhase2Timeout = () => {
    if (phase2TimeoutRef.current) {
      clearTimeout(phase2TimeoutRef.current);
      phase2TimeoutRef.current = null;
    }
  };

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

  // Main payment flow: Phase 1 & Phase 2 SSE Subscriptions
  useEffect(() => {
    let ssePaymentUrlCleanup: (() => void) | null = null;
    let sseOrderConfirmCleanup: (() => void) | null = null;
    let phase1TimeoutId: any = null;

    const startPhase1 = () => {
      setInitLoading(true);
      setInitError(null);

      // Phase 1 Timeout: 30 seconds
      phase1TimeoutId = setTimeout(() => {
        console.log('Phase 1 SSE Timeout (30s) reached');
        setInitError('Không thể khởi tạo thanh toán. Vui lòng thử lại.');
        setInitLoading(false);
        if (ssePaymentUrlCleanup) {
          ssePaymentUrlCleanup();
          ssePaymentUrlCleanup = null;
        }
      }, 30000);

      if (orderId) {
        console.log('Subscribing to Phase 1: payment-url for order:', orderId);
        ssePaymentUrlCleanup = orderService.subscribePaymentUrlSSE(
          orderId,
          (event) => {
            console.log('Phase 1 received event:', event);
            if (phase1TimeoutId) {
              clearTimeout(phase1TimeoutId);
              phase1TimeoutId = null;
            }

            // Clean up Phase 1 SSE connection immediately since it's a one-shot event
            if (ssePaymentUrlCleanup) {
              ssePaymentUrlCleanup();
              ssePaymentUrlCleanup = null;
            }

            setPaymentUrl(event.paymentUrl);
            setStatus(event.status);
            setInitLoading(false);

            if (event.paymentDeadline) {
              const deadline = new Date(event.paymentDeadline).getTime();
              const now = Date.now();
              const diff = Math.max(0, Math.floor((deadline - now) / 1000));
              setTimeLeft(diff);
            }

            // START PHASE 2 IMMEDIATELY to listen for order confirmation
            console.log('Starting Phase 2 SSE subscription: order-confirm...');
            sseOrderConfirmCleanup = orderService.subscribeOrderConfirmSSE(
              orderId,
              (confirmEvent) => {
                console.log('Phase 2 received event:', confirmEvent);
                setStatus(confirmEvent.status);

                if (confirmEvent.status === 'COMPLETED') {
                  clearPhase2Timeout();
                  setPaying(false);
                  Alert.alert('Thành Công', 'Thanh toán thành công! Vé của bạn đã được phát hành.', [
                    { text: 'Xem Vé', onPress: () => router.replace('/(user)/(tabs)/tickets') }
                  ]);
                } else if (confirmEvent.status === 'FAILED') {
                  clearPhase2Timeout();
                  setPaying(false);
                  Alert.alert('Thất Bại', 'Đơn hàng hoặc thanh toán thất bại.');
                  router.replace('/(user)/(tabs)');
                } else if (confirmEvent.status === 'EXPIRED') {
                  clearPhase2Timeout();
                  setPaying(false);
                  Alert.alert('Hết Giờ', 'Đơn hàng của bạn đã hết hạn.');
                  router.replace('/(user)/(tabs)');
                }
              },
              (err) => {
                console.error('Phase 2 SSE error:', err);
              }
            );
          },
          (err) => {
            console.error('Phase 1 SSE error:', err);
            if (phase1TimeoutId) {
              clearTimeout(phase1TimeoutId);
              phase1TimeoutId = null;
            }
            setInitError('Có lỗi xảy ra khi kết nối luồng thanh toán. Vui lòng thử lại.');
            setInitLoading(false);
            if (ssePaymentUrlCleanup) {
              ssePaymentUrlCleanup();
              ssePaymentUrlCleanup = null;
            }
          }
        );
      }
    };

    startPhase1();

    // Deep Link Linking listener
    const handleDeepLink = (event: { url: string }) => {
      console.log('Received deep link redirect:', event.url);
      try {
        const match = event.url.match(/[?&]orderId=([^&]+)/);
        if (match && match[1]) {
          const extractedOrderId = match[1];
          console.log('Extracted orderId from deep link:', extractedOrderId);
          if (extractedOrderId === orderId) {
            console.log('Extracted orderId matches the current orderId. Keeping spinner and waiting for SSE.');
          } else {
            console.warn(`Extracted orderId (${extractedOrderId}) does not match current orderId (${orderId}).`);
          }
        }
      } catch (err) {
        console.error('Failed to parse deep link URL:', err);
      }
    };

    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      if (phase1TimeoutId) clearTimeout(phase1TimeoutId);
      if (ssePaymentUrlCleanup) ssePaymentUrlCleanup();
      if (sseOrderConfirmCleanup) sseOrderConfirmCleanup();
      linkingSubscription.remove();
      clearPhase2Timeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, retryCount]);

  // Handle opening the Stripe payment page via user gesture
  const handleOpenPaymentUrl = async () => {
    if (paymentUrl) {
      try {
        setPaying(true);

        // Start Phase 2 Timeout: 3 minutes (180s)
        clearPhase2Timeout();
        phase2TimeoutRef.current = setTimeout(() => {
          console.log('Phase 2 Timeout (3 minutes) reached');
          setPaying(false);
          Alert.alert(
            'Thông Báo',
            'Giao dịch đang xử lý lâu hơn dự kiến. Vé sẽ xuất hiện trong Ví vé khi hoàn tất.',
            [{ text: 'Đóng', onPress: () => router.replace('/(user)/(tabs)') }]
          );
        }, 180000);

        // Use scheme-only returnUrl to match both success and cancelled redirects
        const result = await WebBrowser.openAuthSessionAsync(paymentUrl, 'ticketboxmobileapp://');
        console.log('Auth session finished:', result);

        // Whether result.type is 'success' or 'dismiss', we do NOT make any assumptions.
        // We keep the spinner showing, relying solely on the order-confirm SSE.
      } catch (err) {
        console.error('Failed to open payment URL in WebBrowser', err);
        Alert.alert('Lỗi', 'Không thể mở cổng thanh toán. Hãy thử lại.');
        setPaying(false);
        clearPhase2Timeout();
      }
    }
  };

  const handleRetryInit = () => {
    setRetryCount(prev => prev + 1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 1. Initial Loading State (Phase 1)
  if (initLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText style={{ marginTop: Spacing.two }}>Đang khởi tạo luồng thanh toán...</ThemedText>
      </ThemedView>
    );
  }

  // 2. Initial Error State (Phase 1 Timeout or Connection Failure)
  if (initError) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText} themeColor="text">
          ⚠️ {initError}
        </ThemedText>
        <Pressable onPress={handleRetryInit} style={styles.retryButton}>
          <ThemedText style={styles.retryButtonText}>Thử Lại</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  // 3. Main Payment Screen
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Thanh Toán Đơn Hàng</ThemedText>
          <ThemedText style={styles.timer} themeColor="textSecondary">
            ⏳ Thời gian giữ vé còn lại: {formatTime(timeLeft)}
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.detailsCard}>
          <ThemedText style={styles.detailRow}>**Mã đơn hàng (Order ID):** {orderId}</ThemedText>
          {parsedTotalPrice > 0 && (
            <ThemedText style={styles.detailRow}>
              **Số tiền cần trả:** {parsedTotalPrice.toLocaleString('vi-VN')} VNĐ
            </ThemedText>
          )}
          <ThemedText style={styles.detailRow}>**Trạng thái thanh toán:** {status}</ThemedText>
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
          paymentUrl && (
            <ThemedView style={styles.scenariosContainer}>
              <ThemedText style={styles.scenariosTitle}>Nhấn nút bên dưới để tiến hành thanh toán:</ThemedText>
              
              <Pressable
                onPress={handleOpenPaymentUrl}
                style={[styles.payButton, { backgroundColor: '#635bff' }]}
              >
                <ThemedText style={styles.payButtonText}>
                  💳 Thanh Toán Qua Stripe {parsedTotalPrice > 0 ? `(${parsedTotalPrice.toLocaleString('vi-VN')} VNĐ)` : ''}
                </ThemedText>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  retryButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: '#635bff',
    borderRadius: Spacing.one,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
