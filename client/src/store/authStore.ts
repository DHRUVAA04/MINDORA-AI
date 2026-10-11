import { create } from 'zustand';
import { apiClient, setAuthToken } from '../api/client';
import { useTimerStore } from './timerStore';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  educational_level: string;
  age_range: string;
  email_verified: boolean;
  target_exam?: string;
  weekly_target_hours?: number;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiredNotice: string | null;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string, remember_me?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (payload: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearSessionNotice: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen for session expiry event from API client
  if (typeof window !== 'undefined') {
    window.addEventListener('mindora:session-expired', () => {
      setAuthToken(null);
      useTimerStore.getState().resetTimer();
      set({
        user: null,
        isAuthenticated: false,
        sessionExpiredNotice: 'Your session has expired. Please log in again to continue.',
      });
    });
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    sessionExpiredNotice: null,

    checkAuth: async () => {
      set({ isLoading: true });
      try {
        const data = await apiClient<User>('/auth/me');
        if (data && data.id) {
          set({ user: data, isAuthenticated: true, isLoading: false });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } catch {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    },

    login: async (email, password, remember_me = false) => {
      try {
        const data = await apiClient<{ user: User; access_token?: string }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password, remember_me }),
        });
        if (data.access_token) {
          setAuthToken(data.access_token);
        }
        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          sessionExpiredNotice: null,
        });
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Email or password is incorrect' };
      }
    },

    register: async (payload) => {
      try {
        const data = await apiClient<{ user: User; access_token?: string }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (data.access_token) {
          setAuthToken(data.access_token);
        }
        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          sessionExpiredNotice: null,
        });
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Registration failed' };
      }
    },

    logout: async () => {
      try {
        await apiClient('/auth/logout', { method: 'POST' });
      } catch {
        // ignore logout error
      }
      setAuthToken(null);
      // Stop and reset any running timer
      useTimerStore.getState().resetTimer();
      set({ user: null, isAuthenticated: false });
    },

    clearSessionNotice: () => set({ sessionExpiredNotice: null }),

    updateUser: (data: Partial<User>) => {
      set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
      }));
    },
  };
});
