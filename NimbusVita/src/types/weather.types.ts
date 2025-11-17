/**
 * Weather-related TypeScript type definitions
 */

export interface WeatherData {
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  uvIndex: number | null;
  uvFromApi: boolean;
  airQuality: number | null;
  condition: string;
}

export interface RawWeatherData {
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  uvIndex: number | null;
  uvFromApi: boolean;
  airQuality: number | null;
  condition?: string;
}

export interface WeatherCache extends WeatherData {
  timestamp: number;
  location: string;
}

export type WeatherSource = 'api' | 'simulado' | 'cache';

export type WeatherCondition = 
  | 'Nublado'
  | 'Ensolarado'
  | 'Parcialmente Nublado'
  | 'Chuvoso'
  | 'Tempestade'
  | 'Névoa'
  | 'Neve'
  | 'Granizo';
