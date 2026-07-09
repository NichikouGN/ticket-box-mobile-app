import { apiClient } from './api';
import { storage } from '@/utils/storage';
import { RawSignInResponse, SignInResponse, SignUpResponse, UserRole, User } from '@/types/auth';

// Pure JavaScript Base64 decode helper supporting UTF-8 for React Native compatibility
function decodeBase64(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  for (let i = 0; i < padded.length; i += 4) {
    const w = chars.indexOf(padded[i]);
    const x = chars.indexOf(padded[i + 1]);
    const y = chars.indexOf(padded[i + 2]);
    const z = chars.indexOf(padded[i + 3]);
    if (w === -1 || x === -1) continue;
    const byte1 = (w << 2) | (x >> 4);
    const byte2 = ((x & 15) << 4) | (y >> 2);
    const byte3 = ((y & 3) << 6) | z;
    result += String.fromCharCode(byte1);
    if (padded[i + 2] !== '=') result += String.fromCharCode(byte2);
    if (padded[i + 3] !== '=') result += String.fromCharCode(byte3);
  }
  try {
    return decodeURIComponent(escape(result));
  } catch {
    return result;
  }
}

// Parses a standard JWT payload
export function parseJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(decodeBase64(parts[1]));
  } catch {
    return null;
  }
}

export const authService = {
  async signIn(usernameOrEmail: string, password: string): Promise<SignInResponse> {
    const response = await apiClient.post<RawSignInResponse>('/auth/sign-in', {
      username: usernameOrEmail,
      email: usernameOrEmail,
      password,
    });

    const rawData = response.data;
    
    // Support both accessToken and access_token from backend
    const accessToken = rawData.accessToken || rawData.access_token || (rawData as any).jwt_token;
    const refreshToken = rawData.refreshToken || rawData.refresh_token || accessToken;
    
    // Parse JWT to extract role/email details directly if available (compatible with Supabase Auth)
    const jwtPayload = parseJWT(accessToken);
    
    let role: UserRole = 'audience';
    if (jwtPayload) {
      const rawRole = jwtPayload.role ||
                      jwtPayload.user_role || 
                      jwtPayload.app_metadata?.role || 
                      jwtPayload.user_metadata?.role;
      
      const jwtRole = typeof rawRole === 'string' ? rawRole.toLowerCase() : null;
      
      if (jwtRole === 'staff' || jwtRole === 'audience' || jwtRole === 'organizer') {
        role = jwtRole as UserRole;
      } else if (jwtPayload.email?.toLowerCase().includes('staff') || usernameOrEmail.toLowerCase().includes('staff')) {
        role = 'staff';
      }
    } else {
      // Fallback to raw response details or email username check
      const rawRole = rawData.user?.role;
      const fallbackRole = typeof rawRole === 'string' ? rawRole.toLowerCase() : null;
      role = (fallbackRole as UserRole) || 
        (usernameOrEmail.toLowerCase().includes('staff') ? 'staff' : 'audience');
    }
    
    const email = jwtPayload?.email || rawData.user?.email || `${usernameOrEmail}@example.com`;
    const fullName = jwtPayload?.user_metadata?.full_name || 
                     rawData.user?.full_name || 
                     rawData.user?.fullName || 
                     usernameOrEmail.toUpperCase();
      
    const mappedResponse: SignInResponse = {
      success: rawData.success,
      message: rawData.message,
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: {
        id: jwtPayload?.userId || jwtPayload?.sub || rawData.user?.id || 'mock-id',
        email: email,
        fullName: fullName,
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

  async signUp(email: string, password: string, fullName: string): Promise<SignUpResponse> {
    const response = await apiClient.post<SignUpResponse>('/auth/sign-up', {
      email,
      password,
      fullName
    });
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data: any }>('/users/profile');
    const rawUser = response.data?.data || response.data;
    if (!rawUser) {
      throw new Error('Invalid user profile response');
    }

    let role: UserRole = 'audience';
    const rawRole = String(rawUser.role).toLowerCase();
    if (rawRole === 'staff' || rawRole === 'organizer' || rawRole === 'audience') {
      role = rawRole;
    }

    return {
      id: rawUser.id,
      email: rawUser.email,
      fullName: rawUser.fullName || rawUser.full_name || '',
      role: role,
      status: (rawUser.status === 'banned' ? 'banned' : 'active') as 'active' | 'banned',
    };
  },

  async signOut(): Promise<void> {
    await storage.clearAuth();
  },
};
