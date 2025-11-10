// Sistema de Logging Detalhado para Terminal
// Formata logs de forma clara e colorida para facilitar o debug

type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  }

  private getColorCode(level: LogLevel): string {
    switch (level) {
      case 'SUCCESS':
        return '\x1b[32m'; // Verde
      case 'ERROR':
        return '\x1b[31m'; // Vermelho
      case 'WARN':
        return '\x1b[33m'; // Amarelo
      case 'DEBUG':
        return '\x1b[36m'; // Ciano
      case 'INFO':
      default:
        return '\x1b[34m'; // Azul
    }
  }

  private resetColor = '\x1b[0m';
  private bold = '\x1b[1m';

  private log(level: LogLevel, category: string, message: string, data?: any) {
    if (!this.isDevelopment && level === 'DEBUG') {
      return; // Não mostrar DEBUG em produção
    }

    const timestamp = this.formatTimestamp(new Date());
    const color = this.getColorCode(level);
    const categoryFormatted = `[${category}]`.padEnd(20);
    const levelFormatted = level.padEnd(8);

    const logEntry: LogEntry = {
      level,
      category,
      message,
      data,
      timestamp: new Date(),
    };

    // Formatar mensagem principal
    let logMessage = `${color}${this.bold}${levelFormatted}${this.resetColor} `;
    logMessage += `${color}${timestamp}${this.resetColor} `;
    logMessage += `${this.bold}${categoryFormatted}${this.resetColor} `;
    logMessage += `${message}`;

    // Log no console
    if (data) {
      console.log(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  info(category: string, message: string, data?: any) {
    this.log('INFO', category, message, data);
  }

  success(category: string, message: string, data?: any) {
    this.log('SUCCESS', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log('WARN', category, message, data);
  }

  error(category: string, message: string, error?: any) {
    this.log('ERROR', category, error?.message || message, error);
    if (error?.stack) {
      console.error('📚 Stack:', error.stack);
    }
  }

  debug(category: string, message: string, data?: any) {
    this.log('DEBUG', category, message, data);
  }
}

// Exportar instância singleton
export const logger = new Logger();

