import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '@/types';
import { authService } from '@/services';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    businessName?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ email, password });

          if (response.error) {
            set({ isLoading: false });
            return { success: false, error: response.error };
          }

          if (response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: 'Login failed' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'An error occurred during login' };
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);

          if (response.error) {
            set({ isLoading: false });
            return { success: false, error: response.error };
          }

          if (response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: 'Registration failed' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'An error occurred during registration' };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authService.getCurrentUser();

          if (response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
