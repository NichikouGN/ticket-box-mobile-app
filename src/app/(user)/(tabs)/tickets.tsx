import React from 'react';
import { StyleSheet, FlatList, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const DUMMY_TICKETS = [
  {
    ticket_id: 'tkt-uuid-1',
    concert_title: 'Anh Trai Say Hi - Đêm Đỉnh Cao',
    event_date: '2026-07-15T18:00:00Z',
    venue: 'Sân vận động Quân khu 7, TP.HCM',
    ticket_type: 'VIP',
    holder_name: 'Nguyễn Văn A',
    used: false,
  }
];

export default function MyTicketsScreen() {
  const renderItem = ({ item }: { item: typeof DUMMY_TICKETS[0] }) => (
    <Pressable style={styles.ticketCard}>
      <ThemedView style={styles.ticketHeader}>
        <ThemedText style={styles.ticketType}>{item.ticket_type}</ThemedText>
        <ThemedText style={[styles.statusText, { color: item.used ? '#e53935' : '#43a047' }]}>
          {item.used ? 'Đã sử dụng' : 'Chưa sử dụng'}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.ticketBody}>
        <ThemedText type="subtitle" style={styles.concertTitle}>{item.concert_title}</ThemedText>
        <ThemedText style={styles.infoText} themeColor="textSecondary">📍 {item.venue}</ThemedText>
        <ThemedText style={styles.infoText} themeColor="textSecondary">📅 {new Date(item.event_date).toLocaleString('vi-VN')}</ThemedText>
        <ThemedText style={styles.infoText} themeColor="textSecondary">👤 Người sở hữu: {item.holder_name}</ThemedText>
      </ThemedView>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={DUMMY_TICKETS}
        keyExtractor={(item) => item.ticket_id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
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
    borderColor: '#e0e0e0',
    borderRadius: Spacing.two,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.two,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  ticketType: {
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketBody: {
    padding: Spacing.three,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  concertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  infoText: {
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
});
