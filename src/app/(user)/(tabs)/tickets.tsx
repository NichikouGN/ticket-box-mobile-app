import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useFocusEffect, useRouter } from 'expo-router';
import { ticketService } from '@/services/ticket';
import { Ticket } from '@/types/ticket';
import { useTheme } from '@/hooks/use-theme';

export default function MyTicketsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await ticketService.getTickets(1, 100);
      setTickets(data.tickets);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách vé của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Ticket }) => {
    const isUsed = item.status === 'USED';
    const ticketName = item.ticketName || `Hạng vé: ${item.ticketTypeId.substring(0, 8)}...`;
    const concertTitle = item.concertDetails?.title || `Sự kiện: ${item.concertId.substring(0, 8)}...`;
    const venue = item.concertDetails?.venue || 'Địa điểm: Đang cập nhật';

    let eventDateStr = 'Thời gian: Đang cập nhật';
    if (item.concertDetails?.eventDate) {
      try {
        eventDateStr = new Date(item.concertDetails.eventDate).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      } catch (e) {
        console.warn('Invalid event date:', item.concertDetails.eventDate, e);
      }
    }

    return (
      <Pressable
        onPress={() => router.push(`/(user)/ticket/${item.ticketId}`)}
        style={({ pressed }) => [
          styles.ticketCard,
          { 
            backgroundColor: theme.backgroundElement,
            borderColor: theme.backgroundSelected,
          },
          pressed && styles.ticketCardPressed,
        ]}
      >
        <ThemedView type="backgroundSelected" style={styles.ticketHeader}>
          <ThemedText style={styles.ticketType}>{ticketName}</ThemedText>
          <ThemedText style={[styles.statusText, { color: isUsed ? '#e53935' : '#43a047' }]}>
            {isUsed ? 'Đã soát vé' : 'Chưa soát vé'}
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.ticketBody}>
          <ThemedText type="smallBold" style={styles.concertTitle}>{concertTitle}</ThemedText>
          <ThemedText style={styles.infoText} themeColor="textSecondary">📍 {venue}</ThemedText>
          <ThemedText style={styles.infoText} themeColor="textSecondary">📅 Biểu diễn: {eventDateStr}</ThemedText>
          <ThemedText style={[styles.infoText, { fontSize: 11, marginTop: Spacing.half }]} themeColor="textSecondary">
            Mã Vé: {item.ticketId}
          </ThemedText>
        </ThemedView>
      </Pressable>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.text} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.ticketId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText themeColor="textSecondary">Bạn chưa sở hữu vé nào.</ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  ticketCard: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  ticketCardPressed: {
    opacity: 0.9,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  ticketType: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  ticketBody: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  concertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  infoText: {
    fontSize: 13.5,
  },
  emptyContainer: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
