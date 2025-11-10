// Base API Client for DistriSchool

import { logger } from './logger';

// Using API Gateway
// Default to the remote gateway so the frontend talks to the notifications service at distrischool.ddns.net
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://distrischool.ddns.net';

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
        logger.success('API Client', 'Token de autentica\u00e7\u00e3o definido', {
          hasToken: !!token,
          tokenLength: token?.length 
        });
      } else {
        localStorage.removeItem('authToken');
        logger.info('API Client', 'Token de autentica\u00e7\u00e3o removido');
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
    // If baseURL is empty (relative), return a relative path
    let urlStr: string;

    if (!this.baseURL) {
      // Ensure path starts with '/'
      urlStr = path.startsWith('/') ? path : `/${path}`;
      // Append params as query string
      if (params) {
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
          const v = params[key];
          if (v !== undefined && v !== null) searchParams.append(key, String(v));
        });
        const qs = searchParams.toString();
        if (qs) urlStr += `?${qs}`;
      }

      return urlStr;
    }

    // If baseURL is provided, construct absolute URL robustly
    try {
      const base = this.baseURL.endsWith('/') ? this.baseURL : `${this.baseURL}`;
      const constructed = new URL(path, base);
      if (params) {
        Object.keys(params).forEach(key => {
          const v = params[key];
          if (v !== undefined && v !== null) constructed.searchParams.append(key, String(v));
        });
      }
      urlStr = constructed.toString();
    } catch (e) {
      // Fallback: simple concatenation
      urlStr = `${this.baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
      if (params) {
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
          const v = params[key];
          if (v !== undefined && v !== null) searchParams.append(key, String(v));
        });
        const qs = searchParams.toString();
        if (qs) urlStr += `?${qs}`;
      }
    }

    return urlStr;
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
      logger.error('API Client', `GET ${path} falhou ao acessar ${url}`, error);

      // If this was a network error (fetch TypeError) and we don't have a baseURL
      // but NEXT_PUBLIC_API_URL is set, try once more with that as absolute base.
      if (error instanceof TypeError && !this.baseURL) {
        const envBase = process.env.NEXT_PUBLIC_API_URL;
        if (envBase) {
          const altUrl = new URL(path.startsWith('/') ? path : `/${path}`, envBase).toString();
          logger.info('API Client', `Tentando fallback para URL absoluta: ${altUrl}`);
          try {
            const resp2 = await fetch(altUrl, { method: 'GET', headers: this.getHeaders(config?.headers) });
            const duration2 = Date.now() - startTime;
            logger.success('API Client', `GET ${path} fallback - ${resp2.status}`, { duration: `${duration2}ms` });
            return this.handleResponse<T>(resp2);
          } catch (err2) {
            logger.error('API Client', `Fallback GET ${path} tambem falhou ao acessar ${altUrl}`, err2);
            const errMsg = `Falha na requisi\u00e7\u00e3o HTTP para ${url} e fallback ${altUrl}. Verifique se o servidor est\u00e1 rodando e CORS.`;
            throw new Error(errMsg);
          }
        }
      }

      if (error instanceof TypeError) {
        const errorMsg = `Falha na requisi\u00e7\u00e3o HTTP para ${url}. Verifique se o servidor est\u00e1 rodando e se a URL/API est\u00e1 correta. (Veja NEXT_PUBLIC_API_URL)`;
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
      logger.error('API Client', `POST ${path} falhou ao acessar ${url}`, error);

      if (error instanceof TypeError && !this.baseURL) {
        const envBase = process.env.NEXT_PUBLIC_API_URL;
        if (envBase) {
          const altUrl = new URL(path.startsWith('/') ? path : `/${path}`, envBase).toString();
          logger.info('API Client', `Tentando fallback para URL absoluta: ${altUrl}`);
          try {
            const resp2 = await fetch(altUrl, { method: 'POST', headers: this.getHeaders(config?.headers), body: data ? JSON.stringify(data) : undefined });
            const duration2 = Date.now() - startTime;
            logger.success('API Client', `POST ${path} fallback - ${resp2.status}`, { duration: `${duration2}ms` });
            return this.handleResponse<T>(resp2);
          } catch (err2) {
            logger.error('API Client', `Fallback POST ${path} tambem falhou ao acessar ${altUrl}`, err2);
            const errMsg = `Falha na requisi\u00e7\u00e3o HTTP para ${url} e fallback ${altUrl}. Verifique se o servidor est\u00e1 rodando e CORS.`;
            throw new Error(errMsg);
          }
        }
      }

      if (error instanceof TypeError) {
        const errorMsg = `Falha na requisi\u00e7\u00e3o HTTP para ${url}. Verifique rede/CORS/NEXT_PUBLIC_API_URL.`;
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
      logger.error('API Client', `PUT ${path} falhou ao acessar ${url}`, error);
      if (error instanceof TypeError && !this.baseURL) {
        const envBase = process.env.NEXT_PUBLIC_API_URL;
        if (envBase) {
          const altUrl = new URL(path.startsWith('/') ? path : `/${path}`, envBase).toString();
          logger.info('API Client', `Tentando fallback para URL absoluta: ${altUrl}`);
          try {
            const resp2 = await fetch(altUrl, { method: 'PUT', headers: this.getHeaders(config?.headers), body: data ? JSON.stringify(data) : undefined });
            logger.success('API Client', `PUT ${path} fallback - ${resp2.status}`);
            return this.handleResponse<T>(resp2);
          } catch (err2) {
            logger.error('API Client', `Fallback PUT ${path} tambem falhou ao acessar ${altUrl}`, err2);
            throw new Error(`Falha na requisi\u00e7\u00e3o HTTP para ${url} e fallback ${altUrl}.`);
          }
        }
      }
      if (error instanceof TypeError) {
        const errorMsg = `Falha na requisi\u00e7\u00e3o HTTP para ${url}. Verifique rede/CORS/NEXT_PUBLIC_API_URL.`;
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
      logger.error('API Client', `PATCH ${path} falhou ao acessar ${url}`, error);
      if (error instanceof TypeError && !this.baseURL) {
        const envBase = process.env.NEXT_PUBLIC_API_URL;
        if (envBase) {
          const altUrl = new URL(path.startsWith('/') ? path : `/${path}`, envBase).toString();
          logger.info('API Client', `Tentando fallback para URL absoluta: ${altUrl}`);
          try {
            const resp2 = await fetch(altUrl, { method: 'PATCH', headers: this.getHeaders(config?.headers), body: data ? JSON.stringify(data) : undefined });
            logger.success('API Client', `PATCH ${path} fallback - ${resp2.status}`);
            return this.handleResponse<T>(resp2);
          } catch (err2) {
            logger.error('API Client', `Fallback PATCH ${path} tambem falhou ao acessar ${altUrl}`, err2);
            throw new Error(`Falha na requisi\u00e7\u00e3o HTTP para ${url} e fallback ${altUrl}.`);
          }
        }
      }
      if (error instanceof TypeError) {
        const errorMsg = `Falha na requisi\u00e7\u00e3o HTTP para ${url}. Verifique rede/CORS/NEXT_PUBLIC_API_URL.`;
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
      logger.error('API Client', `DELETE ${path} falhou ao acessar ${url}`, error);
      if (error instanceof TypeError && !this.baseURL) {
        const envBase = process.env.NEXT_PUBLIC_API_URL;
        if (envBase) {
          const altUrl = new URL(path.startsWith('/') ? path : `/${path}`, envBase).toString();
          logger.info('API Client', `Tentando fallback para URL absoluta: ${altUrl}`);
          try {
            const resp2 = await fetch(altUrl, { method: 'DELETE', headers: this.getHeaders(config?.headers) });
            logger.success('API Client', `DELETE ${path} fallback - ${resp2.status}`);
            return this.handleResponse<T>(resp2);
          } catch (err2) {
            logger.error('API Client', `Fallback DELETE ${path} tambem falhou ao acessar ${altUrl}`, err2);
            throw new Error(`Falha na requisi\u00e7\u00e3o HTTP para ${url} e fallback ${altUrl}.`);
          }
        }
      }
      if (error instanceof TypeError) {
        const errorMsg = `Falha na requisi\u00e7\u00e3o HTTP para ${url}. Verifique rede/CORS/NEXT_PUBLIC_API_URL.`;
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

      // Attach helpful hint for network/CORS failures
      throw new Error(`${errorMessage} (Verifique CORS, credenciais e NEXT_PUBLIC_API_URL)`);
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
