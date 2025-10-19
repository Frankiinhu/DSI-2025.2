/**
 * Utilitários de Estilo do NimbusVita
 * Funções auxiliares para manipulação de estilos
 */

import { Colors } from './colors';

/**
 * Retorna cor baseada no nível de risco
 */
export const getRiskColor = (percentage: number): string => {
  if (percentage < 30) return Colors.riskLow;
  if (percentage < 60) return Colors.riskModerate;
  return Colors.riskHigh;
};

/**
 * Retorna cor baseada na temperatura
 */
export const getTemperatureColor = (temp: number): string => {
  if (temp > 34) return Colors.weather.hot;
  if (temp > 28) return Colors.weather.warm;
  if (temp < 18) return Colors.weather.cool;
  return Colors.primaryLight;
};

/**
 * Retorna cor baseada na qualidade do ar
 */
export const getAirQualityColor = (aqi: number): string => {
  if (aqi > 150) return Colors.weather.air.dangerous;
  if (aqi > 100) return Colors.weather.air.unhealthy;
  if (aqi > 50) return Colors.weather.air.moderate;
  return Colors.weather.air.good;
};

/**
 * Adiciona opacidade a uma cor hexadecimal
 */
export const addOpacity = (hex: string, opacity: number): string => {
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hex}${alpha}`;
};
