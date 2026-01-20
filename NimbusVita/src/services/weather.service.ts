import { logger } from '../utils/logger';

export interface CurrentWeatherResult {
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null; // km/h
  uvIndex: number;
  uvFromApi: boolean; // indica se UV veio da API ou é fallback
  airQuality: number | null; // mapped AQI-like value
  condition: string;
}

interface WeatherCoordinates {
  lat: number;
  lon: number;
}

const mapAqiToNumber = (aqi: number) => {
  // OpenWeather returns 1..5. Map to an approximate AQI scale for UI.
  switch (aqi) {
    case 1:
      return 50;
    case 2:
      return 100;
    case 3:
      return 150;
    case 4:
      return 200;
    case 5:
      return 300;
    default:
      return 100;
  }
};

export async function getWeatherByCoordinates(lat: number, lon: number): Promise<CurrentWeatherResult> {
  const BASE_URL = process.env.EXPO_PUBLIC_OPENWEATHER_BASE_URL;
  const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

  if (!BASE_URL || !API_KEY) {
    throw new Error('OpenWeather config ausente (BASE_URL/API_KEY)');
  }

  const weatherUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`;
  const weatherRes = await fetch(weatherUrl);
  const weatherJson = await weatherRes.json();
  if (!weatherRes.ok) throw new Error(weatherJson.message || 'Erro ao obter weather');

  const { main, wind, coord, weather } = weatherJson;
  const temperature = main?.temp;
  const humidity = main?.humidity;
  const pressure = main?.pressure;
  const windSpeed = wind?.speed ? Math.round(wind.speed * 3.6) : null;
  const condition = weather && weather[0] ? weather[0].description : (weather && weather[0] ? weather[0].main : '');

  return await processWeatherData(coord, temperature, humidity, pressure, windSpeed, condition, BASE_URL, API_KEY);
}

export async function getCurrentWeather(cidade = 'Recife', pais = 'BR') : Promise<CurrentWeatherResult> {
  const BASE_URL = process.env.EXPO_PUBLIC_OPENWEATHER_BASE_URL;
  const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

  if (!BASE_URL || !API_KEY) {
    throw new Error('OpenWeather config ausente (BASE_URL/API_KEY)');
  }

  const q = encodeURIComponent(`${cidade},${pais}`);
  const weatherUrl = `${BASE_URL}/weather?q=${q}&appid=${API_KEY}&units=metric&lang=pt_br`;
  const weatherRes = await fetch(weatherUrl);
  const weatherJson = await weatherRes.json();
  if (!weatherRes.ok) throw new Error(weatherJson.message || 'Erro ao obter weather');

  const { main, wind, coord, weather } = weatherJson;
  const temperature = main?.temp;
  const humidity = main?.humidity;
  const pressure = main?.pressure;
  const windSpeed = wind?.speed ? Math.round(wind.speed * 3.6) : null;
  const condition = weather && weather[0] ? weather[0].description : (weather && weather[0] ? weather[0].main : '');

  return await processWeatherData(coord, temperature, humidity, pressure, windSpeed, condition, BASE_URL, API_KEY);
}

async function processWeatherData(
  coord: WeatherCoordinates,
  temperature: number | null,
  humidity: number | null,
  pressure: number | null,
  windSpeed: number | null,
  condition: string,
  BASE_URL: string,
  API_KEY: string
): Promise<CurrentWeatherResult> {
  logger.debug('Processing weather data', { coordinates: coord });

  let uvIndex = 0;
  let uvFromApi = false;
  
  try {
    // Tentar One Call (v2.5) primeiro
    const onecallUrlV25 = `${BASE_URL}/onecall?lat=${coord.lat}&lon=${coord.lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=metric`;
    logger.debug('Fetching UV from onecall v2.5', { lat: coord.lat, lon: coord.lon });
    
    let onecallRes = await fetch(onecallUrlV25);
    logger.debug('OneCall v2.5 response received', { status: onecallRes.status });
    
    if (onecallRes.ok) {
      const onecallJson = await onecallRes.json();
      uvIndex = onecallJson.current?.uvi ?? 0;
      uvFromApi = true;
      logger.info('UV index fetched from onecall v2.5', { uvIndex });
    } else {
      const text = await onecallRes.text();
      logger.warn('OneCall v2.5 unavailable', { status: onecallRes.status, response: text });

      // Se 401 ou endpoint não disponível, tentar One Call v3 (data/3.0)
      if (onecallRes.status === 401) {
        try {
          const altBase = BASE_URL.replace('/data/2.5', '/data/3.0');
          const onecallUrlV30 = `${altBase}/onecall?lat=${coord.lat}&lon=${coord.lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=metric`;
          const onecallResV30 = await fetch(onecallUrlV30);
          logger.debug('OneCall v3 response received', { status: onecallResV30.status });
          
          if (onecallResV30.ok) {
            const onecallJson = await onecallResV30.json();
            uvIndex = onecallJson.current?.uvi ?? 0;
            uvFromApi = true;
            logger.info('UV index fetched from onecall v3', { uvIndex });
          } else {
            const t2 = await onecallResV30.text();
            logger.warn('OneCall v3 unavailable', { status: onecallResV30.status, response: t2 });
          }
        } catch (error) {
          logger.warn('Error trying onecall v3', { error });
        }
      }

      // Se ainda não obteve UV, tentar endpoint legado /uvi (data/2.5/uvi)
      if (!uvFromApi) {
        try {
          const uviUrl = `${BASE_URL}/uvi?lat=${coord.lat}&lon=${coord.lon}&appid=${API_KEY}`;
          logger.debug('Fetching UV from legacy /uvi endpoint', { lat: coord.lat, lon: coord.lon });
          
          const uviRes = await fetch(uviUrl);
          logger.debug('UVI endpoint response received', { status: uviRes.status });
          
          if (uviRes.ok) {
            const uviJson = await uviRes.json();
            uvIndex = uviJson.value ?? uviJson.uvi ?? 0;
            uvFromApi = true;
            logger.info('UV index fetched from /uvi endpoint', { uvIndex });
          } else {
            logger.warn('UVI endpoint unavailable', { status: uviRes.status });
          }
        } catch (error) {
          logger.warn('Error fetching /uvi endpoint', { error });
        }
      }
    }
  } catch (error) {
    logger.warn('Error fetching UV index, using fallback', { error });
  }

  let airQuality = null;
  try {
    const airUrl = `${BASE_URL}/air_pollution?lat=${coord.lat}&lon=${coord.lon}&appid=${API_KEY}`;
    const airRes = await fetch(airUrl);
    if (airRes.ok) {
      const airJson = await airRes.json();
      const aqi = airJson.list?.[0]?.main?.aqi;
      if (aqi) {
        airQuality = mapAqiToNumber(aqi);
        logger.info('Air quality fetched', { aqi, airQuality });
      }
    }
  } catch (error) {
    logger.warn('Error fetching air quality', { error });
  }

  return {
    temperature: temperature ?? null,
    humidity: humidity ?? null,
    pressure: pressure ?? null,
    windSpeed: windSpeed ?? null,
    uvIndex: Math.round(uvIndex),
    uvFromApi,
    airQuality,
    condition,
  };
}

// Cache helpers (AsyncStorage)
const CACHE_KEY = '@nimbus:weather_latest';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function saveWeatherCache(payload: CurrentWeatherResult): Promise<void> {
  try {
    const toSave = JSON.stringify({ ts: Date.now(), data: payload });
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(CACHE_KEY, toSave);
    logger.debug('Weather cache saved successfully');
  } catch (error) {
    logger.warn('Failed to save weather cache', { error });
  }
}

export async function loadWeatherCache(): Promise<CurrentWeatherResult | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) {
      logger.debug('No weather cache found');
      return null;
    }
    
    const parsed = JSON.parse(raw);
    if (!parsed.ts || !parsed.data) {
      logger.warn('Invalid weather cache format');
      return null;
    }
    
    const cacheAge = Date.now() - parsed.ts;
    if (cacheAge > CACHE_TTL) {
      logger.debug('Weather cache expired', { ageMs: cacheAge });
      return null;
    }
    
    logger.debug('Weather cache loaded successfully', { ageMs: cacheAge });
    return parsed.data as CurrentWeatherResult;
  } catch (error) {
    logger.warn('Failed to load weather cache', { error });
    return null;
  }
}
