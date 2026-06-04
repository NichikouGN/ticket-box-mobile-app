import { apiClient } from './api';
import { storage } from '@/utils/storage';
import { RawSignInResponse, SignInResponse, SignUpResponse, UserRole } from '@/types/auth';

export const authService = {
  async signIn(username: string, password: string): Promise<SignInResponse> {
    const response = await apiClient.post<RawSignInResponse>('/users/sign-in', {
      username,
      password,
    });

    const rawData = response.data;
    
    // Fallback user details if not returned by server
    const role: UserRole = (rawData.user?.role as UserRole) || 
      (username.toLowerCase().includes('staff') ? 'staff' : 'audience');
      
    const mappedResponse: SignInResponse = {
      success: rawData.success,
      message: rawData.message,
      accessToken: rawData.access_token,
      refreshToken: rawData.refresh_token,
      user: {
        id: rawData.user?.id || 'mock-id',
        email: rawData.user?.email || `${username}@example.com`,
        fullName: rawData.user?.full_name || username.toUpperCase(),
        role: role,
        status: (rawData.user?.status as 'active' | 'banned') || 'active',
      },
    };

    // Save mapping elements in secure storage
    await storage.setAccessToken(mappedResponse.accessToken);
    await storage.setRefreshToken(mappedResponse.refreshToken);
    await storage.setUserRole(mappedResponse.user.role);

    return mappedResponse;
  },

  async signUp(username: string, password: string): Promise<SignUpResponse> {
    const response = await apiClient.post<SignUpResponse>('/users/sign-up', {
      username,
      password,
    });
    return response.data;
  },

  async signOut(): Promise<void> {
    await storage.clearAuth();
  },
};
