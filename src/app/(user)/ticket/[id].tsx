import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View, ScrollView, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLocalSearchParams } from 'expo-router';
import { ticketService } from '@/services/ticket';
import { concertService } from '@/services/concert';
import { TicketPayload } from '@/types/ticket';
import { useTheme } from '@/hooks/use-theme';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { File, Paths, EncodingType } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';

export default function TicketDetailScreen() {
  const { id: ticketId } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [payload, setPayload] = useState<TicketPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrRaw, setQrRaw] = useState<string | null>(null);
  const qrRef = useRef<any>(null);
  const [savingQr, setSavingQr] = useState(false);
  const [concertTitle, setConcertTitle] = useState<string>('');

  useEffect(() => {
    const fetchTicketDetail = async () => {
      if (!ticketId) return;
      setLoading(true);
      try {
        const detail = await ticketService.getTicketDetail(ticketId);
        setPayload(detail);
        setQrRaw(JSON.stringify(detail));

        if (detail.ticket && detail.ticket.concertId) {
          try {
            const concert = await concertService.getConcertDetail(detail.ticket.concertId);
            setConcertTitle(concert.title);
          } catch (cErr) {
            console.warn('[TicketDetail] Failed to load concert title', cErr);
          }
        }
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

  const handleSaveQr = async () => {
    if (!qrRef.current || !payload || !payload.ticket) return;
    
    setSavingQr(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Ứng dụng cần được cấp quyền truy cập thư viện ảnh để tải mã QR về.');
        setSavingQr(false);
        return;
      }

      qrRef.current.toDataURL(async (dataURL: string) => {
        try {
          const ticketIdShort = payload.ticket.ticketId.substring(0, 8);
          const file = new File(Paths.document, `ticket_qr_${ticketIdShort}.png`);
          file.write(dataURL, {
            encoding: EncodingType.Base64,
          });
          const filename = file.uri;

          await MediaLibrary.createAssetAsync(filename);
          Alert.alert('Thành Công', 'Đã lưu mã QR vé của bạn vào Thư viện ảnh!');
        } catch (err) {
          console.error('Failed to convert and save QR image', err);
          Alert.alert('Lỗi', 'Không thể lưu mã QR. Vui lòng thử lại.');
        } finally {
          setSavingQr(false);
        }
      });
    } catch (error) {
      console.error('Error requesting MediaLibrary permission', error);
      Alert.alert('Lỗi', 'Không thể kết nối với thư viện ảnh.');
      setSavingQr(false);
    }
  };

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
                <Svg
                  ref={qrRef}
                  width={340}
                  height={395}
                  viewBox="0 0 340 395"
                >
                  <Rect x={0} y={0} width={340} height={395} fill="#ffffff" />
                  <G x={0} y={0}>
                    <QRCode
                      value={qrRaw}
                      size={300}
                      color="#000000"
                      backgroundColor="#ffffff"
                      quietZone={20}
                    />
                  </G>
                  {concertTitle ? (
                    <SvgText
                      x={170}
                      y={365}
                      fontSize={15}
                      fontWeight="bold"
                      fill="#000000"
                      textAnchor="middle"
                      fontFamily="System"
                    >
                      {concertTitle.length > 30 ? concertTitle.substring(0, 27) + '...' : concertTitle}
                    </SvgText>
                  ) : null}
                </Svg>
              </View>
            ) : (
              <ActivityIndicator size="small" color="#000" />
            )}
            {concertTitle ? (
              <ThemedText style={styles.concertNameLabel}>
                🎵 {concertTitle}
              </ThemedText>
            ) : null}
            <ThemedText style={styles.qrHint} themeColor="textSecondary">
              Quét mã này tại cổng soát vé để vào sự kiện (Mã QR ký số ED25519)
            </ThemedText>
            {qrRaw && (
              ticket.status === 'USED' || ticket.status === 'used' ? (
                <View style={styles.checkedInLabelContainer}>
                  <ThemedText style={styles.checkedInText}>✔️ Vé đã được soát</ThemedText>
                </View>
              ) : (
                <View style={styles.buttonContainer}>
                  <Pressable
                    onPress={handleSaveQr}
                    disabled={savingQr}
                    style={({ pressed }) => [
                      styles.saveButton,
                      pressed && styles.saveButtonPressed,
                      { backgroundColor: theme.text }
                    ]}
                  >
                    {savingQr ? (
                      <ActivityIndicator size="small" color={theme.background} />
                    ) : (
                      <ThemedText style={[styles.saveButtonText, { color: theme.background }]}>
                        💾 Lưu mã QR vào Thư viện
                      </ThemedText>
                    )}
                  </Pressable>

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
                </View>
              )
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
    borderRadius: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: Spacing.two,
    overflow: 'hidden',
  },
  checkedInLabelContainer: {
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.six,
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  checkedInText: {
    color: '#e53935',
    fontWeight: 'bold',
    fontSize: 15,
  },
  qrHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  concertNameLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    marginVertical: Spacing.two,
    textAlign: 'center',
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
    width: '80%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  buttonContainer: {
    marginTop: Spacing.three,
    width: '100%',
    gap: Spacing.two,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  saveButton: {
    width: '80%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  saveButtonPressed: {
    opacity: 0.8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

