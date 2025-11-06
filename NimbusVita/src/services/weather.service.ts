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

  // Logs de diagnóstico: cidade/resolução e coordenadas usadas para buscar UV
  try {
    console.log('Weather API resolved location name:', weatherJson.name ?? `${cidade},${pais}`);
    console.log('Coordinates resolved for location:', coord ? `lat=${coord.lat}, lon=${coord.lon}` : 'coord missing');
    // Mostra a URL de consulta (mascarando a chave) para ajudar a depurar sem vazar a API key
    try {
      const maskedWeatherUrl = weatherUrl.replace(`appid=${API_KEY}`, 'appid=***');
      console.log('Weather request URL:', maskedWeatherUrl);
    } catch (e) {
      // Ignore masking errors
    }
  } catch (e) {
    // não deve quebrar a execução do serviço
  }

  let uvIndex = 0;
  let uvFromApi = false;
  try {
    // Tentar One Call (v2.5) primeiro
    const onecallUrlV25 = `${BASE_URL}/onecall?lat=${coord.lat}&lon=${coord.lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=metric`;
    try {
      console.log('Fetching UV from onecall v2.5 (masked):', onecallUrlV25.replace(`appid=${API_KEY}`, 'appid=***'));
    } catch (e) {
      // ignore
    }
    let onecallRes = await fetch(onecallUrlV25);
    console.log('UV API (onecall v2.5) response status:', onecallRes.status);
    if (onecallRes.ok) {
      const onecallJson = await onecallRes.json();
      uvIndex = onecallJson.current?.uvi ?? onecallJson.current?.uvi ?? 0;
      uvFromApi = true;
      console.log('UV index from onecall v2.5 API:', uvIndex);
    } else {
      const text = await onecallRes.text();
      console.warn('onecall v2.5 não disponível:', onecallRes.status, text);

      // Se 401 ou endpoint não disponível, tentar One Call v3 (data/3.0)
      if (onecallRes.status === 401) {
        try {
          const altBase = BASE_URL.replace('/data/2.5', '/data/3.0');
          const onecallUrlV30 = `${altBase}/onecall?lat=${coord.lat}&lon=${coord.lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=metric`;
          const onecallResV30 = await fetch(onecallUrlV30);
          console.log('UV API (onecall v3) response status:', onecallResV30.status);
          if (onecallResV30.ok) {
            const onecallJson = await onecallResV30.json();
            uvIndex = onecallJson.current?.uvi ?? onecallJson.current?.uvi ?? 0;
            uvFromApi = true;
            console.log('UV index from onecall v3 API:', uvIndex);
          } else {
            const t2 = await onecallResV30.text();
            console.warn('onecall v3 não disponível:', onecallResV30.status, t2);
          }
        } catch (e) {
          console.warn('Erro ao tentar onecall v3:', e);
        }
      }

      // Se ainda não obteve UV, tentar endpoint legado /uvi (data/2.5/uvi)
      if (!uvFromApi) {
        try {
          const uviUrl = `${BASE_URL}/uvi?lat=${coord.lat}&lon=${coord.lon}&appid=${API_KEY}`;
          try {
            console.log('Fetching UV from /uvi (masked):', uviUrl.replace(`appid=${API_KEY}`, 'appid=***'));
          } catch (e) {}
          const uviRes = await fetch(uviUrl);
          console.log('UV API (uvi) response status:', uviRes.status);
          if (uviRes.ok) {
            const uviJson = await uviRes.json();
            // Resposta do /uvi geralmente possui campo value
            uvIndex = uviJson.value ?? uviJson.uvi ?? 0;
            uvFromApi = true;
            console.log('UV index from uvi API:', uvIndex);
          } else {
            console.warn('uvi endpoint não disponível:', await uviRes.text());
          }
        } catch (e) {
          console.warn('Erro ao buscar /uvi:', e);
        }
      }
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
