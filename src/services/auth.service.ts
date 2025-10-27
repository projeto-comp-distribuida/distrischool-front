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
   * Uses cached user data from localStorage
   */
  async getCurrentUser(): Promise<User> {
    const token = apiClient.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Just use cached user from localStorage
    if (typeof window !== 'undefined') {
      const cachedUser = localStorage.getItem('currentUser');
      if (cachedUser) {
        try {
          return JSON.parse(cachedUser);
        } catch (error) {
          throw new Error('Failed to parse cached user data');
        }
      }
    }

    throw new Error('No cached user data found');
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
    return !!token;
  }

}

// Export singleton instance
export const authService = new AuthService();


