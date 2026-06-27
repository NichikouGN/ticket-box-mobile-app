import React, { useState } from 'react';
import { StyleSheet, Pressable, ActivityIndicator, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { runIntegrationTest, TestResult } from '@/mocks/e2eMockTest';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const triggerTests = async () => {
    setRunningTests(true);
    setTestResults(null);
    try {
      const results = await runIntegrationTest();
      setTestResults(results);
    } catch (e) {
      console.error('Test run failed', e);
    } finally {
      setRunningTests(false);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.profileHeader}>
          <ThemedView style={styles.avatarPlaceholder}>
            <ThemedText style={styles.avatarText}>U</ThemedText>
          </ThemedView>
          <ThemedText type="subtitle">Nguyễn Văn A</ThemedText>
          <ThemedText themeColor="textSecondary">Khán giả (Audience)</ThemedText>
        </ThemedView>

        <ThemedView style={styles.actionsList}>
          {USE_MOCK && (
            <Pressable
              onPress={triggerTests}
              disabled={runningTests}
              style={({ pressed }) => [
                styles.testButton,
                pressed && styles.testButtonPressed,
                runningTests && styles.testButtonDisabled,
              ]}
            >
              {runningTests ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.testButtonText}>🧪 Chạy Thử Nghiệm Tích Hợp (E2E Mock Test)</ThemedText>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <ThemedText style={styles.logoutText}>Đăng Xuất</ThemedText>
          </Pressable>
        </ThemedView>

        {testResults && (
          <ThemedView type="backgroundElement" style={styles.resultsContainer}>
            <ThemedText style={styles.resultsHeader}>📊 BÁO CÁO KẾT QUẢ KIỂM THỬ</ThemedText>
            <View style={styles.resultsList}>
              {testResults.map((res, index) => (
                <View key={index} style={styles.resultItem}>
                  <ThemedText style={res.success ? styles.passText : styles.failText}>
                    {res.success ? '🟢 PASS' : '🔴 FAIL'}
                  </ThemedText>
                  <View style={styles.resultTextContent}>
                    <ThemedText style={styles.resultName}>{res.name}</ThemedText>
                    <ThemedText style={styles.resultMsg} themeColor="textSecondary">
                      {res.message}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.six,
  },
  profileHeader: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionsList: {
    gap: Spacing.three,
  },
  actionButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
  },
  actionButtonPressed: {
    backgroundColor: '#ffebee',
  },
  logoutText: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  testButton: {
    height: 50,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
  },
  testButtonPressed: {
    opacity: 0.8,
  },
  testButtonDisabled: {
    backgroundColor: '#818cf8',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resultsContainer: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  resultsHeader: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#4f46e5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: Spacing.one,
    marginBottom: Spacing.one,
  },
  resultsList: {
    gap: Spacing.two,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  resultTextContent: {
    flex: 1,
  },
  passText: {
    fontWeight: 'bold',
    color: '#43a047',
    fontSize: 12,
  },
  failText: {
    fontWeight: 'bold',
    color: '#e53935',
    fontSize: 12,
  },
  resultName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  resultMsg: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
});
