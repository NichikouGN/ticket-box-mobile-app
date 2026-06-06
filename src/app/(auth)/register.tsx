import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { authService } from '@/services/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !fullName.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.signUp(username.trim(), password, fullName.trim());
      if (response.success) {
        Alert.alert('Đăng Ký Thành Công', 'Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.', [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.';
      Alert.alert('Đăng Ký Thất Bại', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>Đăng Ký</ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          Đăng ký tài khoản Khán giả mới
        </ThemedText>

        <TextInput
          placeholder="Họ và tên"
          placeholderTextColor="#888"
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
        />

        <TextInput
          placeholder="Email / Tên đăng nhập"
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

        <TextInput
          placeholder="Xác nhận mật khẩu"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          secureTextEntry
        />

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Đăng Ký</ThemedText>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          style={styles.loginLink}
        >
          <ThemedText type="link">Đã có tài khoản? Đăng nhập ngay</ThemedText>
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
  loginLink: {
    alignItems: 'center',
    marginTop: Spacing.three,
  },
});
