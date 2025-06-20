// Mock authentication service for demo purposes
import type { UserProfile } from '@/types';

const DEMO_USERS: Record<string, { password: string; profile: UserProfile }> = {
  'admin@hcp.com': {
    password: 'admin123',
    profile: {
      uid: 'admin-001',
      email: 'admin@hcp.com',
      displayName: 'Admin User',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLogin: new Date().toISOString()
    }
  },
  'supervisor@hcp.com': {
    password: 'supervisor123',
    profile: {
      uid: 'supervisor-001',
      email: 'supervisor@hcp.com',
      displayName: 'Supervisor User',
      role: 'supervisor',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLogin: new Date().toISOString()
    }
  },
  'user@hcp.com': {
    password: 'user123',
    profile: {
      uid: 'user-001',
      email: 'user@hcp.com',
      displayName: 'Regular User',
      role: 'user',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLogin: new Date().toISOString()
    }
  }
};

class MockAuthService {
  private currentUser: UserProfile | null = null;
  private listeners: ((user: UserProfile | null) => void)[] = [];

  async signIn(email: string, password: string): Promise<UserProfile> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = DEMO_USERS[email];
        if (user && user.password === password) {
          this.currentUser = user.profile;
          localStorage.setItem('mock_auth_user', JSON.stringify(user.profile));
          this.notifyListeners();
          resolve(user.profile);
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 1000); // Simulate network delay
    });
  }

  async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (DEMO_USERS[email]) {
          reject(new Error('Email already exists'));
          return;
        }

        const newProfile: UserProfile = {
          uid: `user-${Date.now()}`,
          email,
          displayName,
          role: 'user',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        DEMO_USERS[email] = { password, profile: newProfile };
        this.currentUser = newProfile;
        localStorage.setItem('mock_auth_user', JSON.stringify(newProfile));
        this.notifyListeners();
        resolve(newProfile);
      }, 1000);
    });
  }

  async signOut(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null;
        localStorage.removeItem('mock_auth_user');
        this.notifyListeners();
        resolve();
      }, 500);
    });
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    this.listeners.push(callback);
    
    // Check for existing session
    const savedUser = localStorage.getItem('mock_auth_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('mock_auth_user');
      }
    }
    
    // Call immediately with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export const mockAuth = new MockAuthService();
