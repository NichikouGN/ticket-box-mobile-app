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
      const data = await ticketService.getTickets();
      setTickets(data);
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

  const renderItem = ({ item }: { item: Ticket }) => (
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
        <ThemedText style={styles.ticketType}>{item.ticketType}</ThemedText>
        <ThemedText style={[styles.statusText, { color: item.used ? '#e53935' : '#43a047' }]}>
          {item.used ? 'Đã soát vé' : 'Chưa soát vé'}
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.ticketBody}>
        <ThemedText type="smallBold" style={styles.concertTitle}>{item.concertTitle}</ThemedText>
        <ThemedText style={styles.infoText} themeColor="textSecondary">📍 {item.venue}</ThemedText>
        <ThemedText style={styles.infoText} themeColor="textSecondary">
          📅 {new Date(item.eventDate).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </ThemedText>
        <ThemedText style={styles.infoText} themeColor="textSecondary">👤 Khán giả: {item.holderName}</ThemedText>
      </ThemedView>
    </Pressable>
  );

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
