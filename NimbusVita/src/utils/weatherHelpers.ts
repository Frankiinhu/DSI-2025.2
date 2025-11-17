/**
 * Weather Data Utilities
 * Centralized helper functions for weather data transformation and generation
 */

import {
  UV_THRESHOLDS,
  UV_CATEGORIES,
  AQI_THRESHOLDS,
  AQI_CATEGORIES,
  WEATHER_SIMULATION_RANGES,
} from '../constants/thresholds';

// Re-export types from centralized location
export type { WeatherData, RawWeatherData, WeatherCache, WeatherSource, WeatherCondition } from '../types/weather.types';
import type { WeatherData, RawWeatherData } from '../types/weather.types';

/**
 * Weather conditions for random generation
 */
const WEATHER_CONDITIONS = [
  'Nublado',
  'Ensolarado',
  'Parcialmente Nublado',
  'Chuvoso',
  'Tempestade'
] as const;

/**
 * Generate random weather data for fallback/demo purposes
 * @returns Simulated weather data
 */
export function generateRandomWeatherData(): WeatherData {
  const randomCondition = WEATHER_CONDITIONS[
    Math.floor(Math.random() * WEATHER_CONDITIONS.length)
  ];
  
  const { TEMPERATURE, HUMIDITY, PRESSURE, WIND_SPEED, UV_INDEX, AIR_QUALITY } = WEATHER_SIMULATION_RANGES;
  
  return {
    temperature: Math.floor(Math.random() * (TEMPERATURE.MAX - TEMPERATURE.MIN)) + TEMPERATURE.MIN,
    humidity: Math.floor(Math.random() * (HUMIDITY.MAX - HUMIDITY.MIN)) + HUMIDITY.MIN,
    pressure: Math.floor(Math.random() * (PRESSURE.MAX - PRESSURE.MIN)) + PRESSURE.MIN,
    windSpeed: Math.floor(Math.random() * (WIND_SPEED.MAX - WIND_SPEED.MIN)) + WIND_SPEED.MIN,
    uvIndex: Math.floor(Math.random() * (UV_INDEX.MAX - UV_INDEX.MIN)) + UV_INDEX.MIN,
    uvFromApi: false, // simulated data
    airQuality: Math.floor(Math.random() * (AIR_QUALITY.MAX - AIR_QUALITY.MIN)) + AIR_QUALITY.MIN,
    condition: randomCondition
  };
}

/**
 * Transform raw weather API data into the app's WeatherData format
 * Handles null values, rounding, and default fallbacks
 * @param raw - Raw weather data from API or cache
 * @returns Transformed weather data
 */
export function transformWeatherData(raw: RawWeatherData): WeatherData {
  return {
    temperature: raw.temperature !== null ? Math.round(raw.temperature) : null,
    humidity: raw.humidity,
    pressure: raw.pressure,
    windSpeed: raw.windSpeed,
    uvIndex: raw.uvIndex,
    uvFromApi: raw.uvFromApi,
    airQuality: raw.airQuality,
    condition: raw.condition || '—'
  };
}

/**
 * Check if weather data is stale (older than 1 hour)
 * @param lastUpdate - Last update timestamp
 * @returns True if data is stale
 */
export function isWeatherDataStale(lastUpdate: Date): boolean {
  const ONE_HOUR = 60 * 60 * 1000;
  return Date.now() - lastUpdate.getTime() > ONE_HOUR;
}

/**
 * Get UV index description based on value
 * @param uvIndex - UV index value (1-12+)
 * @returns Human-readable UV level
 */
export function getUVDescription(uvIndex: number | null): string {
  if (uvIndex === null) return 'Desconhecido';
  if (uvIndex <= UV_THRESHOLDS.LOW) return UV_CATEGORIES.LOW;
  if (uvIndex <= UV_THRESHOLDS.MODERATE) return UV_CATEGORIES.MODERATE;
  if (uvIndex <= UV_THRESHOLDS.HIGH) return UV_CATEGORIES.HIGH;
  if (uvIndex <= UV_THRESHOLDS.VERY_HIGH) return UV_CATEGORIES.VERY_HIGH;
  return UV_CATEGORIES.EXTREME;
}

/**
 * Get air quality description based on AQI value
 * @param aqi - Air Quality Index (0-500)
 * @returns Human-readable air quality level
 */
export function getAirQualityDescription(aqi: number | null): string {
  if (aqi === null) return 'Desconhecido';
  if (aqi <= AQI_THRESHOLDS.GOOD) return AQI_CATEGORIES.GOOD;
  if (aqi <= AQI_THRESHOLDS.MODERATE) return AQI_CATEGORIES.MODERATE;
  if (aqi <= AQI_THRESHOLDS.UNHEALTHY_SENSITIVE) return AQI_CATEGORIES.UNHEALTHY_SENSITIVE;
  if (aqi <= AQI_THRESHOLDS.UNHEALTHY) return AQI_CATEGORIES.UNHEALTHY;
  if (aqi <= AQI_THRESHOLDS.VERY_UNHEALTHY) return AQI_CATEGORIES.VERY_UNHEALTHY;
  return AQI_CATEGORIES.HAZARDOUS;
}

/**
 * Format temperature with unit
 * @param temp - Temperature in Celsius
 * @returns Formatted temperature string
 */
export function formatTemperature(temp: number | null): string {
  return temp !== null ? `${temp}°C` : '—';
}

/**
 * Format humidity with unit
 * @param humidity - Humidity percentage
 * @returns Formatted humidity string
 */
export function formatHumidity(humidity: number | null): string {
  return humidity !== null ? `${humidity}%` : '—';
}

/**
 * Format pressure with unit
 * @param pressure - Atmospheric pressure in hPa
 * @returns Formatted pressure string
 */
export function formatPressure(pressure: number | null): string {
  return pressure !== null ? `${pressure} hPa` : '—';
}

/**
 * Format wind speed with unit
 * @param speed - Wind speed in km/h
 * @returns Formatted wind speed string
 */
export function formatWindSpeed(speed: number | null): string {
  return speed !== null ? `${speed} km/h` : '—';
}
