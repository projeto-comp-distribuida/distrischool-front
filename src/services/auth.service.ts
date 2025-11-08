// Authentication Service

import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
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
    logger.info('Auth Service', `Tentando fazer login para: ${credentials.email}`);
    
    const response = await apiClient.post<LoginResponse>(
      `${this.basePath}/login`,
      credentials
    );
    
    // Store the token
    if (response.success && response.data.token) {
      apiClient.setToken(response.data.token);
      logger.success('Auth Service', `✅ Login bem-sucedido para: ${credentials.email}`);
    } else {
      logger.error('Auth Service', `❌ Login falhou para: ${credentials.email}`, {
        message: response.message
      });
    }

    return response;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    logger.info('Auth Service', `Tentando registrar novo usuário: ${data.email}`);
    
    const response = await apiClient.post<RegisterResponse>(
      `${this.basePath}/register`,
      data
    );
    
    if (response.success) {
      logger.success('Auth Service', `✅ Usuário registrado com sucesso: ${data.email}`);
    } else {
      logger.error('Auth Service', `❌ Registro falhou para: ${data.email}`, {
        message: response.message
      });
    }
    
    return response;
  }

  /**
   * Logout current user
   */
  logout(): void {
    logger.info('Auth Service', 'Fazendo logout do usuário');
    apiClient.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
    logger.success('Auth Service', '✅ Logout realizado com sucesso');
  }

  /**
   * Get current user information
   * Uses cached user data from localStorage
   */
  async getCurrentUser(): Promise<User> {
    logger.debug('Auth Service', 'Buscando dados do usuário atual');
    
    const token = apiClient.getToken();
    if (!token) {
      logger.error('Auth Service', '❌ Token de autenticação não encontrado');
      throw new Error('No authentication token found');
    }

    // Just use cached user from localStorage
    if (typeof window !== 'undefined') {
      const cachedUser = localStorage.getItem('currentUser');
      if (cachedUser) {
        try {
          const user = JSON.parse(cachedUser);
          logger.debug('Auth Service', '✅ Usuário encontrado no cache', {
            userId: user.id,
            email: user.email
          });
          return user;
        } catch (error) {
          logger.error('Auth Service', '❌ Erro ao fazer parse do usuário em cache', error);
          throw new Error('Failed to parse cached user data');
        }
      }
    }

    logger.error('Auth Service', '❌ Dados do usuário não encontrados no cache');
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


