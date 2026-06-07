import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, ScrollView, View, ActivityIndicator, Image, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { concertService } from '@/services/concert';
import { Concert, TicketType } from '@/types/concert';

export default function ConcertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [concert, setConcert] = useState<Concert | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const detail = await concertService.getConcertDetail(id);
        setConcert(detail);
        
        const tickets = await concertService.getConcertTickets(id);
        setTicketTypes(tickets.ticketTypes);
      } catch (error) {
        console.error('Failed to load concert details', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin chi tiết sự kiện.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading || !concert) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </ThemedView>
    );
  }

  // Seating colors based on zone name
  const getZoneColor = (name: string, isSelected: boolean) => {
    const normalized = name.toUpperCase();
    if (normalized.includes('SVIP')) return isSelected ? '#ffd700' : '#fff9db';
    if (normalized.includes('VIP')) return isSelected ? '#9c27b0' : '#f3e5f5';
    return isSelected ? '#2196f3' : '#e3f2fd';
  };

  const getZoneBorderColor = (name: string) => {
    const normalized = name.toUpperCase();
    if (normalized.includes('SVIP')) return '#ffd700';
    if (normalized.includes('VIP')) return '#9c27b0';
    return '#2196f3';
  };

  return (
    <ScrollView style={styles.scrollView}>
      {concert.thumbnailUrl ? (
        <Image source={{ uri: concert.thumbnailUrl }} style={styles.banner} />
      ) : (
        <View style={styles.bannerPlaceholder} />
      )}

      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>{concert.title}</ThemedText>

        <ThemedView type="backgroundElement" style={styles.infoCard}>
          <ThemedText style={styles.infoText}>📍 **Địa điểm:** {concert.venue}</ThemedText>
          <ThemedText style={styles.infoText}>
            📅 **Thời gian:** {new Date(concert.startTime).toLocaleString('vi-VN')}
          </ThemedText>
          <ThemedText style={styles.infoText}>🎤 **Nghệ sĩ:** {concert.artists.join(', ')}</ThemedText>
        </ThemedView>

        {concert.description && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Giới Thiệu</ThemedText>
            <ThemedText style={styles.description}>{concert.description}</ThemedText>
          </>
        )}

        {concert.artist?.bio && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Thông Tin Nghệ Sĩ (AI Bio)</ThemedText>
            <ThemedText style={styles.artistBio}>{concert.artist.bio}</ThemedText>
          </>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Sơ Đồ Ghế Ngồi & Vé</ThemedText>
        <ThemedText style={styles.hintText} themeColor="textSecondary">
          * Chọn một phân khu trên sơ đồ để xem thông tin chi tiết và đặt vé.
        </ThemedText>

        {/* Interactive Mock Seat Map */}
        <ThemedView type="backgroundElement" style={styles.seatMapContainer}>
          {/* Stage representation */}
          <View style={styles.stage}>
            <ThemedText style={styles.stageText}>SÂN KHẤU CHÍNH (STAGE)</ThemedText>
          </View>

          {/* Seating Zones */}
          <View style={styles.zonesContainer}>
            {ticketTypes.map((type) => {
              const isSelected = selectedZone === type.id;
              const zoneColor = getZoneColor(type.name, isSelected);
              const borderColor = getZoneBorderColor(type.name);

              return (
                <Pressable
                  key={type.id}
                  onPress={() => setSelectedZone(type.id)}
                  style={[
                    styles.zoneBlock,
                    {
                      backgroundColor: zoneColor,
                      borderColor: borderColor,
                      borderWidth: isSelected ? 3 : 1.5,
                    },
                  ]}
                >
                  <ThemedText style={[styles.zoneName, { color: isSelected ? '#000' : '#555', fontWeight: 'bold' }]}>
                    Khu {type.name}
                  </ThemedText>
                  <ThemedText style={[styles.zoneSeats, { color: isSelected ? '#000' : '#666' }]}>
                    Còn: {type.availableSeats}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ThemedView>

        {/* Selected Zone Details */}
        {selectedZone && (() => {
          const activeType = ticketTypes.find(t => t.id === selectedZone);
          if (!activeType) return null;
          return (
            <ThemedView type="backgroundElement" style={styles.zoneDetailCard}>
              <ThemedText style={styles.zoneDetailTitle}>Hạng vé: {activeType.name}</ThemedText>
              <ThemedText style={styles.zoneDetailText}>
                Giá vé: **{activeType.price.toLocaleString('vi-VN')} VNĐ**
              </ThemedText>
              <ThemedText style={styles.zoneDetailText}>
                Số vé mua tối đa mỗi tài khoản: **{activeType.maxPerUser} vé**
              </ThemedText>
              <ThemedText style={styles.zoneDetailText}>
                Số ghế còn trống: **{activeType.availableSeats} chỗ**
              </ThemedText>
            </ThemedView>
          );
        })()}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#ccc',
  },
  container: {
    padding: Spacing.four,
    gap: Spacing.four,
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
    fontSize: 14.5,
    lineHeight: 22,
  },
  artistBio: {
    fontSize: 14.5,
    lineHeight: 22.5,
    marginTop: Spacing.one,
    textAlign: 'justify',
  },
  hintText: {
    fontSize: 12,
    marginTop: -Spacing.two,
  },
  seatMapContainer: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    gap: Spacing.four,
  },
  stage: {
    width: '90%',
    height: 40,
    backgroundColor: '#37474f',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.one,
  },
  stageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  zonesContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.two,
  },
  zoneBlock: {
    flex: 1,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
  },
  zoneName: {
    fontSize: 14,
  },
  zoneSeats: {
    fontSize: 11,
    marginTop: Spacing.one,
  },
  zoneDetailCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
  },
  zoneDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  zoneDetailText: {
    fontSize: 14.5,
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
