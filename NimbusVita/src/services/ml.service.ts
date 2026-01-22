/**
 * Serviço para integração com a API de Machine Learning
 */

import { ML_API_PRODUCTION_URL } from '../config/ml.config';
import { logger } from '../utils/logger';

// URL da API - alterar conforme ambiente
const getApiUrl = () => {
  // Always use production URL (Render deployment)
  // For local development, update ML_API_PRODUCTION_URL in ml.config.ts
  return ML_API_PRODUCTION_URL;
};

const ML_API_URL = getApiUrl();

logger.info('ML API configured', { url: ML_API_URL, env: __DEV__ ? 'development' : 'production' });

export interface ShapExplanation {
  feature: string;
  impact: number;
  value: number;
}

export interface DiagnosisResult {
  condition: string;
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  explanations?: ShapExplanation[];
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
    logger.debug('Connecting to ML API for prediction', { url: ML_API_URL, symptomCount: symptoms.length });
    
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
      const errorMsg = errorData.detail || `HTTP error: ${response.status}`;
      logger.error('ML API returned error response', { status: response.status, error: errorData });
      throw new Error(errorMsg);
    }

    const data: PredictionResponse = await response.json();
    logger.info('ML API prediction received successfully', { 
      diagnosesCount: data.diagnoses.length,
      symptomCount: data.total_symptoms 
    });
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.error('ML API request timeout after 60 seconds');
      } else {
        logger.error('Error calling ML API', { error: error.message, symptomCount: symptoms.length });
      }
    }
    throw error;
  }
}

/**
 * Faz predição de diagnósticos COM explicações SHAP baseado nos sintomas selecionados
 * @param symptoms Array com IDs dos sintomas selecionados
 * @returns Predição com diagnósticos, probabilidades e explicações SHAP
 */
export async function predictDiagnosisWithExplanations(
  symptoms: string[]
): Promise<PredictionResponse> {
  try {
    logger.debug('Connecting to ML API for prediction with SHAP explanations', { 
      url: ML_API_URL, 
      symptomCount: symptoms.length 
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(`${ML_API_URL}/predict-with-explanations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symptoms } as PredictionRequest),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn('Explanations endpoint unavailable, falling back to standard prediction', { 
        status: response.status 
      });
      return await predictDiagnosis(symptoms);
    }

    const data: PredictionResponse = await response.json();
    logger.info('ML API prediction with SHAP explanations received', { 
      diagnosesCount: data.diagnoses.length,
      hasExplanations: data.diagnoses.some(d => d.explanations && d.explanations.length > 0)
    });
    return data;
  } catch (error) {
    logger.warn('Error fetching explanations, falling back to standard prediction', { error });
    return await predictDiagnosis(symptoms);
  }
}

/**
 * Verifica se a API está disponível
 * @returns true se API está funcionando
 */
export async function checkMLApiHealth(): Promise<boolean> {
  try {
    logger.debug('Checking ML API health', { url: ML_API_URL });
    
    const response = await fetch(`${ML_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logger.warn('ML API health check failed', { status: response.status });
      return false;
    }

    const data = await response.json();
    const isHealthy = data.status === 'healthy';
    logger.info('ML API health check completed', { isHealthy, status: data.status });
    return isHealthy;
  } catch (error) {
    logger.warn('ML API is not available', { error });
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
