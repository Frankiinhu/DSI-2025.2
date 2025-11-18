/**
 * Serviço para integração com a API de Machine Learning
 */

import { Platform } from 'react-native';
import { ML_API_HOST, ML_API_PORT, ML_API_PRODUCTION_URL } from '../config/ml.config';
import { logger } from '../utils/logger';

// URL da API - alterar conforme ambiente
const getApiUrl = () => {
  // FORÇAR PRODUÇÃO: Sempre usar Render para testes
  return ML_API_PRODUCTION_URL;
  
  // Modo DEV desabilitado temporariamente
  /* if (!__DEV__) {
    return ML_API_PRODUCTION_URL;
  }
  
  // Se IP customizado foi configurado (dispositivo físico)
  if (ML_API_HOST) {
    return `http://${ML_API_HOST}:${ML_API_PORT}`;
  } */
  
  // Configuração automática para emuladores
  if (Platform.OS === 'android') {
    // Android Emulator usa 10.0.2.2 para acessar localhost da máquina host
    return `http://10.0.2.2:${ML_API_PORT}`;
  } else if (Platform.OS === 'ios') {
    // iOS Simulator pode usar localhost
    return `http://localhost:${ML_API_PORT}`;
  } else {
    // Web ou outras plataformas
    return `http://localhost:${ML_API_PORT}`;
  }
};

const ML_API_URL = getApiUrl();

logger.info('📡 ML API configurada:', ML_API_URL);

export interface DiagnosisResult {
  condition: string;
  probability: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface PredictionResponse {
  diagnoses: DiagnosisResult[];
  selected_symptoms: string[];
  total_symptoms: number;
}

export interface PredictionRequest {
  symptoms: string[];
}

/**
 * Faz predição de diagnósticos baseado nos sintomas selecionados
 * @param symptoms Array com IDs dos sintomas selecionados
 * @returns Predição com diagnósticos e probabilidades
 */
export async function predictDiagnosis(
  symptoms: string[]
): Promise<PredictionResponse> {
  try {
    logger.debug('🔍 Tentando conectar à API:', ML_API_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout (Render cold start)
    
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symptoms } as PredictionRequest),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }

    const data: PredictionResponse = await response.json();
    logger.info('✅ Resposta da API recebida');
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error('⏱️ Timeout: API não respondeu em 60 segundos');
    } else {
      logger.error('❌ Erro ao chamar API de ML:', error.message);
    }
    throw error;
  }
}

/**
 * Verifica se a API está disponível
 * @returns true se API está funcionando
 */
export async function checkMLApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    logger.warn('⚠️ API de ML não está disponível');
    return false;
  }
}

/**
 * Converte resultados da API para o formato esperado pelo SymptomChecker
 * @param apiResponse Resposta da API
 * @returns Objeto com condições e probabilidades
 */
export function convertApiResponseToResults(
  apiResponse: PredictionResponse
): Record<string, number> {
  const results: Record<string, number> = {};
  
  apiResponse.diagnoses.forEach(diagnosis => {
    results[diagnosis.condition] = diagnosis.probability;
  });
  
  return results;
}
