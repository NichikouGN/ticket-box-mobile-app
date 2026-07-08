import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  ActivityIndicator,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams, Stack } from 'expo-router';
import { vipService } from '@/services/vip';
import { VipGuest } from '@/types/vip';
import { useTheme } from '@/hooks/use-theme';

export default function VipCheckinScreen() {
  const theme = useTheme();
  const { concertId, concertTitle } = useLocalSearchParams<{ concertId: string; concertTitle?: string }>();

  // States
  const [vipGuests, setVipGuests] = useState<VipGuest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50; // Fetch a large chunk for better local searching/sorting

  const fetchVipGuests = async (reset = false) => {
    if (!concertId) return;

    try {
      const targetPage = reset ? 1 : page;
      setLoading(true);

      const response = await vipService.getVipGuests(concertId, targetPage, LIMIT);
      const fetchedGuests = response.data || [];

      // Defensive check: print warning if backend fails to return IDs
      const hasMissingIds = fetchedGuests.some(g => !g.id);
      if (hasMissingIds) {
        console.warn('Backend warning: Some VIP guests are missing the "id" field in the list response.');
      }

      if (reset) {
        setVipGuests(fetchedGuests);
        setPage(2);
      } else {
        setVipGuests(prev => [...prev, ...fetchedGuests]);
        setPage(prev => prev + 1);
      }

      setHasMore(fetchedGuests.length === LIMIT);
    } catch (error) {
      console.error('Failed to fetch VIP guests:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách khách VIP. Vui lòng kéo để làm mới.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVipGuests(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concertId]);

  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    fetchVipGuests(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchVipGuests(false);
    }
  };

  const handleCheckIn = (guest: VipGuest) => {
    const guestId = guest.id;
    
    if (!guestId) {
      Alert.alert(
        'Lỗi Hệ Thống',
        'Không tìm thấy ID của khách VIP từ API (Lỗi mapping ID ở backend). Hãy báo Backend sửa tệp VipRepository.getVipGuestsByConcertId.'
      );
      return;
    }

    Alert.alert(
      'Xác Nhận Check-in',
      `Bạn có chắc chắn muốn xác nhận check-in cho khách VIP:\n\n👤 ${guest.fullName}\n📧 ${guest.email}\n🏢 Đối tác: ${guest.sponsor}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác Nhận',
          style: 'default',
          onPress: async () => {
            try {
              setCheckingInId(guestId);
              const response = await vipService.checkInVip(concertId, guestId);
              
              if (response.success) {
                // Update local state immediately
                setVipGuests(prev =>
                  prev.map(g =>
                    g.id === guestId
                      ? { ...g, checkedInAt: new Date().toISOString() }
                      : g
                  )
                );
                Alert.alert('Thành Công', 'Đã check-in khách VIP thành công!');
              }
            } catch (error: any) {
              console.error('Check-in VIP failed:', error);
              const statusCode = error.response?.status;

              if (statusCode === 400) {
                // Already checked-in error
                Alert.alert('Cảnh Báo', 'Khách VIP này đã được check-in trước đó.');
                setVipGuests(prev =>
                  prev.map(g =>
                    g.id === guestId
                      ? { ...g, checkedInAt: g.checkedInAt || new Date().toISOString() }
                      : g
                  )
                );
              } else if (statusCode === 404) {
                Alert.alert('Thất Bại', 'Không tìm thấy thông tin khách VIP này trên hệ thống.');
              } else {
                Alert.alert('Lỗi Kết Nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.');
              }
            } finally {
              setCheckingInId(null);
            }
          },
        },
      ]
    );
  };

  // Local client-side filtering on search string
  const filteredGuests = vipGuests.filter(guest => {
    const q = searchQuery.toLowerCase();
    const fullName = guest.fullName || '';
    const email = guest.email || '';
    const sponsor = guest.sponsor || '';
    return (
      fullName.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      sponsor.toLowerCase().includes(q)
    );
  });

  const formatCheckInTime = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const renderGuestItem = ({ item }: { item: VipGuest }) => {
    const isCheckedIn = item.checkedInAt !== null;
    const isCheckingIn = checkingInId === item.id;

    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.cardContent}>
          <ThemedText style={styles.guestName}>{item.fullName}</ThemedText>
          <ThemedText style={styles.guestEmail} themeColor="textSecondary">
            {item.email}
          </ThemedText>
          <View style={styles.sponsorBadge}>
            <ThemedText style={styles.sponsorText} themeColor="textSecondary">
              🏢 {item.sponsor}
            </ThemedText>
          </View>
        </View>

        <View style={styles.actionContainer}>
          {isCheckedIn ? (
            <View style={styles.checkedInBadge}>
              <ThemedText style={styles.checkedInText}>✓ Đã Vào</ThemedText>
              <ThemedText style={styles.checkedInTime}>
                ({formatCheckInTime(item.checkedInAt)})
              </ThemedText>
            </View>
          ) : (
            <Pressable
              onPress={() => handleCheckIn(item)}
              disabled={isCheckingIn}
              style={({ pressed }) => [
                styles.checkInButton,
                pressed && { opacity: 0.8 },
                isCheckingIn && { opacity: 0.5 },
              ]}
            >
              {isCheckingIn ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.checkInButtonText}>Vào Cổng</ThemedText>
              )}
            </Pressable>
          )}
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: concertTitle ? `VIP - ${concertTitle}` : 'Soát Vé VIP',
          headerShown: true,
        }}
      />

      {/* Search Input Section */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Tìm theo tên, email hoặc đối tác..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.backgroundElement }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* List Section */}
      <FlatList
        data={filteredGuests}
        keyExtractor={(item, index) => item.id || `${item.email}-${index}`}
        renderItem={renderGuestItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.text]}
            tintColor={theme.text}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText} themeColor="textSecondary">
                {searchQuery ? 'Không tìm thấy khách VIP phù hợp' : 'Danh sách khách VIP trống'}
              </ThemedText>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.text} />
            </View>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: Spacing.three,
  },
  searchInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 14.5,
  },
  listContent: {
    padding: Spacing.three,
    paddingTop: 0,
    gap: Spacing.three,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardContent: {
    flex: 1,
    gap: Spacing.one,
    paddingRight: Spacing.two,
  },
  guestName: {
    fontSize: 15.5,
    fontWeight: 'bold',
  },
  guestEmail: {
    fontSize: 12.5,
  },
  sponsorBadge: {
    flexDirection: 'row',
    marginTop: Spacing.one,
  },
  sponsorText: {
    fontSize: 12,
  },
  actionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 100,
  },
  checkInButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  checkInButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  checkedInBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  checkedInText: {
    color: '#43a047',
    fontWeight: 'bold',
    fontSize: 13.5,
  },
  checkedInTime: {
    color: '#43a047',
    fontSize: 11,
  },
  emptyContainer: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  footerLoader: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
