import React, { useState } from 'react';
import { StyleSheet, Pressable, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Dummy ticket types for testing Phase 1
const DUMMY_TICKET_TYPES = [
  { id: 't1', name: 'SVIP', price: 3500000, max_per_user: 2, available_seats: 145 },
  { id: 't2', name: 'GA', price: 800000, max_per_user: 4, available_seats: 2301 }
];

export default function BookingScreen() {
  const { id: _concertId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleIncrement = (ticketTypeId: string, max: number) => {
    const current = quantities[ticketTypeId] || 0;
    if (current < max) {
      setQuantities({ ...quantities, [ticketTypeId]: current + 1 });
    }
  };

  const handleDecrement = (ticketTypeId: string) => {
    const current = quantities[ticketTypeId] || 0;
    if (current > 0) {
      setQuantities({ ...quantities, [ticketTypeId]: current - 1 });
    }
  };

  const calculateTotal = () => {
    return DUMMY_TICKET_TYPES.reduce((sum, item) => {
      const quantity = quantities[item.id] || 0;
      return sum + quantity * item.price;
    }, 0);
  };

  const handleBook = () => {
    const hasTickets = Object.values(quantities).some(q => q > 0);
    if (!hasTickets) return;

    // Phase 4 will call /api/v1/orders with Idempotency-Key
    // Let's generate a mock orderId
    const mockOrderId = '8b2c6e3c-fa52-474c-83b0-0b6c62bb1e89';
    router.push(`/(user)/payment/${mockOrderId}`);
  };

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">Chọn Loại Vé</ThemedText>

        <ThemedView style={styles.ticketTypesList}>
          {DUMMY_TICKET_TYPES.map((item) => {
            const qty = quantities[item.id] || 0;
            return (
              <ThemedView key={item.id} type="backgroundElement" style={styles.ticketCard}>
                <View>
                  <ThemedText style={styles.ticketName}>{item.name}</ThemedText>
                  <ThemedText style={styles.ticketPrice}>
                    {item.price.toLocaleString('vi-VN')} VNĐ
                  </ThemedText>
                  <ThemedText style={styles.ticketInfo} themeColor="textSecondary">
                    Còn lại: {item.available_seats} | Tối đa: {item.max_per_user}
                  </ThemedText>
                </View>

                <View style={styles.counterContainer}>
                  <Pressable onPress={() => handleDecrement(item.id)} style={styles.counterButton}>
                    <ThemedText style={styles.counterButtonText}>-</ThemedText>
                  </Pressable>
                  <ThemedText style={styles.counterValue}>{qty}</ThemedText>
                  <Pressable onPress={() => handleIncrement(item.id, item.max_per_user)} style={styles.counterButton}>
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
            disabled={calculateTotal() === 0}
            style={({ pressed }) => [
              styles.bookButton,
              calculateTotal() === 0 && styles.bookButtonDisabled,
              pressed && styles.bookButtonPressed,
            ]}
          >
            <ThemedText style={styles.bookButtonText}>Tiến Hành Đặt Chỗ</ThemedText>
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
