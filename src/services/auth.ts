import { apiClient } from './api';
import { storage } from '@/utils/storage';
import { RawSignInResponse, SignInResponse, SignUpResponse, UserRole } from '@/types/auth';

export const authService = {
  async signIn(usernameOrEmail: string, password: string): Promise<SignInResponse> {
    const response = await apiClient.post<RawSignInResponse>('/auth/login', {
      username: usernameOrEmail,
      email: usernameOrEmail,
      password,
    });

    const rawData = response.data;
    
    // Support both access_token and jwt_token from backend
    const accessToken = rawData.access_token || (rawData as any).jwt_token;
    const refreshToken = rawData.refresh_token || (rawData as any).refresh_token || accessToken;
    
    // Fallback user details if not returned by server
    const role: UserRole = (rawData.user?.role as UserRole) || 
      (usernameOrEmail.toLowerCase().includes('staff') ? 'staff' : 'audience');
      
    const mappedResponse: SignInResponse = {
      success: rawData.success,
      message: rawData.message,
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: {
        id: rawData.user?.id || 'mock-id',
        email: rawData.user?.email || `${usernameOrEmail}@example.com`,
        fullName: rawData.user?.full_name || usernameOrEmail.toUpperCase(),
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

  async signUp(usernameOrEmail: string, password: string): Promise<SignUpResponse> {
    const response = await apiClient.post<SignUpResponse>('/auth/register', {
      username: usernameOrEmail,
      email: usernameOrEmail,
      password,
    });
    return response.data;
  },

  async signOut(): Promise<void> {
    await storage.clearAuth();
  },
};
