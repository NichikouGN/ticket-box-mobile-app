import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, ActivityIndicator, Pressable, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { checkinService } from '@/services/checkin';
import { CheckinStats } from '@/types/checkin';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';

export default function CheckinStatsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { logout } = useAuth();
  const { concertId, concertTitle } = useLocalSearchParams<{ concertId: string; concertTitle: string }>();

  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!concertId) return;
    try {
      const data = await checkinService.getStats(concertId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load check-in stats', error);
      Alert.alert('Lỗi', 'Không thể tải thống kê soát vé.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concertId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const getPercentage = (val: number, total: number) => {
    return total > 0 ? Math.round((val / total) * 100) : 0;
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText style={{ marginTop: Spacing.two }}>Đang tải số liệu thống kê...</ThemedText>
      </ThemedView>
    );
  }

  if (!stats) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText themeColor="textSecondary">Không tìm thấy dữ liệu thống kê.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.text} />
      }
    >
      <ThemedView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <ThemedText type="subtitle" style={styles.title}>Thống Kê Soát Vé</ThemedText>
            <ThemedText style={styles.concertTitle} numberOfLines={1} themeColor="textSecondary">
              📌 {concertTitle || 'Sự Kiện Đã Chọn'}
            </ThemedText>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <ThemedText style={styles.logoutButtonText}>🚪 Đăng Xuất</ThemedText>
          </Pressable>
        </View>

        {/* Dashboard Grid Cards */}
        <View style={styles.cardsGrid}>
          {/* Card 1: Tổng số vé phát hành */}
          <ThemedView type="backgroundElement" style={[styles.largeCard, { borderColor: '#1e88e5', borderLeftWidth: 5 }]}>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardIcon}>🎟️</ThemedText>
              <ThemedText style={styles.cardLabel} themeColor="textSecondary">TỔNG SỐ VÉ PHÁT HÀNH</ThemedText>
            </View>
            <ThemedText style={[styles.cardValue, { color: '#1e88e5' }]}>{stats.totalTickets}</ThemedText>
          </ThemedView>

          <View style={styles.halfCardsRow}>
            {/* Card 2: Số vé đã quét */}
            <ThemedView type="backgroundElement" style={[styles.halfCard, { borderColor: '#43a047', borderLeftWidth: 5 }]}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardIcon}>✅</ThemedText>
                <ThemedText style={styles.cardLabel} themeColor="textSecondary">ĐÃ SOÁT VÉ</ThemedText>
              </View>
              <ThemedText style={[styles.cardValue, { color: '#43a047' }]}>{stats.checkedInTickets}</ThemedText>
            </ThemedView>

            {/* Card 3: Số vé chưa quét */}
            <ThemedView type="backgroundElement" style={[styles.halfCard, { borderColor: stats.remainingTickets > 0 ? '#e53935' : '#757575', borderLeftWidth: 5 }]}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardIcon}>⏳</ThemedText>
                <ThemedText style={styles.cardLabel} themeColor="textSecondary">CHƯA SOÁT VÉ</ThemedText>
              </View>
              <ThemedText style={[styles.cardValue, { color: stats.remainingTickets > 0 ? '#e53935' : '#757575' }]}>
                {stats.remainingTickets}
              </ThemedText>
            </ThemedView>
          </View>
        </View>

        {/* Progress Circle Visual Simulation */}
        <ThemedView type="backgroundElement" style={styles.visualCard}>
          <ThemedText style={styles.visualTitle}>Tỷ lệ soát vé tại cổng</ThemedText>
          <ThemedText style={styles.visualPercent}>
            {getPercentage(stats.checkedInTickets, stats.totalTickets)}%
          </ThemedText>
          <ThemedText style={styles.visualSubtitle} themeColor="textSecondary">
            Số vé đã check-in trên tổng lượng phát hành
          </ThemedText>
        </ThemedView>

        {/* Ticket category Breakdown */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>CHI TIẾT THEO HẠNG VÉ</ThemedText>
        
        <View style={styles.detailsList}>
          <ThemedView 
            type="backgroundElement" 
            style={[styles.typeRow, { borderColor: theme.backgroundSelected, padding: Spacing.four, alignItems: 'center' }]}
          >
            <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', fontSize: 13.5 }}>
              Phân rã chi tiết theo từng hạng vé chưa được hỗ trợ trực tiếp từ API Gateway của hệ thống.
            </ThemedText>
          </ThemedView>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: Spacing.two,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  concertTitle: {
    fontSize: 13,
    marginTop: Spacing.half,
  },
  logoutButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#e53935',
  },
  logoutButtonText: {
    color: '#e53935',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cardsGrid: {
    gap: Spacing.three,
  },
  largeCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
  },
  halfCardsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  halfCard: {
    flex: 1,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  cardIcon: {
    fontSize: 16,
  },
  cardLabel: {
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: Spacing.two,
  },
  visualCard: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 160,
  },
  visualTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  visualPercent: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '900',
    color: '#1e88e5',
  },
  visualSubtitle: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: Spacing.two,
  },
  detailsList: {
    gap: Spacing.three,
  },
  typeRow: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.two,
  },
  rowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeName: {
    fontWeight: 'bold',
    fontSize: 15.5,
  },
  typeStats: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
});
