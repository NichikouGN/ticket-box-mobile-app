import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { checkinService } from '@/services/checkin';
import { concertService } from '@/services/concert';
import { CheckinResult } from '@/types/checkin';
import { Concert } from '@/types/concert';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

export default function ScannerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { logout } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loadingConcerts, setLoadingConcerts] = useState(true);
  const [selectedConcert, setSelectedConcert] = useState<{ id: string; title: string } | null>(null);
  
  const [publicKey, setPublicKey] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<CheckinResult | null>(null);

  const handlePermissionRequest = async () => {
    const res = await requestPermission();
    if (!res.granted && !res.canAskAgain) {
      Alert.alert(
        'Yêu cầu quyền truy cập Camera',
        'Bạn đã từ chối quyền truy cập camera. Vui lòng mở Cài đặt của thiết bị để cấp quyền truy cập camera cho ứng dụng.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  // Load concerts and public key on mount for staff selection
  useEffect(() => {
    const loadInitData = async () => {
      try {
        const response = await concertService.getConcerts(1, 50);
        setConcerts(response.data);
        const key = await checkinService.getPublicKey();
        setPublicKey(key);
      } catch (error) {
        console.error('Failed to load initial data for check-in selection', error);
      } finally {
        setLoadingConcerts(false);
      }
    };
    loadInitData();
  }, []);

  if (!permission) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText style={{ marginTop: Spacing.two }}>Đang tải quyền camera...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <ThemedText style={styles.permissionMessage}>
          Nhân viên soát vé cần cấp quyền truy cập camera để quét mã QR vé của khách hàng.
        </ThemedText>
        <Pressable onPress={handlePermissionRequest} style={styles.permissionButton}>
          <ThemedText style={styles.permissionButtonText}>Cấp Quyền Camera</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  // Luồng chọn Concert đầu tiên
  if (!selectedConcert) {
    return (
      <ThemedView style={styles.concertSelectionContainer}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Chọn Sự Kiện Soát Vé',
            headerRight: () => (
              <Pressable onPress={handleLogout} style={styles.headerLogoutBtn}>
                <ThemedText style={styles.headerLogoutBtnText}>Đăng xuất</ThemedText>
              </Pressable>
            ),
          }}
        />
        <ThemedText style={styles.selectionSubtitle} themeColor="textSecondary">
          Vui lòng chọn sự kiện mà bạn đang được phân công trực soát vé tại cổng.
        </ThemedText>

        {loadingConcerts ? (
          <ActivityIndicator size="large" color={theme.text} style={{ marginTop: Spacing.six }} />
        ) : (
          <FlatList
            data={concerts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.concertListContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedConcert({ id: item.id, title: item.title })}
                style={({ pressed }) => [
                  styles.concertCard,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                  pressed && styles.concertCardPressed
                ]}
              >
                <ThemedText style={styles.concertCardTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.concertCardInfo} themeColor="textSecondary">📍 {item.venue}</ThemedText>
                <ThemedText style={styles.concertCardInfo} themeColor="textSecondary">
                  📅 {new Date(item.startTime).toLocaleDateString('vi-VN')}
                </ThemedText>
              </Pressable>
            )}
            ListEmptyComponent={
              <ThemedView style={styles.emptyContainer}>
                <ThemedText themeColor="textSecondary">Hiện tại không có sự kiện nào đang diễn ra.</ThemedText>
              </ThemedView>
            }
          />
        )}
      </ThemedView>
    );
  }

  // Xử lý quét mã QR thành công từ Camera
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!scanning || verifying || scanResult) return;
    setScanning(false);
    processQR(data);
  };

  // Logic offline verify và online verify
  const processQR = async (qrRaw: string) => {
    setVerifying(true);
    try {
      // 1. Verify offline locally
      const offlineResult = await checkinService.verifyOffline(qrRaw, publicKey);
      if (!offlineResult.success || !offlineResult.ticketId) {
        setScanResult(offlineResult);
        return;
      }

      // Check if ticket is for the selected concert
      if (offlineResult.concertId !== selectedConcert.id) {
        setScanResult({
          success: false,
          result: 'WRONG_CONCERT',
          message: 'Vé này hợp lệ nhưng dành cho sự kiện khác.'
        });
        return;
      }

      // 2. NẾU verify offline ok, gửi POST /checkin/verify với 4 raw fields
      const onlineResult = await checkinService.verifyOnline({
        ticketId: offlineResult.ticketId,
        userId: offlineResult.userId!,
        concertId: offlineResult.concertId!,
        ticketTypeId: offlineResult.ticketTypeId!,
      });
      
      setScanResult(onlineResult);
    } catch (error: any) {
      console.error('Failed online check-in', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Lỗi kết nối máy chủ.';
      setScanResult({
        success: false,
        result: 'INVALID',
        message: `Lỗi kết nối mạng: ${errorMsg}`
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    setScanning(false);
    processQR(manualInput.trim());
    setManualInput('');
  };

  const handleMockScan = () => {
    // Generate a valid mock JSON payload to simulate successful offline check but fails online / does online check
    const mockTicket = {
      ticket: {
        ticketId: 'b07973d4-eb54-4cae-913f-c9679f22557e',
        userId: '4af9187e-15dd-4160-aff4-874aec923194',
        concertId: selectedConcert.id,
        ticketTypeId: '2ff664ec-6760-4df9-adcf-2d022c36770e',
      },
      signature: 'MOCK_SIGNATURE_BASE64_ED25519_KEY_1234567890_VALID_LENGTH_88_CHARS_LONG_SIGNATURE_STRING=='
    };
    setScanning(false);
    processQR(JSON.stringify(mockTicket));
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanning(true);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: selectedConcert.title,
          headerRight: () => (
            <View style={styles.headerRightActions}>
              <Pressable
                onPress={() => router.push({
                  pathname: '/(staff)/stats',
                  params: { concertId: selectedConcert.id, concertTitle: selectedConcert.title }
                })}
                style={styles.headerStatsBtn}
              >
                <ThemedText style={styles.headerStatsBtnText}>📊 Thống Kê</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.push({
                  pathname: '/(staff)/vip-checkin',
                  params: { concertId: selectedConcert.id, concertTitle: selectedConcert.title }
                })}
                style={styles.headerVipBtn}
              >
                <ThemedText style={styles.headerVipBtnText}>👑 Khách VIP</ThemedText>
              </Pressable>
              <Pressable onPress={handleLogout} style={styles.headerLogoutBtnCompact}>
                <ThemedText style={styles.headerLogoutBtnTextCompact}>Thoát</ThemedText>
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Camera and Overlay Viewport */}
      <View style={styles.scannerViewport}>
        {scanning && !scanResult && !verifying && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
        )}

        {/* Camera target reticle overlay */}
        {scanning && !scanResult && !verifying && (
          <View style={styles.reticleContainer}>
            <View style={styles.reticle} />
            <ThemedText style={styles.reticleText}>Đưa mã QR của vé vào khung hình</ThemedText>
          </View>
        )}

        {/* Verifying Loading Screen */}
        {verifying && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <ThemedText style={styles.loadingOverlayText}>Đang đối chiếu & xác thực vé...</ThemedText>
          </View>
        )}

        {/* Dynamic Status Overlays */}
        {scanResult && (
          <View
            style={[
              styles.resultOverlay,
              scanResult.result === 'SUCCESS' && { backgroundColor: '#2e7d32' },
              scanResult.result === 'ALREADY_USED' && { backgroundColor: '#c62828' },
              scanResult.result === 'INVALID' && { backgroundColor: '#c62828' },
              scanResult.result === 'WRONG_CONCERT' && { backgroundColor: '#ef6c00' },
            ]}
          >
            <ScrollView contentContainerStyle={styles.resultScrollContent}>
              <ThemedText style={styles.resultTitle}>
                {scanResult.result === 'SUCCESS' && '✔️ VÉ HỢP LỆ'}
                {scanResult.result === 'ALREADY_USED' && '❌ VÉ ĐÃ SỬ DỤNG'}
                {scanResult.result === 'INVALID' && '❌ VÉ KHÔNG HỢP LỆ'}
                {scanResult.result === 'WRONG_CONCERT' && '⚠️ VÉ SAI CONCERT'}
              </ThemedText>

              <View style={styles.resultCard}>
                {scanResult.result === 'SUCCESS' && (
                  <>
                    <View style={styles.resultRow}>
                      <ThemedText style={styles.resultLabel}>Trạng thái vé:</ThemedText>
                      <ThemedText style={[styles.resultValue, { color: '#2e7d32' }]}>Hợp lệ / Được vào</ThemedText>
                    </View>
                    <View style={styles.resultRow}>
                      <ThemedText style={styles.resultLabel}>Mã vé:</ThemedText>
                      <ThemedText style={[styles.resultValue, { fontSize: 11 }]} numberOfLines={1}>
                        {scanResult.ticketId}
                      </ThemedText>
                    </View>
                    <View style={styles.resultRow}>
                      <ThemedText style={styles.resultLabel}>Khán giả ID:</ThemedText>
                      <ThemedText style={[styles.resultValue, { fontSize: 11 }]} numberOfLines={1}>
                        {scanResult.userId}
                      </ThemedText>
                    </View>
                    <View style={styles.resultRow}>
                      <ThemedText style={styles.resultLabel}>Hạng vé ID:</ThemedText>
                      <ThemedText style={[styles.resultValue, { fontSize: 11 }]} numberOfLines={1}>
                        {scanResult.ticketTypeId}
                      </ThemedText>
                    </View>
                  </>
                )}

                {scanResult.result === 'ALREADY_USED' && (
                  <>
                    <ThemedText style={styles.errorDescription}>
                      Cảnh báo! Vé này đã được quét và soát trước đó tại cổng.
                    </ThemedText>
                    <View style={styles.resultRow}>
                      <ThemedText style={styles.resultLabel}>Trạng thái:</ThemedText>
                      <ThemedText style={[styles.resultValue, { color: '#c62828' }]}>ĐÃ SỬ DỤNG</ThemedText>
                    </View>
                    <View style={styles.resultRow}>
                      <ThemedText style={styles.resultLabel}>Mã vé:</ThemedText>
                      <ThemedText style={[styles.resultValue, { fontSize: 11 }]} numberOfLines={1}>
                        {scanResult.ticketId}
                      </ThemedText>
                    </View>
                  </>
                )}

                {scanResult.result === 'INVALID' && (
                  <ThemedText style={styles.errorDescription}>
                    {scanResult.message || 'Mã QR này không hợp lệ hoặc chữ ký số không chính xác.'}
                  </ThemedText>
                )}

                {scanResult.result === 'WRONG_CONCERT' && (
                  <ThemedText style={styles.errorDescription}>
                    {scanResult.message || 'Vé này hợp lệ nhưng được phát hành cho một concert hoặc sự kiện khác.'}
                  </ThemedText>
                )}
              </View>

              <Pressable onPress={resetScanner} style={styles.continueButton}>
                <ThemedText style={styles.continueButtonText}>TIẾP TỤC QUÉT VÉ</ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Emulator Testing panel (shown when camera is active) */}
      {scanning && !scanResult && !verifying && (
        <ThemedView type="backgroundElement" style={styles.controlPanel}>
          <ThemedText style={styles.panelTitle}>Emulator Support / Giả lập soát vé</ThemedText>

          <Pressable
            onPress={handleMockScan}
            style={({ pressed }) => [
              styles.mockButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <ThemedText style={styles.mockButtonText}>⚡ Giả lập Quét vé (Mock Scan)</ThemedText>
          </Pressable>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, { borderColor: theme.backgroundSelected, backgroundColor: theme.background, color: theme.text }]}
              placeholder="Dán mã QR raw tại đây để test..."
              placeholderTextColor="#888"
              value={manualInput}
              onChangeText={setManualInput}
            />
            <Pressable onPress={handleManualSubmit} style={styles.submitButton}>
              <ThemedText style={styles.submitButtonText}>Quét</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
    gap: Spacing.four,
  },
  permissionMessage: {
    textAlign: 'center',
    fontSize: 15.5,
    lineHeight: 24,
  },
  permissionButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    backgroundColor: '#000',
    borderRadius: Spacing.two,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  concertSelectionContainer: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  selectionTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  selectionSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.four,
  },
  concertListContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  concertCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  concertCardPressed: {
    opacity: 0.8,
  },
  concertCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  concertCardInfo: {
    fontSize: 12.5,
    marginTop: Spacing.half,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    backgroundColor: 'transparent',
  },
  reticleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    backgroundColor: 'transparent',
  },
  reticle: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#43a047',
    borderRadius: Spacing.two,
    backgroundColor: 'transparent',
  },
  reticleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scannerViewport: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  loadingOverlayText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFill,
    padding: Spacing.five,
    justifyContent: 'center',
  },
  resultScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.four,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  resultCard: {
    backgroundColor: '#fff',
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingBottom: Spacing.two,
  },
  resultLabel: {
    fontSize: 13.5,
    color: '#555',
    fontWeight: 'bold',
  },
  resultValue: {
    fontSize: 14.5,
    color: '#111',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  errorDescription: {
    fontSize: 15,
    color: '#222',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  continueButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  continueButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  controlPanel: {
    padding: Spacing.four,
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
    gap: Spacing.two,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  mockButton: {
    height: 40,
    backgroundColor: '#ffb300',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
  },
  mockButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    fontSize: 13,
  },
  submitButton: {
    width: 60,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  headerLogoutBtn: {
    marginRight: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#e53935',
    borderRadius: Spacing.one,
  },
  headerLogoutBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginRight: Spacing.one,
  },
  headerStatsBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    backgroundColor: '#1e88e5',
    borderRadius: Spacing.one,
  },
  headerStatsBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12.5,
  },
  headerLogoutBtnCompact: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    backgroundColor: '#e53935',
    borderRadius: Spacing.one,
  },
  headerLogoutBtnTextCompact: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12.5,
  },
  headerVipBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    backgroundColor: '#ffb300',
    borderRadius: Spacing.one,
  },
  headerVipBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12.5,
  },
});
