import React, { useState, useCallback } from 'react';
import { StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from 'expo-router';
import { authService } from '@/services/auth';
import { User, UserRole } from '@/types/auth';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const theme = useTheme();

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const getRoleText = (role?: UserRole) => {
    if (role === 'staff') return 'Nhân viên soát vé (Staff)';
    if (role === 'organizer') return 'Ban tổ chức (Organizer)';
    return 'Khán giả (Audience)';
  };

  if (loading && !profile) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText style={{ marginTop: Spacing.two }} themeColor="textSecondary">
          Đang tải thông tin cá nhân...
        </ThemedText>
      </ThemedView>
    );
  }

  const initialChar = profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.profileHeader}>
          <ThemedView style={styles.avatarPlaceholder}>
            <ThemedText style={styles.avatarText}>{initialChar}</ThemedText>
          </ThemedView>
          <ThemedText type="subtitle">{profile?.fullName || 'Người Dùng'}</ThemedText>
          <ThemedText themeColor="textSecondary">{getRoleText(profile?.role)}</ThemedText>
          <ThemedText style={styles.emailText} themeColor="textSecondary">
            {profile?.email}
          </ThemedText>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailText: {
    fontSize: 14,
    marginTop: Spacing.half,
  },
});
