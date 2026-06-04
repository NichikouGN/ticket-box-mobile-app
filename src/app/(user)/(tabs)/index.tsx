import React from 'react';
import { StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';

// Dummy data for testing Phase 1
const DUMMY_CONCERTS = [
  {
    id: 'c3b07384-d113-4e31-92f7-e43598d9e2d3',
    title: 'Anh Trai Say Hi - Đêm Đỉnh Cao',
    artists: ['HIEUTHUHAI', 'Rhyder', 'Captain'],
    venue: 'Sân vận động Quân khu 7, TP.HCM',
    start_time: '2026-07-15T19:00:00Z',
    status: 'UPCOMING',
    thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
  },
  {
    id: 'concert-2',
    title: 'Chị Đẹp Đạp Gió Rẽ Sóng 2026',
    artists: ['Mỹ Linh', 'Thu Phương', 'Lệ Quyên'],
    venue: 'Sân vận động Mỹ Đình, Hà Nội',
    start_time: '2026-08-20T18:30:00Z',
    status: 'UPCOMING',
    thumbnail_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500',
  }
];

export default function ConcertListScreen() {
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof DUMMY_CONCERTS[0] }) => (
    <Pressable
      onPress={() => router.push(`/(user)/concert/${item.id}`)}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
      <ThemedView style={styles.cardInfo}>
        <ThemedText type="subtitle" style={styles.cardTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.artists} themeColor="textSecondary">
          Nghệ sĩ: {item.artists.join(', ')}
        </ThemedText>
        <ThemedText style={styles.venue} themeColor="textSecondary">
          📍 {item.venue}
        </ThemedText>
        <ThemedText style={styles.time} themeColor="textSecondary">
          📅 {new Date(item.start_time).toLocaleString('vi-VN')}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={DUMMY_CONCERTS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <ThemedText type="title" style={styles.headerTitle}>Sự Kiện Sắp Diễn Ra</ThemedText>
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
    gap: Spacing.four,
  },
  headerTitle: {
    marginBottom: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  cardPressed: {
    opacity: 0.9,
  },
  thumbnail: {
    width: '100%',
    height: 180,
  },
  cardInfo: {
    padding: Spacing.three,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  artists: {
    fontSize: 14,
  },
  venue: {
    fontSize: 14,
    marginTop: Spacing.one,
  },
  time: {
    fontSize: 13,
  },
});
