import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi, onAuthExpired } from '../services/api';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth expiration events from API service
  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
      console.log('Authentication expired, logging out user');
      setUser(null);
      // Note: Don't redirect here since we might not be inside a router context
      // Let ProtectedRoute handle the redirect based on authentication state
    });

    return unsubscribe;
  }, []);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token) {
        try {
          // Validate token by calling API
          const apiUserData = await authApi.getCurrentUser();
          
          const user: User = {
            id: apiUserData.id?.toString() || '1',
            email: apiUserData.email || '',
            name: apiUserData.full_name || apiUserData.name || apiUserData.email?.split('@')[0] || 'User',
            role: apiUserData.role || 'user'
          };
          
          // Update stored user data with fresh data from API
          localStorage.setItem('user_data', JSON.stringify(user));
          setUser(user);
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token is invalid, fall back to stored data or clear everything
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              setUser(parsedUser);
            } catch (parseError) {
              console.error('Error parsing stored user data:', parseError);
              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user_data');
            }
          } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
          }
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Use real API for authentication
      const response = await authApi.login({ email, password });
      
      // Store tokens
      localStorage.setItem('auth_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      
      // Get user data
      try {
        const userData = await authApi.getCurrentUser();
        
        const user: User = {
          id: userData.id?.toString() || '1',
          email: userData.email || email,
          name: userData.full_name || userData.name || email.split('@')[0],
          role: userData.role || 'user'
        };
        
        localStorage.setItem('user_data', JSON.stringify(user));
        setUser(user);
      } catch (userError) {
        // If getting user data fails, create a basic user object
        const basicUser: User = {
          id: '1',
          email: email,
          name: email.split('@')[0],
          role: 'user'
        };
        
        localStorage.setItem('user_data', JSON.stringify(basicUser));
        setUser(basicUser);
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Try to logout from API
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    }
    
    // Clear local storage and state
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
