import React from 'react';
import { StyleSheet, Pressable, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ConcertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Simulated concert detail
  const concert = {
    id: id,
    title: 'Anh Trai Say Hi - Đêm Đỉnh Cao',
    description: 'Đêm nhạc hội ngộ của các anh trai được yêu thích nhất. Với sự hỗ trợ của các cố vấn nghệ thuật và nghệ sĩ khách mời đặc biệt. Hệ thống AI Summary: Đây là một concert nhạc pop trẻ trung, bùng nổ, quy tụ hàng loạt gương mặt nghệ sĩ hàng đầu Việt Nam hiện nay.',
    artists: ['HIEUTHUHAI', 'Rhyder', 'Captain', 'NEGAV'],
    venue: 'Sân vận động Quân khu 7, TP.HCM',
    start_time: '2026-07-15T19:00:00Z',
  };

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <View style={styles.headerSpacer} />
        
        <ThemedText type="title" style={styles.title}>{concert.title}</ThemedText>

        <ThemedView type="backgroundElement" style={styles.infoCard}>
          <ThemedText style={styles.infoText}>📍 **Địa điểm:** {concert.venue}</ThemedText>
          <ThemedText style={styles.infoText}>📅 **Thời gian:** {new Date(concert.start_time).toLocaleString('vi-VN')}</ThemedText>
          <ThemedText style={styles.infoText}>🎤 **Nghệ sĩ:** {concert.artists.join(', ')}</ThemedText>
        </ThemedView>

        <ThemedText type="subtitle" style={styles.sectionTitle}>Giới Thiệu Sự Kiện</ThemedText>
        <ThemedText style={styles.description}>{concert.description}</ThemedText>

        <Pressable
          onPress={() => router.push(`/(user)/booking/${concert.id}`)}
          style={({ pressed }) => [
            styles.bookButton,
            pressed && styles.bookButtonPressed,
          ]}
        >
          <ThemedText style={styles.bookButtonText}>Mua Vé Ngay</ThemedText>
        </Pressable>
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
  headerSpacer: {
    height: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  infoCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  infoText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: Spacing.two,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  bookButton: {
    height: 50,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
    marginTop: Spacing.four,
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
