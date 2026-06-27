import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View, ScrollView, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams } from 'expo-router';
import { ticketService } from '@/services/ticket';
import { TicketPayload } from '@/types/ticket';
import { useTheme } from '@/hooks/use-theme';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';

export default function TicketDetailScreen() {
  const { id: ticketId } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [payload, setPayload] = useState<TicketPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrRaw, setQrRaw] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketDetail = async () => {
      if (!ticketId) return;
      setLoading(true);
      try {
        const detail = await ticketService.getTicketDetail(ticketId);
        setPayload(detail);
        // Standard Ed25519 requires passing the whole object { ticket, signature } as the QR value
        setQrRaw(JSON.stringify(detail));
      } catch (error) {
        console.error('Failed to load ticket detail', error);
        Alert.alert('Lỗi', 'Không thể tải chi tiết vé.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetail();
  }, [ticketId]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.text} />
      </ThemedView>
    );
  }

  if (!payload || !payload.ticket) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText themeColor="textSecondary">Không tìm thấy thông tin vé.</ThemedText>
      </ThemedView>
    );
  }

  const { ticket } = payload;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        {/* Outer Ticket Card */}
        <ThemedView 
          type="backgroundElement" 
          style={[
            styles.ticketCard, 
            { borderColor: theme.backgroundSelected }
          ]}
        >
          {/* Header */}
          <ThemedView type="backgroundSelected" style={styles.header}>
            <ThemedText style={styles.concertTitle} type="smallBold">
              Vé Xem Ca Nhạc
            </ThemedText>
          </ThemedView>

          {/* QR Code Container */}
          <View style={styles.qrSection}>
            {qrRaw ? (
              <View style={styles.qrWrapper}>
                <QRCode
                  value={qrRaw}
                  size={200}
                  color="#000000"
                  backgroundColor="#ffffff"
                />
              </View>
            ) : (
              <ActivityIndicator size="small" color="#000" />
            )}
            <ThemedText style={styles.qrHint} themeColor="textSecondary">
              Quét mã này tại cổng soát vé để vào sự kiện (Mã QR ký số ED25519)
            </ThemedText>
            {qrRaw && (
              <Pressable
                onPress={async () => {
                  await Clipboard.setStringAsync(qrRaw);
                  Alert.alert('Đã Sao Chép', 'Đã sao chép raw QR token (JSON chứa ticket & signature) để test check-in.');
                }}
                style={({ pressed }) => [
                  styles.copyDevButton,
                  pressed && styles.copyDevButtonPressed,
                ]}
              >
                <ThemedText style={styles.copyDevButtonText}>📋 Sao chép Raw QR (Dev Test)</ThemedText>
              </Pressable>
            )}
          </View>

          {/* Ticket Information */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <ThemedText style={styles.label} themeColor="textSecondary">MÃ VÉ (TICKET ID)</ThemedText>
                <ThemedText style={[styles.value, styles.ticketIdText]} numberOfLines={1}>
                  {ticket.ticketId}
                </ThemedText>
              </View>
              <View style={styles.infoCol}>
                <ThemedText style={styles.label} themeColor="textSecondary">KHÁN GIẢ ID</ThemedText>
                <ThemedText style={[styles.value, styles.ticketIdText]} numberOfLines={1}>
                  {ticket.userId}
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <ThemedText style={styles.label} themeColor="textSecondary">SỰ KIỆN ID (CONCERT ID)</ThemedText>
                <ThemedText style={[styles.value, styles.ticketIdText]} numberOfLines={1}>
                  {ticket.concertId}
                </ThemedText>
              </View>
              <View style={styles.infoCol}>
                <ThemedText style={styles.label} themeColor="textSecondary">HẠNG VÉ ID</ThemedText>
                <ThemedText style={[styles.value, styles.ticketIdText]} numberOfLines={1}>
                  {ticket.ticketTypeId}
                </ThemedText>
              </View>
            </View>
          </View>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  ticketCard: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    padding: Spacing.three,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  concertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'transparent',
  },
  qrWrapper: {
    padding: Spacing.three,
    backgroundColor: '#ffffff',
    borderRadius: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: Spacing.two,
  },
  qrHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  infoSection: {
    padding: Spacing.three,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'transparent',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  infoCol: {
    flex: 1,
    gap: Spacing.half,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  ticketIdText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: Spacing.two,
  },
  copyDevButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
  },
  copyDevButtonPressed: {
    opacity: 0.8,
  },
  copyDevButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

