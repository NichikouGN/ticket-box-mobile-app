import React from 'react';
import { StyleSheet, Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed', e);
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
});
