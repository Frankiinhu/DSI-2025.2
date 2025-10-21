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
  // OpenWeather wind speed is m/s -> convert to km/h
  const windSpeed = wind?.speed ? Math.round(wind.speed * 3.6) : null;
  const condition = weather && weather[0] ? weather[0].description : (weather && weather[0] ? weather[0].main : '');

  let uvIndex = 0;
  let uvFromApi = false;
  try {
    // onecall endpoint to get UV (current.uvi)
    const onecallUrl = `${BASE_URL}/onecall?lat=${coord.lat}&lon=${coord.lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=metric`;
    const onecallRes = await fetch(onecallUrl);
    console.log('UV API response status:', onecallRes.status);
    if (onecallRes.ok) {
      const onecallJson = await onecallRes.json();
      uvIndex = onecallJson.current?.uvi ?? 0;
      uvFromApi = true;
      console.log('UV index from API:', uvIndex);
    } else {
      console.warn('UV API não disponível:', await onecallRes.text());
    }
  } catch (e) {
    console.warn('Erro ao buscar UV index:', e);
    // fallback para 0
  }

  let airQuality = null;
  try {
    const airUrl = `${BASE_URL}/air_pollution?lat=${coord.lat}&lon=${coord.lon}&appid=${API_KEY}`;
    const airRes = await fetch(airUrl);
    if (airRes.ok) {
      const airJson = await airRes.json();
      const aqi = airJson.list && airJson.list[0] && airJson.list[0].main ? airJson.list[0].main.aqi : null;
      if (aqi) {
        airQuality = mapAqiToNumber(aqi);
      }
    }
  } catch (e) {
    console.warn('Erro ao buscar qualidade do ar:', e);
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
const CACHE_TTL = 1000 * 60 * 10; // 10 minutos

export async function saveWeatherCache(payload: CurrentWeatherResult) {
  try {
    const toSave = JSON.stringify({ ts: Date.now(), data: payload });
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(CACHE_KEY, toSave);
  } catch (e) {
    // ignore cache errors
  }
}

export async function loadWeatherCache(): Promise<CurrentWeatherResult | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.ts || !parsed.data) return null;
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data as CurrentWeatherResult;
  } catch (e) {
    return null;
  }
}
