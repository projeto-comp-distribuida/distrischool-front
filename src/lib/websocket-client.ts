// Cliente WebSocket para Notificações em Tempo Real
import { logger } from './logger';

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

export type MessageHandler = (message: WebSocketMessage) => void;
export type StatusChangeHandler = (status: WebSocketStatus) => void;
export type ErrorHandler = (error: Error) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 segundos
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private status: WebSocketStatus = 'disconnected';
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusChangeHandlers: Set<StatusChangeHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private readonly heartbeatIntervalMs = 30000; // 30 segundos

  constructor(baseUrl: string) {
    // Determinar protocolo ws/wss de forma robusta
    let protocol = 'ws';
    
    try {
      // Se baseUrl é uma URL completa, usar seu protocolo
      if (baseUrl.includes('://')) {
        const parsedUrl = new URL(baseUrl);
        protocol = parsedUrl.protocol === 'https:' ? 'wss' : 'ws';
      } else if (typeof window !== 'undefined') {
        // Se estamos no browser, usar protocolo da página atual
        protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      }
    } catch (e) {
      // Fallback: se baseUrl contém https, usar wss
      if (baseUrl.includes('https')) {
        protocol = 'wss';
      }
    }
    
    // Construir URL usando URL constructor para lidar com paths e ports
    try {
      const baseUrlNormalized = baseUrl.replace(/^(https?:\/\/)/, '');
      const baseWithProtocol = `${protocol === 'wss' ? 'https' : 'http'}://${baseUrlNormalized}`;
      const fullUrl = new URL('/ws/notifications', baseWithProtocol);
      this.url = fullUrl.toString().replace(/^https?:/, protocol + ':');
    } catch (e) {
      // Fallback para método simples
      const cleanUrl = baseUrl.replace(/^https?:\/\//, '');
      this.url = `${protocol}://${cleanUrl}/ws/notifications`;
    }
    
    logger.info('WebSocket', `Cliente WebSocket inicializado para: ${this.url}`);
  }

  /**
   * Conecta ao servidor WebSocket
   */
  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.warn('WebSocket', 'Já está conectado. Desconectando antes de reconectar...');
      this.disconnect();
    }

    if (!token) {
      logger.error('WebSocket', 'Token não fornecido para conexão');
      return;
    }

    this.token = token;
    this.reconnectAttempts = 0;
    this.setStatus('connecting');
    
    const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`;
    const maskedUrl = token ? wsUrl.replace(token, '***') : wsUrl;
    logger.info('WebSocket', `Tentando conectar ao WebSocket...`, { url: maskedUrl });

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        logger.success('WebSocket', '✅ Conectado ao servidor WebSocket com sucesso!');
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          logger.debug('WebSocket', '📨 Mensagem recebida', { 
            type: message.type,
            hasData: !!message.data 
          });
          
          // Notificar todos os handlers
          this.messageHandlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              logger.error('WebSocket', 'Erro ao processar mensagem no handler', error);
            }
          });
        } catch (error) {
          logger.error('WebSocket', 'Erro ao processar mensagem WebSocket', error);
          logger.debug('WebSocket', 'Dados da mensagem:', event.data);
        }
      };

      this.ws.onerror = (error) => {
        logger.error('WebSocket', '❌ Erro na conexão WebSocket', error);
        this.setStatus('error');
        
        // Notificar handlers de erro
        this.errorHandlers.forEach(handler => {
          try {
            handler(new Error('Erro na conexão WebSocket'));
          } catch (err) {
            // Ignorar erros nos handlers
          }
        });
      };

      this.ws.onclose = (event) => {
        logger.warn('WebSocket', '🔌 Conexão WebSocket fechada', {
          code: event.code,
          reason: event.reason || 'Sem razão fornecida',
          wasClean: event.wasClean
        });

        this.setStatus('disconnected');
        this.stopHeartbeat();

        // Tentar reconectar se não foi um fechamento intencional
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error('WebSocket', `❌ Máximo de tentativas de reconexão atingido (${this.maxReconnectAttempts})`);
        }
      };

    } catch (error) {
      logger.error('WebSocket', 'Erro ao criar conexão WebSocket', error);
      this.setStatus('error');
    }
  }

  /**
   * Agenda uma tentativa de reconexão
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Já existe uma reconexão agendada
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts; // Backoff exponencial
    
    logger.info('WebSocket', `🔄 Agendando reconexão em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.token) {
        logger.info('WebSocket', '🔄 Tentando reconectar...');
        this.connect(this.token);
      }
    }, delay);
  }

  /**
   * Desconecta do servidor WebSocket
   */
  disconnect(): void {
    logger.info('WebSocket', '🔌 Desconectando WebSocket...');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      // Código 1000 = fechamento normal (não tentará reconectar)
      this.ws.close(1000, 'Desconexão intencional pelo cliente');
      this.ws = null;
    }

    this.setStatus('disconnected');
    this.token = null;
  }

  /**
   * Envia uma mensagem para o servidor
   */
  send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('WebSocket', '❌ Tentativa de enviar mensagem sem conexão ativa');
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      this.ws.send(messageStr);
      logger.debug('WebSocket', '📤 Mensagem enviada', { message });
    } catch (error) {
      logger.error('WebSocket', 'Erro ao enviar mensagem', error);
    }
  }

  /**
   * Registra um handler para mensagens recebidas
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    logger.debug('WebSocket', `Handler de mensagem registrado. Total: ${this.messageHandlers.size}`);
    
    // Retorna função para remover o handler
    return () => {
      this.messageHandlers.delete(handler);
      logger.debug('WebSocket', `Handler de mensagem removido. Total: ${this.messageHandlers.size}`);
    };
  }

  /**
   * Registra um handler para mudanças de status
   */
  onStatusChange(handler: StatusChangeHandler): () => void {
    this.statusChangeHandlers.add(handler);
    logger.debug('WebSocket', `Handler de status registrado. Total: ${this.statusChangeHandlers.size}`);
    
    // Retorna função para remover o handler
    return () => {
      this.statusChangeHandlers.delete(handler);
      logger.debug('WebSocket', `Handler de status removido. Total: ${this.statusChangeHandlers.size}`);
    };
  }

  /**
   * Registra um handler para erros
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    logger.debug('WebSocket', `Handler de erro registrado. Total: ${this.errorHandlers.size}`);
    
    // Retorna função para remover o handler
    return () => {
      this.errorHandlers.delete(handler);
      logger.debug('WebSocket', `Handler de erro removido. Total: ${this.errorHandlers.size}`);
    };
  }

  /**
   * Atualiza o status e notifica handlers
   */
  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      const oldStatus = this.status;
      this.status = status;
      logger.info('WebSocket', `Status alterado: ${oldStatus} → ${status}`);
      
      this.statusChangeHandlers.forEach(handler => {
        try {
          handler(status);
        } catch (error) {
          logger.error('WebSocket', 'Erro no handler de status', error);
        }
      });
    }
  }

  /**
   * Obtém o status atual
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Inicia heartbeat para manter conexão viva
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        logger.debug('WebSocket', '💓 Enviando heartbeat...');
        this.send({ type: 'ping' });
      }
    }, this.heartbeatIntervalMs);

    logger.debug('WebSocket', `Heartbeat iniciado (intervalo: ${this.heartbeatIntervalMs}ms)`);
  }

  /**
   * Para o heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      logger.debug('WebSocket', 'Heartbeat parado');
    }
  }
}

// Exportar instância singleton
// Usar apenas no cliente (browser)
const getApiBaseUrl = () => {
  // Prefer NEXT_PUBLIC_API_URL if set, otherwise fall back to the known gateway
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return env || 'http://distrischool.ddns.net';
  }
  // On server-side use env or remote gateway
  return env || 'http://distrischool.ddns.net';
};

export const websocketClient = typeof window !== 'undefined'
  ? new WebSocketClient(getApiBaseUrl())
  : null as any; // Não será usado no servidor
