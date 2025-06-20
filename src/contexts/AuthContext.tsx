import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockAuth } from '@/lib/mock-auth';

export type UserRole = 'admin' | 'supervisor' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string, displayName: string, role: UserRole = 'user') => {
    try {
      const profile = await mockAuth.signUp(email, password, displayName);
      setCurrentUser(profile);
      setUserProfile(profile);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const profile = await mockAuth.signIn(email, password);
      setCurrentUser(profile);
      setUserProfile(profile);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await mockAuth.signOut();
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = mockAuth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setUserProfile(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Auto logout after 5 minutes of inactivity
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (currentUser) {
          logout();
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    if (currentUser) {
      events.forEach(event => {
        document.addEventListener(event, resetTimer, true);
      });
      resetTimer();
    }

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
