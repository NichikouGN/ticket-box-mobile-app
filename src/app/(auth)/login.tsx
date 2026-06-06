import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      // Redirection is handled automatically by the NavigationGate in root _layout.tsx
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      Alert.alert('Đăng Nhập Thất Bại', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>TicketBox</ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          Đăng nhập vào hệ thống đặt & soát vé
        </ThemedText>

        <TextInput
          placeholder="Nhập Email"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Mật khẩu"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Đăng Nhập</ThemedText>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/register')}
          style={styles.registerLink}
        >
          <ThemedText type="link">Chưa có tài khoản? Đăng ký ngay</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  content: {
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    color: '#000',
    backgroundColor: '#fff',
  },
  button: {
    height: 50,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
    marginTop: Spacing.two,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: Spacing.three,
  },
});
