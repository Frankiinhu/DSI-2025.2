/**
 * Application-wide thresholds and constants
 * Centralizes magic numbers for maintainability
 */

/**
 * UV Index Thresholds
 * Based on WHO Global Solar UV Index standards
 */
export const UV_THRESHOLDS = {
  LOW: 2,
  MODERATE: 5,
  HIGH: 7,
  VERY_HIGH: 10,
  EXTREME: 11,
} as const;

/**
 * UV Index Categories
 */
export const UV_CATEGORIES = {
  LOW: 'Baixo',
  MODERATE: 'Moderado',
  HIGH: 'Alto',
  VERY_HIGH: 'Muito Alto',
  EXTREME: 'Extremo',
} as const;

/**
 * Air Quality Index (AQI) Thresholds
 * Based on EPA Air Quality Index standards
 */
export const AQI_THRESHOLDS = {
  GOOD: 50,
  MODERATE: 100,
  UNHEALTHY_SENSITIVE: 150,
  UNHEALTHY: 200,
  VERY_UNHEALTHY: 300,
  HAZARDOUS: 500,
} as const;

/**
 * AQI Categories
 */
export const AQI_CATEGORIES = {
  GOOD: 'Bom',
  MODERATE: 'Moderado',
  UNHEALTHY_SENSITIVE: 'Ruim para Grupos Sensíveis',
  UNHEALTHY: 'Ruim',
  VERY_UNHEALTHY: 'Muito Ruim',
  HAZARDOUS: 'Perigoso',
} as const;

/**
 * Weather-related Risk Thresholds
 */
export const RISK_THRESHOLDS = {
  TEMPERATURE: {
    VERY_HIGH: 32, // °C
    HIGH: 28,
    MODERATE: 24,
  },
  HUMIDITY: {
    VERY_HIGH: 85, // %
    HIGH: 75,
    MODERATE: 65,
  },
  PRESSURE: {
    LOW: 1000, // hPa
    NORMAL: 1013,
    HIGH: 1020,
  },
  WIND_SPEED: {
    HIGH: 30, // km/h
    MODERATE: 20,
    LOW: 10,
  },
} as const;

/**
 * Risk Level Percentages
 */
export const RISK_PERCENTAGES = {
  LOW: 30,
  MODERATE: 60,
  HIGH: 80,
  CRITICAL: 95,
} as const;

/**
 * Risk Level Names
 */
export const RISK_LEVELS = {
  LOW: 'Baixo',
  MODERATE: 'Moderado',
  HIGH: 'Alto',
  CRITICAL: 'Crítico',
} as const;

/**
 * Weather Data Generation Ranges (for simulation)
 */
export const WEATHER_SIMULATION_RANGES = {
  TEMPERATURE: {
    MIN: 15, // °C
    MAX: 35,
  },
  HUMIDITY: {
    MIN: 50, // %
    MAX: 100,
  },
  PRESSURE: {
    MIN: 980, // hPa
    MAX: 1060,
  },
  WIND_SPEED: {
    MIN: 5, // km/h
    MAX: 40,
  },
  UV_INDEX: {
    MIN: 1,
    MAX: 12,
  },
  AIR_QUALITY: {
    MIN: 30, // AQI
    MAX: 180,
  },
} as const;

/**
 * Timeout Values (in milliseconds)
 */
export const TIMEOUTS = {
  API_REQUEST: 10000, // 10 seconds
  CACHE_VALIDITY: 3600000, // 1 hour
  DEBOUNCE_SEARCH: 300, // 300ms
  TOAST_DURATION: 3000, // 3 seconds
  SPLASH_MINIMUM: 2000, // 2 seconds
} as const;

/**
 * Cache Keys
 */
export const CACHE_KEYS = {
  WEATHER_DATA: 'weather_cache',
  CHECKUP_DATA: 'checkup_cache',
  USER_PREFERENCES: 'user_preferences',
  SYMPTOM_CATALOG: 'symptom_catalog',
} as const;

/**
 * Pagination Constants
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  INITIAL_PAGE: 1,
} as const;

/**
 * Form Validation Constants
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  AGE_MIN: 1,
  AGE_MAX: 120,
  HEIGHT_MIN: 50, // cm
  HEIGHT_MAX: 250,
  WEIGHT_MIN: 20, // kg
  WEIGHT_MAX: 300,
} as const;

/**
 * Date/Time Formats
 */
export const DATE_FORMATS = {
  TIME_SHORT: { hour: '2-digit', minute: '2-digit' } as const,
  DATE_SHORT: { day: '2-digit', month: '2-digit', year: 'numeric' } as const,
  DATE_LONG: { day: '2-digit', month: 'long', year: 'numeric' } as const,
  DATETIME_FULL: { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  } as const,
} as const;
