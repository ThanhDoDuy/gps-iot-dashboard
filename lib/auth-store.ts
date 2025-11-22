import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, type LoginRequest, type UserProfile } from './api'
import { PermissionsEnum } from './enums/permissions.enum'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  user: UserProfile | null
  permissions: string[]
}

interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string, isAuthenticated: boolean) => void
  setUser: (user: UserProfile) => void
  clearTokens: () => void
  clearUser: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  fetchProfile: () => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<boolean>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
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
      user: null,
      permissions: [],

      // Actions
      setTokens: (accessToken: string, refreshToken: string, isAuthenticated: boolean) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated,
          error: null,
        })
      },

      setUser: (user: UserProfile) => {
        set({
          user,
          permissions: user.permissions || [],
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

      clearUser: () => {
        set({
          user: null,
          permissions: [],
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

          // Fetch user profile after successful login
          if (resBody.data.accessToken) {
            await get().fetchProfile()
          }
        } catch (error) {
          set({
            error: 'Login failed, Wrong email or password',
            isLoading: false,
          })
          throw error
        }
      },

      fetchProfile: async () => {
        const { accessToken } = get()
        if (!accessToken) {
          return
        }

        try {
          const response = await authApi.getProfile(accessToken)
          set({
            user: response.data,
            permissions: response.data.permissions || [],
          })
        } catch (error) {
          console.error('Failed to fetch user profile:', error)
          // Don't throw error, just log it
        }
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
          user: null,
          permissions: [],
        })
      },

      hasPermission: (permission: string | PermissionsEnum) => {
        const { permissions } = get()
        // SUPER_ADMIN has all permissions
        if (permissions.includes(PermissionsEnum.SUPER_ADMIN)) {
          return true
        }
        return permissions.includes(permission)
      },

      hasAnyPermission: (permissions: (string | PermissionsEnum)[]) => {
        const { hasPermission } = get()
        return permissions.some(perm => hasPermission(perm))
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

          // Fetch user profile after token refresh
          await get().fetchProfile()

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
        user: state.user,
        permissions: state.permissions,
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
