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

    // Debug logging
    console.log('API Request:', {
      url,
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body
    });

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'An error occurred',
        }));
        
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
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
      // Check if it's a 401 error and we're in the browser
      if (error.message?.includes('401') && typeof window !== 'undefined') {
        console.log("🔄 Got 401 error, attempting to refresh token...");
        
        // Import auth store dynamically to avoid circular dependency
        const { useAuthStore } = await import('../auth-store');
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (refreshToken) {
          const refreshSuccess = await useAuthStore.getState().refreshAccessToken();
          
          if (refreshSuccess) {
            // Retry the original request with new token
            const newAccessToken = useAuthStore.getState().accessToken;
            if (newAccessToken) {
              console.log("🔄 Retrying request with new token...");
              // Use retryRequest to avoid infinite recursion
              return await this.retryRequest<T>(endpoint, newAccessToken, options);
            }
          } else {
            // Refresh failed, redirect to login
            console.log("🔄 Refresh token failed, redirecting to login...");
            useAuthStore.getState().logout();
            window.location.href = '/';
            throw new Error('Authentication expired. Please login again.');
          }
        } else {
          // No refresh token, redirect to login
          console.log("🔄 No refresh token available, redirecting to login...");
          useAuthStore.getState().logout();
          window.location.href = '/';
          throw new Error('No refresh token available. Please login again.');
        }
      }
      
      // Re-throw the original error if it's not a 401 or if we're on server
      throw error;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
