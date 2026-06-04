export type UserRole = 'audience' | 'staff' | 'organizer';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'active' | 'banned';
}

export interface SignInResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface SignUpResponse {
  success: boolean;
  message: string;
}

export interface RawSignInResponse {
  success: boolean;
  message: string;
  access_token: string;
  refresh_token: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
  };
}
