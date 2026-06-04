import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/utils/storage';
import { authService } from '@/services/auth';
import { UserRole } from '@/types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Check if tokens exist in secure storage on app startup
    const bootstrapAsync = async () => {
      try {
        const token = await storage.getAccessToken();
        const role = await storage.getUserRole();
        
        if (token && role) {
          setIsAuthenticated(true);
          setUserRole(role as UserRole);
        }
      } catch (e) {
        console.error('Failed to restore token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.signIn(username, password);
      if (response.success) {
        setIsAuthenticated(true);
        setUserRole(response.user.role);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUserRole(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
    } finally {
      setIsAuthenticated(false);
      setUserRole(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default useAuth;
