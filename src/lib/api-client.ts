// Base API Client for DistriSchool

// Usando porta direta do auth service temporariamente (8081)
// TODO: Configurar API Gateway corretamente para usar porta 8080
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

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
      } else {
        localStorage.removeItem('authToken');
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
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(config?.headers),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o microserviço de autenticação está rodando em http://localhost:8081');
      }
      throw error;
    }
  }

  async post<T>(path: string, data?: any, config?: ApiConfig): Promise<T> {
    const url = this.buildURL(path, config?.params);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(config?.headers),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o microserviço de autenticação está rodando em http://localhost:8081');
      }
      throw error;
    }
  }

  async put<T>(path: string, data?: any, config?: ApiConfig): Promise<T> {
    const url = this.buildURL(path, config?.params);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(config?.headers),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o microserviço de autenticação está rodando em http://localhost:8081');
      }
      throw error;
    }
  }

  async patch<T>(path: string, data?: any, config?: ApiConfig): Promise<T> {
    const url = this.buildURL(path, config?.params);
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(config?.headers),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o microserviço de autenticação está rodando em http://localhost:8081');
      }
      throw error;
    }
  }

  async delete<T>(path: string, config?: ApiConfig): Promise<T> {
    const url = this.buildURL(path, config?.params);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(config?.headers),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o microserviço de autenticação está rodando em http://localhost:8081');
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;
      
      if (isJson) {
        try {
          const errorData = await response.json();
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
          console.error('Erro ao processar resposta de erro:', e);
          errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
      } else {
        try {
          const textError = await response.text();
          errorMessage = textError || `Erro HTTP ${response.status}: ${response.statusText}`;
        } catch (e) {
          console.error('Erro ao ler texto da resposta:', e);
          errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
      }

      throw new Error(errorMessage);
    }

    if (isJson) {
      return response.json();
    }

    return response.text() as any;
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);


