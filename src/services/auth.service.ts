// Authentication Service

import { apiClient } from '@/lib/api-client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  ApiResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '@/types/auth.types';

export class AuthService {
  private basePath = '/api/v1/auth';

  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      `${this.basePath}/login`,
      credentials
    );
    
    // Store the token
    if (response.success && response.data.token) {
      apiClient.setToken(response.data.token);
    }

    return response;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>(
      `${this.basePath}/register`,
      data
    );
  }

  /**
   * Logout current user
   */
  logout(): void {
    apiClient.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User> {
    // First check localStorage for cached user
    if (typeof window !== 'undefined') {
      const cachedUser = localStorage.getItem('currentUser');
      if (cachedUser) {
        console.log('🔍 [AuthService] Returning cached user:', JSON.parse(cachedUser));
        return JSON.parse(cachedUser);
      }
    }

    // If no cached user, fetch from API
    const token = apiClient.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Decode JWT to get user ID (simple implementation)
    const payload = this.decodeToken(token);
    const userId = payload.sub || payload.userId;

    if (!userId) {
      throw new Error('Invalid token format');
    }

    console.log('🔍 [AuthService] Fetching user from API for userId:', userId);
    const response = await apiClient.get<ApiResponse<User>>(
      `/api/v1/users/${userId}`
    );

    console.log('🔍 [AuthService] API response:', response);

    if (response.data) {
      console.log('🔍 [AuthService] User emailVerified status:', response.data.emailVerified || 'not returned by API');
      console.log('🔍 [AuthService] User active status:', response.data.active);
      // Cache user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(response.data));
      }
      return response.data;
    }

    throw new Error('Failed to fetch user data');
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(
      `${this.basePath}/forgot-password`,
      data
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(
      `${this.basePath}/reset-password`,
      data
    );
  }

  /**
   * Verify email with token
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(
      `${this.basePath}/verify-email`,
      data
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse> {
    return apiClient.get<ApiResponse>(`${this.basePath}/health`);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = apiClient.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      const exp = payload.exp;
      
      if (!exp) return true; // If no expiration, assume valid
      
      // Check if token is expired
      return Date.now() < exp * 1000;
    } catch {
      return false;
    }
  }

  /**
   * Simple JWT decoder (decode payload only)
   */
  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Failed to decode token');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();


