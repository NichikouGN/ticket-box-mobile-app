import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, ScrollView, View, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { concertService } from '@/services/concert';
import { orderService } from '@/services/order';
import { TicketType } from '@/types/concert';

// Zero-dependency client-side UUIDv4 generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function BookingScreen() {
  const { id: concertId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchTickets = async () => {
      if (!concertId) return;
      setLoading(true);
      try {
        const response = await concertService.getConcertTickets(concertId);
        setTicketTypes(response.ticketTypes);
      } catch (error) {
        console.error('Failed to load tickets', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách loại vé.');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [concertId]);

  const handleIncrement = (ticketTypeId: string, max: number) => {
    const current = quantities[ticketTypeId] || 0;
    if (current < max) {
      setQuantities({ ...quantities, [ticketTypeId]: current + 1 });
    } else {
      Alert.alert('Giới hạn', `Bạn chỉ được mua tối đa ${max} vé cho hạng vé này.`);
    }
  };

  const handleDecrement = (ticketTypeId: string) => {
    const current = quantities[ticketTypeId] || 0;
    if (current > 0) {
      setQuantities({ ...quantities, [ticketTypeId]: current - 1 });
    }
  };

  const calculateTotal = () => {
    return ticketTypes.reduce((sum, item) => {
      const quantity = quantities[item.id] || 0;
      return sum + quantity * item.price;
    }, 0);
  };

  const handleBook = async () => {
    const orderItems = ticketTypes
      .map((item) => ({
        concertId: concertId as string,
        ticketTypeId: item.id,
        quantity: quantities[item.id] || 0,
      }))
      .filter((item) => item.quantity > 0);

    if (orderItems.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một vé.');
      return;
    }

    setBooking(true);
    try {
      const idempotencyKey = generateUUID();
      const response = await orderService.createOrder(orderItems, idempotencyKey);
      
      if (response.success && response.orderId) {
        router.push(`/(user)/payment/${response.orderId}`);
      } else {
        Alert.alert('Đặt Vé Thất Bại', response.message || 'Yêu cầu của bạn không thể xử lý.');
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra trong quá trình đặt giữ vé. Vui lòng thử lại.';
      Alert.alert('Lỗi đặt vé', errorMsg);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">Chọn Loại Vé</ThemedText>

        <ThemedView style={styles.ticketTypesList}>
          {ticketTypes.map((item) => {
            const qty = quantities[item.id] || 0;
            return (
              <ThemedView key={item.id} type="backgroundElement" style={styles.ticketCard}>
                <View style={styles.ticketInfoContainer}>
                  <ThemedText style={styles.ticketName}>{item.name}</ThemedText>
                  <ThemedText style={styles.ticketPrice}>
                    {item.price.toLocaleString('vi-VN')} VNĐ
                  </ThemedText>
                  <ThemedText style={styles.ticketInfo} themeColor="textSecondary">
                    Còn lại: {item.availableSeats} | Giới hạn: {item.maxPerUser}
                  </ThemedText>
                </View>

                <View style={styles.counterContainer}>
                  <Pressable onPress={() => handleDecrement(item.id)} style={styles.counterButton}>
                    <ThemedText style={styles.counterButtonText}>-</ThemedText>
                  </Pressable>
                  <ThemedText style={styles.counterValue}>{qty}</ThemedText>
                  <Pressable onPress={() => handleIncrement(item.id, item.maxPerUser)} style={styles.counterButton}>
                    <ThemedText style={styles.counterButtonText}>+</ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            );
          })}
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText type="subtitle">Tổng Tiền: {calculateTotal().toLocaleString('vi-VN')} VNĐ</ThemedText>
          <Pressable
            onPress={handleBook}
            disabled={booking || calculateTotal() === 0}
            style={({ pressed }) => [
              styles.bookButton,
              (booking || calculateTotal() === 0) && styles.bookButtonDisabled,
              pressed && styles.bookButtonPressed,
            ]}
          >
            {booking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.bookButtonText}>Tiến Hành Đặt Chỗ</ThemedText>
            )}
          </Pressable>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  ticketTypesList: {
    gap: Spacing.three,
  },
  ticketCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  ticketInfoContainer: {
    flex: 1,
    marginRight: Spacing.two,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ticketPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: Spacing.one,
  },
  ticketInfo: {
    fontSize: 12,
    marginTop: Spacing.one,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  footer: {
    marginTop: Spacing.four,
    gap: Spacing.three,
    backgroundColor: 'transparent',
  },
  bookButton: {
    height: 50,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
  },
  bookButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  bookButtonPressed: {
    opacity: 0.8,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
