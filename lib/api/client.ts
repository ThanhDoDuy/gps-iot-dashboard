const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'An error occurred',
        }));
        
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        (error as any).statusCode = response.status;
        throw error;
      }

      return await response?.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Public methods for different HTTP verbs
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  async post<T>(
    endpoint: string, 
    data?: any, 
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  async put<T>(
    endpoint: string, 
    data?: any, 
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  async patch<T>(
    endpoint: string, 
    data?: any, 
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  async delete<T>(
    endpoint: string, 
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  // Helper method for retrying requests with new token (no recursion)
  private async retryRequest<T>(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    return await this.request<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // Helper method for authenticated requests with automatic token refresh
  async authenticatedRequest<T>(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      return await this.request<T>(endpoint, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error: any) {
      console.log("🔍 API Error caught:", error.message, "Type:", typeof error.message, "Status:", error.statusCode);
      
      // 403 Forbidden = Authorization issue (no permission) → throw error, let UI handle it
      // Don't redirect because user is authenticated but lacks permission for this resource
      if (typeof window !== 'undefined' && error.statusCode === 403) {
        console.log("🔄 Got 403 Forbidden error - user lacks permission for this resource");
        // Re-throw the error so UI can display appropriate message (e.g., "You don't have permission")
        throw error;
      }
      
      // 401 Unauthorized = Authentication issue (token expired/invalid) → try refresh token
      const is401Error = typeof window !== 'undefined' && (
        error.statusCode === 401 ||
        error.message?.includes('401') || 
        error.message?.includes('HTTP 401') || 
        error.message?.includes('Invalid or expired token') ||
        error.message?.includes('TokenExpired')
      );
      
      if (is401Error) {
        console.log("🔄 Got 401 Unauthorized error, attempting to refresh token...");
        
        // Import auth store dynamically to avoid circular dependency
        const { useAuthStore } = await import('../auth-store');
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (refreshToken) {
          try {
            const refreshSuccess = await useAuthStore.getState().refreshAccessToken();
            
            if (refreshSuccess) {
              // Retry the original request with new token
              const newAccessToken = useAuthStore.getState().accessToken;
              if (newAccessToken) {
                try {
                  // Use retryRequest to avoid infinite recursion
                  const retryResponse = await this.retryRequest<T>(endpoint, newAccessToken, options);
                  return retryResponse;
                } catch (retryError: any) {
                  // If retry still fails with 401, redirect to login
                  if (retryError.statusCode === 401) {
                    // 🔄 Still unauthorized after retry, redirecting to login...
                    useAuthStore.getState().logout();
                    window.location.href = '/';
                    throw new Error('Authentication expired. Please login again.');
                  }
                  // Other error, re-throw
                  throw retryError;
                }
              }
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            useAuthStore.getState().logout();
            window.location.href = '/';
            throw new Error('Authentication expired. Please login again.');
          }
        }
        
        // No refresh token available, redirect to login
        if (!refreshToken) {
          // 🔄 No refresh token available, redirecting to login...
          const { useAuthStore } = await import('../auth-store');
          useAuthStore.getState().logout();
          window.location.href = '/';
          throw new Error('Authentication expired. Please login again.');
        }
      }
      
      // Re-throw the original error if it's not a 401/403 or if we're on server
      throw error;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
