import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function CheckinStatsScreen() {
  // Mock data for Phase 1
  const stats = {
    total_tickets: 5000,
    checked_in: 3240,
    remaining: 1760,
    by_ticket_type: [
      { name: 'VIP', total: 500, checked_in: 480 },
      { name: 'GA', total: 4500, checked_in: 2760 }
    ]
  };

  const getPercentage = (val: number, total: number) => {
    return total > 0 ? Math.round((val / total) * 100) : 0;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Thống Kê Soát Vé</ThemedText>
      
      <ThemedView type="backgroundElement" style={styles.summaryContainer}>
        <View style={styles.statBox}>
          <ThemedText style={styles.statNumber}>{stats.total_tickets}</ThemedText>
          <ThemedText style={styles.statLabel} themeColor="textSecondary">Tổng số vé</ThemedText>
        </View>

        <View style={styles.statBox}>
          <ThemedText style={[styles.statNumber, { color: '#43a047' }]}>
            {stats.checked_in}
          </ThemedText>
          <ThemedText style={styles.statLabel} themeColor="textSecondary">Đã check-in</ThemedText>
        </View>

        <View style={styles.statBox}>
          <ThemedText style={[styles.statNumber, { color: '#e53935' }]}>
            {stats.remaining}
          </ThemedText>
          <ThemedText style={styles.statLabel} themeColor="textSecondary">Chưa check-in</ThemedText>
        </View>
      </ThemedView>

      <ThemedText type="subtitle" style={styles.sectionTitle}>Chi Tiết Theo Hạng Vé</ThemedText>
      
      <View style={styles.detailsList}>
        {stats.by_ticket_type.map((type) => {
          const percent = getPercentage(type.checked_in, type.total);
          return (
            <ThemedView key={type.name} type="backgroundElement" style={styles.typeRow}>
              <View style={styles.rowInfo}>
                <ThemedText style={styles.typeName}>{type.name}</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {type.checked_in}/{type.total} ({percent}%)
                </ThemedText>
              </View>
              {/* Progress bar */}
              <View style={styles.progressBackground}>
                <View style={[styles.progressBar, { width: `${percent}%` }]} />
              </View>
            </ThemedView>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  statBox: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: Spacing.two,
  },
  detailsList: {
    gap: Spacing.three,
  },
  typeRow: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  rowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
  },
});
