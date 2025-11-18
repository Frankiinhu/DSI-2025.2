/**
 * Sistema de logging otimizado
 * Em produção, logs são desabilitados para melhor performance
 */

const isDevelopment = __DEV__;

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    // Erros sempre são logados, mas apenas a mensagem em produção
    if (isDevelopment) {
      console.error(message, ...args);
    } else {
      console.error(message);
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
};
