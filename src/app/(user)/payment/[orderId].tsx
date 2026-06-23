import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
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
  const [polling, setPolling] = useState(false);
  const [mockScenario, setMockScenario] = useState<string | null>(null);
  
  const timerRef = useRef<any>(null);
  const pollingRef = useRef<any>(null);

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
    const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

    const loadPaymentDetailsMock = async () => {
      if (!orderId) return;
      try {
        const details = await orderService.getPaymentStatus(orderId);
        setPaymentDetails(details);
        
        if (details.processedAt) {
          setTimeLeft(600); // Set default 10 minutes countdown for demo
        }
      } catch (error) {
        console.error('Failed to load payment details', error);
        setPaymentDetails({
          paymentId: 'mock-pay-id',
          orderId: orderId as string,
          status: 'PENDING',
          amount: 3500000,
          paymentRef: 'MOCK-TXN-PENDING',
          processedAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    if (USE_MOCK) {
      loadPaymentDetailsMock();
    } else {
      if (orderId) {
        sseCleanup = orderService.subscribeOrderSSE(
          orderId,
          (event) => {
            if (event.event === 'ORDER_UPDATED') {
              const data = event.data;
              
              setPaymentDetails({
                paymentId: data.paymentId || 'pay-' + orderId,
                orderId: orderId as string,
                status: data.status,
                amount: data.totalPrice || 0,
                paymentRef: data.paymentRef || 'TXN-PENDING',
                processedAt: data.paymentDeadline || new Date().toISOString(),
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
              if (data.status === 'COMPLETED' || data.status === 'SUCCESS') {
                Alert.alert('Thành Công', 'Thanh toán thành công! Vé của bạn đã được phát hành.', [
                  { text: 'Xem Vé', onPress: () => router.replace('/(user)/(tabs)/tickets') }
                ]);
              } else if (data.status === 'FAILED') {
                Alert.alert('Thất Bại', 'Đơn hàng hoặc thanh toán thất bại.');
              } else if (data.status === 'EXPIRED') {
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
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (sseCleanup) sseCleanup();
    };
  }, [orderId, router]);

  // Start polling backend status
  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setPolling(true);
    
    pollingRef.current = setInterval(async () => {
      if (!orderId) return;
      try {
        const details = await orderService.getPaymentStatus(orderId);
        setPaymentDetails(details);
        
        if (details.status === 'SUCCESS' || details.status === 'COMPLETED') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPolling(false);
          setPaying(false);
          Alert.alert('Thành Công', 'Thanh toán thành công! Vé của bạn đã được phát hành.', [
            { text: 'Xem Vé', onPress: () => router.replace('/(user)/(tabs)/tickets') }
          ]);
        } else if (details.status === 'FAILED') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPolling(false);
          setPaying(false);
          Alert.alert('Thất Bại', 'Giao dịch bị từ chối hoặc hết hạn.');
        }
      } catch (err) {
        console.error('Polling status error', err);
      }
    }, 2000);
  };

  const handleMockPayment = async (scenario: 'success' | 'fail' | 'timeout') => {
    setPaying(true);
    setMockScenario(scenario);

    if (scenario === 'timeout') {
      // Simulation of a timeout: mock gateway holds request or breaks circuit
      setTimeout(() => {
        setPaying(false);
        Alert.alert('Lỗi Kết Nối', 'Mock Payment Gateway không phản hồi (Timeout).');
      }, 5000);
      return;
    }

    try {
      await orderService.triggerMockPayment(orderId as string, scenario);
      startPolling();
    } catch (error) {
      console.error('Mock payment error', error);
      // Fallback local mock simulation if server backend endpoint /payments doesn't exist
      setTimeout(() => {
        const details: PaymentDetails = {
          paymentId: 'mock-pay-id',
          orderId: orderId as string,
          status: scenario === 'success' ? 'SUCCESS' : 'FAILED',
          amount: paymentDetails?.amount || 3500000,
          paymentRef: `MOCK-TXN-${scenario.toUpperCase()}`,
          processedAt: new Date().toISOString(),
        };
        setPaymentDetails(details);
        setPaying(false);
        if (scenario === 'success') {
          Alert.alert('Thành Công', 'Thanh toán thành công (Simulated)!', [
            { text: 'Xem Vé', onPress: () => router.replace('/(user)/(tabs)/tickets') }
          ]);
        } else {
          Alert.alert('Thất Bại', 'Thanh toán thất bại (Simulated).');
        }
      }, 2000);
    }
  };

  const handleOpenPaymentUrl = async () => {
    if (paymentDetails?.paymentUrl) {
      try {
        await WebBrowser.openBrowserAsync(paymentDetails.paymentUrl);
      } catch (err) {
        console.error('Failed to open payment URL in WebBrowser', err);
        Alert.alert('Lỗi', 'Không thể mở cổng thanh toán. Hãy thử lại.');
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
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">Thanh Toán Đơn Hàng</ThemedText>
        <ThemedText style={styles.timer} themeColor="textSecondary">
          ⏳ Thời gian giữ vé còn lại: {formatTime(timeLeft)}
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.detailsCard}>
        <ThemedText style={styles.detailRow}>**Mã đơn hàng (Order ID):** {paymentDetails.orderId}</ThemedText>
        <ThemedText style={styles.detailRow}>
          **Số tiền cần trả:** {paymentDetails.amount.toLocaleString('vi-VN')} VNĐ
        </ThemedText>
        <ThemedText style={styles.detailRow}>**Trạng thái thanh toán:** {paymentDetails.status}</ThemedText>
        {paymentDetails.paymentRef !== 'MOCK-TXN-PENDING' && (
          <ThemedText style={styles.detailRow}>**Mã giao dịch:** {paymentDetails.paymentRef}</ThemedText>
        )}
      </ThemedView>

      {(paymentDetails.status === 'PENDING' || paymentDetails.status === 'PENDING_PAYMENT') && !paying && !paymentDetails.paymentUrl && (
        <ThemedView style={styles.scenariosContainer}>
          <ThemedText style={styles.scenariosTitle}>Chọn kịch bản thanh toán (Mock Gateway):</ThemedText>
          
          <Pressable
            onPress={() => handleMockPayment('success')}
            style={[styles.payButton, { backgroundColor: '#43a047' }]}
          >
            <ThemedText style={styles.payButtonText}>✔️ Thành Công (Mock Success)</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => handleMockPayment('fail')}
            style={[styles.payButton, { backgroundColor: '#e53935' }]}
          >
            <ThemedText style={styles.payButtonText}>❌ Thất Bại (Mock Fail)</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => handleMockPayment('timeout')}
            style={[styles.payButton, { backgroundColor: '#ffb300' }]}
          >
            <ThemedText style={styles.payButtonText}>⚠️ Trễ mạng (Mock Gateway Timeout)</ThemedText>
          </Pressable>
        </ThemedView>
      )}

      {(paymentDetails.status === 'PENDING_PAYMENT') && paymentDetails.paymentUrl && (
        <ThemedView style={styles.scenariosContainer}>
          <ThemedText style={styles.scenariosTitle}>Nhấn vào liên kết để tiến hành thanh toán:</ThemedText>
          
          <Pressable
            onPress={handleOpenPaymentUrl}
            style={[styles.payButton, { backgroundColor: '#0052cc' }]}
          >
            <ThemedText style={styles.payButtonText}>💳 Thanh Toán Qua Cổng Stripe/Momo</ThemedText>
          </Pressable>
        </ThemedView>
      )}

      {paymentDetails.status === 'PROCESSING' && (
        <ThemedView style={styles.processingCard}>
          <ActivityIndicator size="large" color={theme.text} />
          <ThemedText style={styles.processingText}>
            Đang khởi tạo giao dịch thanh toán...
          </ThemedText>
          <ThemedText style={styles.pollingHint} themeColor="textSecondary">
            Hệ thống đang liên kết với cổng thanh toán bảo mật. Vui lòng giữ kết nối.
          </ThemedText>
        </ThemedView>
      )}

      {paying && (
        <ThemedView style={styles.processingCard}>
          <ActivityIndicator size="large" color={theme.text} />
          <ThemedText style={styles.processingText}>
            {mockScenario === 'timeout'
              ? 'Đang kết nối cổng thanh toán...'
              : 'Đang xử lý giao dịch & kiểm tra trạng thái vé...'}
          </ThemedText>
          {polling && (
            <ThemedText style={styles.pollingHint} themeColor="textSecondary">
              Đang đồng bộ trạng thái đơn hàng thời gian thực...
            </ThemedText>
          )}
        </ThemedView>
      )}

      {(paymentDetails.status === 'SUCCESS' || paymentDetails.status === 'COMPLETED') && (
        <ThemedView style={styles.successMessage}>
          <ThemedText style={styles.successText}>🎉 Đơn hàng đã được thanh toán thành công!</ThemedText>
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
