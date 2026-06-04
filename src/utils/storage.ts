import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'tb_access_token';
const REFRESH_TOKEN_KEY = 'tb_refresh_token';
const USER_ROLE_KEY = 'tb_user_role';

export const storage = {
  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async deleteAccessToken(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async deleteRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },

  async setUserRole(role: string): Promise<void> {
    await SecureStore.setItemAsync(USER_ROLE_KEY, role);
  },

  async getUserRole(): Promise<string | null> {
    return await SecureStore.getItemAsync(USER_ROLE_KEY);
  },

  async deleteUserRole(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_ROLE_KEY);
  },

  async clearAuth(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_ROLE_KEY),
    ]);
  },
};
