import React, { useState } from 'react';
import { StyleSheet, Pressable, TextInput, Alert, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(true);

  if (!permission) {
    // Camera permissions are still loading.
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Đang tải quyền camera...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>Chúng tôi cần quyền truy cập camera để quét vé</ThemedText>
        <Pressable onPress={requestPermission} style={styles.button}>
          <ThemedText style={styles.buttonText}>Cấp Quyền Camera</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  // Handle scanned QR code
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    processQR(data);
  };

  const processQR = (qrRaw: string) => {
    // Phase 6 will hash local qrRaw with SHA-256 and POST to server.
    // For now, let's show an alert simulation:
    Alert.alert(
      'Verify Ticket',
      `QR Scanned: ${qrRaw}\n(Mã hóa SHA-256 sẽ được tích hợp ở Phase 6)`,
      [
        {
          text: 'OK',
          onPress: () => setScanning(true),
        },
      ]
    );
  };

  const handleMockScan = () => {
    const mockQRList = [
      'cc29ba9cc390cf2da5526261541eb618ee3d6c4ef1d780e9351904b25509bf16',
      'invalid-ticket-token-12345',
      'ticket-already-used-98765',
    ];
    const randomIndex = Math.floor(Math.random() * mockQRList.length);
    processQR(mockQRList[randomIndex]);
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    processQR(manualInput.trim());
    setManualInput('');
  };

  return (
    <ThemedView style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      <View style={styles.overlayContainer}>
        {/* Top bar with stats navigator */}
        <ThemedView style={styles.topBar}>
          <Pressable
            onPress={() => router.push('/(staff)/stats')}
            style={styles.statsButton}
          >
            <ThemedText style={styles.statsButtonText}>📊 Xem Thống Kê</ThemedText>
          </Pressable>
        </ThemedView>

        {/* Bottom controls panel */}
        <ThemedView type="backgroundElement" style={styles.controlPanel}>
          <ThemedText style={styles.panelTitle}>Emulator Testing / Soát vé giả lập</ThemedText>
          
          <Pressable
            onPress={handleMockScan}
            style={({ pressed }) => [
              styles.mockButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <ThemedText style={styles.mockButtonText}>⚡ Quét Ngẫu Nhiên (Mock Scan)</ThemedText>
          </Pressable>

          <ThemedView style={styles.divider} />

          <ThemedText style={styles.inputLabel}>Nhập mã vé thủ công:</ThemedText>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập mã QR..."
              placeholderTextColor="#888"
              value={manualInput}
              onChangeText={setManualInput}
            />
            <Pressable onPress={handleManualSubmit} style={styles.submitButton}>
              <ThemedText style={styles.submitButtonText}>Gửi</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: Spacing.four,
  },
  button: {
    padding: Spacing.three,
    backgroundColor: '#000',
    borderRadius: Spacing.two,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.three,
    backgroundColor: 'transparent',
  },
  statsButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: Spacing.two,
  },
  statsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  controlPanel: {
    padding: Spacing.four,
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
    gap: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.one,
    color: '#333',
  },
  mockButton: {
    height: 44,
    backgroundColor: '#43a047',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
  },
  mockButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: Spacing.two,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    backgroundColor: '#fff',
    color: '#000',
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
});
