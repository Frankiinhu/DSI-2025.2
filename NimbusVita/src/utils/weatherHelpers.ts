/**
 * Weather Data Utilities
 * Centralized helper functions for weather data transformation and generation
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
  
  return {
    temperature: Math.floor(Math.random() * 20) + 15, // 15-35°C
    humidity: Math.floor(Math.random() * 50) + 50, // 50-100%
    pressure: Math.floor(Math.random() * 80) + 980, // 980-1060 hPa
    windSpeed: Math.floor(Math.random() * 35) + 5, // 5-40 km/h
    uvIndex: Math.floor(Math.random() * 12) + 1, // 1-12
    uvFromApi: false, // simulated data
    airQuality: Math.floor(Math.random() * 150) + 30, // 30-180 AQI
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
  if (uvIndex <= 2) return 'Baixo';
  if (uvIndex <= 5) return 'Moderado';
  if (uvIndex <= 7) return 'Alto';
  if (uvIndex <= 10) return 'Muito Alto';
  return 'Extremo';
}

/**
 * Get air quality description based on AQI value
 * @param aqi - Air Quality Index (0-500)
 * @returns Human-readable air quality level
 */
export function getAirQualityDescription(aqi: number | null): string {
  if (aqi === null) return 'Desconhecido';
  if (aqi <= 50) return 'Bom';
  if (aqi <= 100) return 'Moderado';
  if (aqi <= 150) return 'Ruim para Grupos Sensíveis';
  if (aqi <= 200) return 'Ruim';
  if (aqi <= 300) return 'Muito Ruim';
  return 'Perigoso';
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
