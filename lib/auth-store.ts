import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, type LoginRequest } from './api'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string, isAuthenticated: boolean) => void
  clearTokens: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<boolean>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setTokens: (accessToken: string, refreshToken: string, isAuthenticated: boolean) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated,
          error: null,
        })
      },

      clearTokens: () => {
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const credentials: LoginRequest = { email, password }
          const resBody = await authApi.login(credentials)
          
          set({
            accessToken: resBody.data.accessToken,
            refreshToken: resBody.data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            error: 'Login failed, Wrong email or password',
            isLoading: false,
          })
          throw error
        }
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        })
      },

      refreshAccessToken: async () => {
        const { refreshToken: currentRefreshToken } = get()
        
        if (!currentRefreshToken) {
          return false
        }

        try {
          set({ isLoading: true, error: null });
          
          const response = await authApi.refreshToken(currentRefreshToken);
          
          set({
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          return true
        } catch (error) {
          set({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        
        // Fix inconsistency: if isAuthenticated is true but no accessToken, clear auth
        if (state && state.isAuthenticated && !state.accessToken) {
          state.isAuthenticated = false;
          state.refreshToken = null;
        }
        
        // Set loading to false after rehydration
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
)
