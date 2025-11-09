// Base API Client for DistriSchool

import { logger } from './logger';

// Using API Gateway
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://distrischool.ddns.net';

export interface ApiConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Try to get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
        logger.success('API Client', 'Token de autenticação definido', { 
          hasToken: !!token,
          tokenLength: token?.length 
        });
      } else {
        localStorage.removeItem('authToken');
        logger.info('API Client', 'Token de autenticação removido');
      }
    }
  }

  getToken(): string | null {
    return this.token;
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
    const url = new URL(`${this.baseURL}${path}`);
    
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
    const maskedUrl = this.token ? url.replace(this.token, '***') : url;
    
    logger.info('API Client', `GET ${path}`, { 
      url: maskedUrl,
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
    const maskedUrl = this.token ? url.replace(this.token, '***') : url;
    
    logger.info('API Client', `POST ${path}`, { 
      url: maskedUrl,
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
    const maskedUrl = this.token ? url.replace(this.token, '***') : url;
    
    logger.info('API Client', `PUT ${path}`, { 
      url: maskedUrl,
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
    const maskedUrl = this.token ? url.replace(this.token, '***') : url;
    
    logger.info('API Client', `PATCH ${path}`, { 
      url: maskedUrl,
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
    const maskedUrl = this.token ? url.replace(this.token, '***') : url;
    
    logger.info('API Client', `DELETE ${path}`, { 
      url: maskedUrl,
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


