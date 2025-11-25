// Base API Client for DistriSchool

import { logger } from './logger';

// Type declaration for Next.js environment variables
declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
  };
};

// Using API Gateway
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://distrischool.ddns.net/api/v1';

export interface ApiConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private unauthorizedHandlers = new Set<() => void>();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Try to get token from sessionStorage if available
    if (typeof window !== 'undefined') {
      try {
        const sessionToken = window.sessionStorage.getItem('authToken');
        if (sessionToken) {
          this.token = sessionToken;
        } else {
          // Migration path: move existing token from localStorage to sessionStorage if present
          const legacyToken = window.localStorage.getItem('authToken');
          if (legacyToken) {
            this.token = legacyToken;
            window.sessionStorage.setItem('authToken', legacyToken);
            window.localStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        logger.error('API Client', 'Erro ao recuperar token armazenado', error);
        this.token = null;
      }
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          window.sessionStorage.setItem('authToken', token);
          // Garantir remoção de tokens antigos
          window.localStorage.removeItem('authToken');
          logger.success('API Client', 'Token de autenticação definido', {
            hasToken: !!token,
            tokenLength: token?.length
          });
        } else {
          window.sessionStorage.removeItem('authToken');
          window.localStorage.removeItem('authToken');
          logger.info('API Client', 'Token de autenticação removido');
        }
      } catch (error) {
        logger.error('API Client', 'Erro ao persistir token', error);
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  onUnauthorized(callback: () => void): () => void {
    this.unauthorizedHandlers.add(callback);
    return () => {
      this.unauthorizedHandlers.delete(callback);
    };
  }

  private notifyUnauthorized() {
    if (!this.unauthorizedHandlers.size) {
      return;
    }

    this.unauthorizedHandlers.forEach((handler) => {
      try {
        handler();
      } catch (error) {
        logger.error('API Client', 'Erro ao executar handler de unauthorized', error);
      }
    });
  }

  private getHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private buildURL(path: string, params?: Record<string, any>): string {
    const isAbsolute = /^https?:\/\//i.test(path);
    const normalizedBase = this.baseURL.endsWith('/')
      ? this.baseURL
      : `${this.baseURL}/`;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const url = isAbsolute
      ? new URL(path)
      : new URL(normalizedPath, normalizedBase);

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]));
        }
      });
    }

    return url.toString();
  }

  async get<T>(path: string, config?: ApiConfig): Promise<T> {
    const url = this.buildURL(path, config?.params);
    const startTime = Date.now();

    logger.info('API Client', `GET ${path}`, {
      url: url.replace(this.token || '', '***'),
      hasToken: !!this.token,
      params: config?.params
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(config?.headers),
      });

      const duration = Date.now() - startTime;
      logger.success('API Client', `GET ${path} - ${response.status}`, {
        duration: `${duration}ms`,
        status: response.status,
        statusText: response.statusText
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Client', `GET ${path} falhou`, error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        const errorMsg = 'Não foi possível conectar ao servidor. Verifique se o API Gateway está acessível';
        logger.error('API Client', errorMsg, { url, duration: `${duration}ms` });
        throw new Error(errorMsg);
      }
      throw error;
    }
  }

  async post<T>(path: string, data?: any, config?: ApiConfig): Promise<T> {
    const url = this.buildURL(path, config?.params);
    const startTime = Date.now();

    logger.info('API Client', `POST ${path}`, {
      url: url.replace(this.token || '', '***'),
      hasToken: !!this.token,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      params: config?.params
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(config?.headers),
        body: data ? JSON.stringify(data) : undefined,
      });

      const duration = Date.now() - startTime;
      logger.success('API Client', `POST ${path} - ${response.status}`, {
        duration: `${duration}ms`,
        status: response.status,
        statusText: response.statusText
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Client', `POST ${path} falhou`, error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        const errorMsg = 'Não foi possível conectar ao servidor. Verifique se o API Gateway está acessível';
        logger.error('API Client', errorMsg, { url, duration: `${duration}ms` });
        throw new Error(errorMsg);
      }
      throw error;
    }
  }

  async put<T>(path: string, data?: any, config?: ApiConfig): Promise<T> {
    const url = this.buildURL(path, config?.params);
    const startTime = Date.now();

    logger.info('API Client', `PUT ${path}`, {
      url: url.replace(this.token || '', '***'),
      hasToken: !!this.token,
      hasData: !!data,
      params: config?.params
    });

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(config?.headers),
        body: data ? JSON.stringify(data) : undefined,
      });

      const duration = Date.now() - startTime;
      logger.success('API Client', `PUT ${path} - ${response.status}`, {
        duration: `${duration}ms`,
        status: response.status
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Client', `PUT ${path} falhou`, error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        const errorMsg = 'Não foi possível conectar ao servidor. Verifique se o API Gateway está acessível';
        logger.error('API Client', errorMsg, { url, duration: `${duration}ms` });
        throw new Error(errorMsg);
      }
      throw error;
    }
  }

  async patch<T>(path: string, data?: any, config?: ApiConfig): Promise<T> {
    const url = this.buildURL(path, config?.params);
    const startTime = Date.now();

    logger.info('API Client', `PATCH ${path}`, {
      url: url.replace(this.token || '', '***'),
      hasToken: !!this.token,
      hasData: !!data,
      params: config?.params
    });

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(config?.headers),
        body: data ? JSON.stringify(data) : undefined,
      });

      const duration = Date.now() - startTime;
      logger.success('API Client', `PATCH ${path} - ${response.status}`, {
        duration: `${duration}ms`,
        status: response.status
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Client', `PATCH ${path} falhou`, error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        const errorMsg = 'Não foi possível conectar ao servidor. Verifique se o API Gateway está acessível';
        logger.error('API Client', errorMsg, { url, duration: `${duration}ms` });
        throw new Error(errorMsg);
      }
      throw error;
    }
  }

  async delete<T>(path: string, config?: ApiConfig): Promise<T> {
    const url = this.buildURL(path, config?.params);
    const startTime = Date.now();

    logger.info('API Client', `DELETE ${path}`, {
      url: url.replace(this.token || '', '***'),
      hasToken: !!this.token,
      params: config?.params
    });

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(config?.headers),
      });

      const duration = Date.now() - startTime;
      logger.success('API Client', `DELETE ${path} - ${response.status}`, {
        duration: `${duration}ms`,
        status: response.status
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Client', `DELETE ${path} falhou`, error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        const errorMsg = 'Não foi possível conectar ao servidor. Verifique se o API Gateway está acessível';
        logger.error('API Client', errorMsg, { url, duration: `${duration}ms` });
        throw new Error(errorMsg);
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;

      logger.warn('API Client', `Resposta com erro: ${response.status} ${response.statusText}`, {
        status: response.status,
        statusText: response.statusText,
        contentType
      });

      if (isJson) {
        try {
          const errorData = await response.json();
          logger.debug('API Client', 'Dados do erro recebidos', errorData);

          // Tratar diferentes formatos de erro do backend
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.errors) {
            // Se houver múltiplos erros de validação
            const errors = Object.values(errorData.errors).join(', ');
            errorMessage = errors || errorMessage;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (e) {
          logger.error('API Client', 'Erro ao processar resposta de erro JSON', e);
          errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
      } else {
        try {
          const textError = await response.text();
          errorMessage = textError || `Erro HTTP ${response.status}: ${response.statusText}`;
          logger.debug('API Client', 'Erro em texto recebido', { errorMessage });
        } catch (e) {
          logger.error('API Client', 'Erro ao ler texto da resposta', e);
          errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
      }

      if (response.status === 401) {
        if (this.token) {
          logger.warn('API Client', 'Token inválido ou expirado detectado. Limpando credenciais e notificando assinantes.');
        }
        this.setToken(null);
        this.notifyUnauthorized();
      }

      throw new Error(errorMessage);
    }

    if (isJson) {
      const data = await response.json();
      logger.debug('API Client', 'Resposta JSON recebida', {
        hasData: !!data,
        keys: data ? Object.keys(data) : [],
        isWrapped: data && typeof data === 'object' && 'data' in data
      });

      // Handle ApiResponse wrapper from backend
      // Backend returns: {success: true, message: "...", data: [...], timestamp: "..."}
      if (data && typeof data === 'object' && 'data' in data) {
        return data.data;
      }
      return data;
    }

    const textData = await response.text();
    logger.debug('API Client', 'Resposta em texto recebida', { length: textData.length });
    return textData as any;
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);


