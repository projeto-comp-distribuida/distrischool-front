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

    const response = await apiClient.post<unknown>(
      `${this.basePath}/login`,
      credentials
    );

    const isWrappedResponse =
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      'data' in response;

    const payload = isWrappedResponse
      ? (response as LoginResponse).data
      : response;

    const hasLoginData = (
      value: unknown
    ): value is LoginResponse['data'] =>
      typeof value === 'object' &&
      value !== null &&
      'token' in value &&
      'user' in value;

    if (!hasLoginData(payload)) {
      const message =
        isWrappedResponse && 'message' in (response as LoginResponse)
          ? (response as LoginResponse).message
          : 'Resposta de login inválida';

      logger.error('Auth Service', `❌ Login falhou para: ${credentials.email}`, {
        message,
      });
      throw new Error(message);
    }

    // Store token and clear any stale cached user data
    apiClient.setToken(payload.token);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem('currentUser');
        window.localStorage.removeItem('currentUser');
      } catch (e) {
        logger.error('Auth Service', 'Erro ao limpar cache de usuário após login', e);
      }
    }
    logger.success('Auth Service', `✅ Login bem-sucedido para: ${credentials.email}`);

    const normalizedResponse: LoginResponse = isWrappedResponse
      ? (response as LoginResponse)
      : {
        success: true,
        message: 'Login realizado com sucesso',
        data: payload,
      };

    return normalizedResponse;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    logger.info('Auth Service', `Tentando registrar novo usuário: ${data.email}`);

    const response = await apiClient.post<unknown>(
      `${this.basePath}/register`,
      data
    );

    const isWrappedResponse =
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      'data' in response;

    const payload = isWrappedResponse
      ? (response as RegisterResponse).data
      : response;

    let user = undefined as RegisterResponse['data']['user'] | undefined;

    if (payload && typeof payload === 'object' && 'user' in payload) {
      user = (payload as RegisterResponse['data']).user;
    } else if (payload && typeof payload === 'object') {
      user = payload as RegisterResponse['data']['user'];
    }

    if (!user) {
      const message =
        isWrappedResponse && 'message' in (response as RegisterResponse)
          ? (response as RegisterResponse).message
          : 'Resposta de registro inválida';

      logger.error('Auth Service', `❌ Registro falhou para: ${data.email}`, {
        message,
      });
      throw new Error(message);
    }

    const normalizedPayload: RegisterResponse['data'] =
      payload && typeof payload === 'object' && 'user' in payload
        ? (payload as RegisterResponse['data'])
        : { user };

    logger.success('Auth Service', `✅ Usuário registrado com sucesso: ${data.email}`);

    const normalizedResponse: RegisterResponse = isWrappedResponse
      ? (response as RegisterResponse)
      : {
        success: true,
        message: 'Registro realizado com sucesso',
        data: normalizedPayload,
      };

    return normalizedResponse;
  }

  /**
   * Logout current user
   */
  logout(): void {
    logger.info('Auth Service', 'Fazendo logout do usuário');
    apiClient.setToken(null);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem('authToken');
        window.sessionStorage.removeItem('currentUser');
        window.localStorage.removeItem('authToken');
        window.localStorage.removeItem('currentUser');
      } catch (error) {
        logger.error('Auth Service', 'Erro ao limpar dados de autenticação do storage', error);
      }
    }
    logger.success('Auth Service', '✅ Logout realizado com sucesso');
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User> {
    logger.debug('Auth Service', 'Buscando dados do usuário atual');

    const token = apiClient.getToken();
    if (!token) {
      logger.error('Auth Service', '❌ Token de autenticação não encontrado');
      throw new Error('No authentication token found');
    }

    try {
      const user = await apiClient.get<User>(`${this.basePath}/me`);

      logger.success('Auth Service', '✅ Dados do usuário atual obtidos do backend', {
        userId: user.id,
        email: user.email,
        roles: user.roles,
      });

      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem('currentUser', JSON.stringify(user));
          window.localStorage.removeItem('currentUser');
          logger.debug('Auth Service', 'Usuário salvo no cache de sessão após consulta ao backend');
        } catch (error) {
          logger.error('Auth Service', 'Erro ao salvar usuário no sessionStorage', error);
        }
      }

      return user;
    } catch (error) {
      logger.error('Auth Service', '❌ Erro ao obter dados do usuário atual do backend', error);

      if (typeof window !== 'undefined') {
        const fallbackUser = this.getCachedUser();
        if (fallbackUser) {
          return fallbackUser;
        }
      }

      throw error instanceof Error
        ? error
        : new Error('Failed to fetch current user information');
    }
  }

  private getCachedUser(): User | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const cachedUser = window.sessionStorage.getItem('currentUser');
      if (cachedUser) {
        const user = JSON.parse(cachedUser) as User;
        logger.warn('Auth Service', '⚠️ Usando dados do usuário em cache de sessão devido a erro no backend', {
          userId: user.id,
          email: user.email,
        });
        return user;
      }

      const legacyUser = window.localStorage.getItem('currentUser');
      if (legacyUser) {
        const user = JSON.parse(legacyUser) as User;
        window.sessionStorage.setItem('currentUser', legacyUser);
        window.localStorage.removeItem('currentUser');
        logger.warn('Auth Service', '⚠️ Migrando usuário do localStorage para sessionStorage', {
          userId: user.id,
          email: user.email,
        });
        return user;
      }
    } catch (error) {
      logger.error('Auth Service', '❌ Erro ao recuperar usuário em cache', error);
    }

    return null;
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


