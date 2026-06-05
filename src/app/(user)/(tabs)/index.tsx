import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, Pressable, Image, ActivityIndicator, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { concertService } from '@/services/concert';
import { Concert } from '@/types/concert';

export default function ConcertListScreen() {
  const router = useRouter();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConcerts = async (pageNum: number, isRefresh = false) => {
    if (pageNum === 1) {
      if (isRefresh) setRefreshing(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await concertService.getConcerts(pageNum, 10);
      if (response.success) {
        if (pageNum === 1) {
          setConcerts(response.data);
        } else {
          setConcerts((prev) => [...prev, ...response.data]);
        }
        setPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPage);
      }
    } catch (error) {
      console.error('Failed to load concerts', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConcerts(1);
  }, []);

  const handleRefresh = () => {
    fetchConcerts(1, true);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore && !loading) {
      fetchConcerts(page + 1);
    }
  };

  const filteredConcerts = concerts.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.artists.some((artist) => artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderItem = ({ item }: { item: Concert }) => (
    <Pressable
      onPress={() => router.push(`/(user)/concert/${item.id}`)}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder} />
      )}
      <ThemedView style={styles.cardInfo}>
        <ThemedText type="subtitle" style={styles.cardTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.artists} themeColor="textSecondary">
          Nghệ sĩ: {item.artists.join(', ')}
        </ThemedText>
        <ThemedText style={styles.venue} themeColor="textSecondary">
          📍 {item.venue}
        </ThemedText>
        <ThemedText style={styles.time} themeColor="textSecondary">
          📅 {new Date(item.startTime).toLocaleString('vi-VN')}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sự kiện, nghệ sĩ..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={filteredConcerts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText themeColor="textSecondary">Không tìm thấy sự kiện nào.</ThemedText>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#000" />
              </View>
            ) : null
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#fff',
    color: '#000',
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.four,
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
  thumbnailPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#ccc',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
});
