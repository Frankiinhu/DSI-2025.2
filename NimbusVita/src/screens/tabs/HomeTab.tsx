import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import WeatherCard from '../../components/WeatherCard';
import StatusCard from '../../components/StatusCard';
import RiskAnalysis from '../../components/RiskAnalysis';
import { Colors, Typography, Spacing, ComponentStyles } from '../../styles';
import { getCurrentWeather, loadWeatherCache, saveWeatherCache } from '../../services/weather.service';

const logo = require('../../../assets/logo.png');

interface WeatherData {
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  uvIndex: number;
  uvFromApi: boolean;
  airQuality: number | null;
  condition: string;
}

interface StatusData {
  location: string;
  riskLevel: string;
  riskPercentage: number;
  description: string;
  lastUpdate: string;
}

const HomeTab: React.FC = () => {
  const { user: currentUser, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 28,
    humidity: 79,
    pressure: 1007,
    windSpeed: 8,
    uvIndex: 9,
    uvFromApi: false,
    airQuality: 91,
    condition: 'Nublado'
  });
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);
  const [weatherSource, setWeatherSource] = useState<'api' | 'simulado'>('simulado');
  const [statusData, setStatusData] = useState<StatusData>({
    location: 'Recife-PE, Brasil',
    riskLevel: 'Moderado',
    riskPercentage: 60,
    description: 'Conectando ao serviço meteorológico...',
    lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });

  // Gera uma descrição do status atual baseado nas condições meteorológicas
  const generateStatusDescription = (data: WeatherData) => {
    const factors: string[] = [];

    if (data.temperature > 28) factors.push('calor intenso');
    else if (data.temperature < 18) factors.push('frio intenso');

    if (data.humidity > 70) factors.push('umidade alta');
    else if (data.humidity < 40) factors.push('umidade baixa');

    if (data.pressure < 1000) factors.push('pressão muito baixa');
    else if (data.pressure < 1010) factors.push('pressão baixa');

    if (data.uvFromApi && data.uvIndex > 8) factors.push('UV muito alto');
    else if (data.uvFromApi && data.uvIndex > 6) factors.push('UV alto');

    if (data.airQuality > 150) factors.push('ar muito poluído');
    else if (data.airQuality > 100) factors.push('ar poluído');

    if (data.windSpeed > 30) factors.push('vento muito forte');
    else if (data.windSpeed > 20) factors.push('vento forte');

    if (factors.length === 0) {
      return 'Condições meteorológicas favoráveis';
    }

    // Capitaliza primeira letra
    const firstFactor = factors[0].charAt(0).toUpperCase() + factors[0].slice(1);
    if (factors.length === 1) {
      return firstFactor;
    } else if (factors.length === 2) {
      return `${firstFactor} e ${factors[1]}`;
    } else {
      const last = factors.pop();
      return `${firstFactor}, ${factors.join(', ')} e ${last}`;
    }
  };

  // Atualiza o status com base nos dados meteorológicos
  const updateStatus = (data: WeatherData) => {
    let riskScore = 0;

    // Temperatura
    if (data.temperature > 28) riskScore += 25;
    else if (data.temperature < 18) riskScore += 20;

    // Umidade
    if (data.humidity > 70) riskScore += 15;

    // Qualidade do ar
    if (data.airQuality > 150) riskScore += 40;
    else if (data.airQuality > 100) riskScore += 30;

    // UV
    if (data.uvFromApi && data.uvIndex > 7) riskScore += 20;

    // Pressão
    if (data.pressure < 1000) riskScore += 20;
    else if (data.pressure < 1010) riskScore += 15;

    // Vento
    if (data.windSpeed > 30) riskScore += 15;
    else if (data.windSpeed > 20) riskScore += 10;

    const riskPercentage = Math.min(riskScore, 90);
    const riskLevel = riskPercentage < 30 ? 'Baixo' : 
                     riskPercentage < 60 ? 'Moderado' : 'Alto';

    setStatusData({
      location: 'Recife-PE, Brasil',
      riskLevel,
      riskPercentage,
      description: generateStatusDescription(data),
      lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const generateRandomWeatherData = () => {
    const conditions = ['Nublado', 'Ensolarado', 'Parcialmente Nublado', 'Chuvoso', 'Tempestade'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    const newWeatherData = {
      temperature: Math.floor(Math.random() * 20) + 15, // 15-35°C
      humidity: Math.floor(Math.random() * 50) + 50, // 50-100%
      pressure: Math.floor(Math.random() * 80) + 980, // 980-1060 hPa
      windSpeed: Math.floor(Math.random() * 35) + 5, // 5-40 km/h
      uvIndex: Math.floor(Math.random() * 12) + 1, // 1-12
      uvFromApi: false, // dados simulados
      airQuality: Math.floor(Math.random() * 150) + 30, // 30-180 AQI
      condition: randomCondition
    };

    setWeatherData(newWeatherData);
    updateStatus(newWeatherData);
  };

  useEffect(() => {
    const load = async () => {
      setLoadingWeather(true);
      try {
        const cached = await loadWeatherCache();
        if (cached) {
          const cachedWeatherData = {
            temperature: Math.round(cached.temperature),
            humidity: cached.humidity,
            pressure: cached.pressure,
            windSpeed: cached.windSpeed,
            uvIndex: cached.uvIndex,
            uvFromApi: cached.uvFromApi,
            airQuality: cached.airQuality,
            condition: cached.condition || '—'
          };
          setWeatherData(cachedWeatherData);
          setWeatherSource('api');
          updateStatus(cachedWeatherData);
        }

        const real = await getCurrentWeather('Recife', 'BR');
        const newWeatherData = {
          temperature: Math.round(real.temperature),
          humidity: real.humidity,
          pressure: real.pressure,
          windSpeed: real.windSpeed,
          uvIndex: real.uvIndex,
          uvFromApi: real.uvFromApi,
          airQuality: real.airQuality,
          condition: real.condition || '—'
        };
        setWeatherData(newWeatherData);
        setWeatherSource('api');
        updateStatus(newWeatherData);
        await saveWeatherCache(real);
      } catch (e) {
        console.warn('getCurrentWeather: falhou, usando dados simulados', e);
        generateRandomWeatherData();
        setWeatherSource('simulado');
      } finally {
        setLoadingWeather(false);
      }
    };
    load();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const reloadWeather = async () => {
    setLoadingWeather(true);
    try {
      const real = await getCurrentWeather('Recife', 'BR');
      const newWeatherData = {
        temperature: Math.round(real.temperature),
        humidity: real.humidity,
        pressure: real.pressure,
        windSpeed: real.windSpeed,
        uvIndex: real.uvIndex,
        uvFromApi: real.uvFromApi,
        airQuality: real.airQuality,
        condition: real.condition || '—'
      };
      setWeatherData(newWeatherData);
      setWeatherSource('api');
      updateStatus(newWeatherData);
      await saveWeatherCache(real);
    } catch (e) {
      console.warn('reloadWeather: falhou', e);
      generateRandomWeatherData();
      setWeatherSource('simulado');
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirmação',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getUserFirstName = () => {
    const full = currentUser?.full_name;
    if (full) return full.split(' ')[0];
    if (currentUser?.username) return currentUser.username;
    return 'Usuário';
  };

  const getRiskFactors = () => {
    const factors = [];

    // Fator Cardiovascular
    let cardiovascularImpact = 'Baixo';
    let cardiovascularReason = 'Condições normais';
    
    if (weatherData.temperature > 28) {
      cardiovascularImpact = 'Alto';
      cardiovascularReason = 'Calor excessivo';
    } else if (weatherData.temperature < 18) {
      cardiovascularImpact = 'Alto';
      cardiovascularReason = 'Frio intenso';
    } else if (weatherData.pressure < 1010) {
      cardiovascularImpact = 'Moderado';
      cardiovascularReason = 'Pressão baixa';
    }

    factors.push({
      name: 'Cardiovascular',
      description: cardiovascularReason,
      level: cardiovascularImpact,
      icon: 'favorite'
    });

    // Fator Respiratório
    let respiratoryImpact = 'Baixo';
    let respiratoryReason = 'Ar limpo';
    
    if (weatherData.airQuality > 150) {
      respiratoryImpact = 'Alto';
      respiratoryReason = 'Ar muito poluído';
    } else if (weatherData.airQuality > 100) {
      respiratoryImpact = 'Alto';
      respiratoryReason = 'Ar poluído';
    } else if (weatherData.humidity > 70) {
      respiratoryImpact = 'Moderado';
      respiratoryReason = 'Umidade alta';
    }

    factors.push({
      name: 'Respiratório',
      description: respiratoryReason,
      level: respiratoryImpact,
      icon: 'air'
    });

    // Fator Neurológico
    let neurologicalImpact = 'Baixo';
    let neurologicalReason = 'Sem alterações';
    
    if (weatherData.pressure < 1000) {
      neurologicalImpact = 'Alto';
      neurologicalReason = 'Pressão muito baixa';
    } else if (weatherData.pressure < 1010) {
      neurologicalImpact = 'Moderado';
      neurologicalReason = 'Pressão baixa';
    } else if (weatherData.uvIndex > 8) {
      neurologicalImpact = 'Moderado';
      neurologicalReason = 'UV elevado';
    }

    factors.push({
      name: 'Neurológico',
      description: neurologicalReason,
      level: neurologicalImpact,
      icon: 'psychology'
    });

    return factors;
  };

  const getRecommendations = () => {
    const recommendations = [];

    // Recomendações baseadas na temperatura
    if (weatherData.temperature > 28) {
      recommendations.push({
        title: 'Calor Intenso',
        description: 'Hidrate-se frequentemente e evite exposição prolongada ao sol',
        priority: 'Alto',
        icon: 'wb-sunny'
      });
    } else if (weatherData.temperature < 18) {
      recommendations.push({
        title: 'Frio Intenso',
        description: 'Vista roupas adequadas e proteja extremidades do corpo',
        priority: 'Importante',
        icon: 'ac-unit'
      });
    }

    // Recomendações baseadas na umidade
    if (weatherData.humidity > 70) {
      recommendations.push({
        title: 'Umidade Alta',
        description: 'Monitore sintomas respiratórios e use desumidificador se possível',
        priority: 'Importante',
        icon: 'water-drop'
      });
    }

    // Recomendações baseadas na qualidade do ar
    if (weatherData.airQuality > 150) {
      recommendations.push({
        title: 'Ar Muito Poluído',
        description: 'Evite atividades ao ar livre e use máscara N95',
        priority: 'Alto',
        icon: 'masks'
      });
    } else if (weatherData.airQuality > 100) {
      recommendations.push({
        title: 'Ar Poluído',
        description: 'Evite exercícios intensos ao ar livre e use máscara se necessário',
        priority: 'Alto',
        icon: 'visibility-off'
      });
    }

    // Recomendações baseadas no UV
    if (weatherData.uvIndex > 8) {
      recommendations.push({
        title: 'UV Muito Alto',
        description: 'Use protetor solar FPS 50+, chapéu e óculos de sol. Evite sol das 10h-16h',
        priority: 'Alto',
        icon: 'wb-sunny'
      });
    } else if (weatherData.uvIndex > 6) {
      recommendations.push({
        title: 'UV Elevado',
        description: 'Use protetor solar FPS 30+ e óculos de sol',
        priority: 'Importante',
        icon: 'wb-sunny'
      });
    }

    // Recomendações baseadas na pressão
    if (weatherData.pressure < 1000) {
      recommendations.push({
        title: 'Pressão Muito Baixa',
        description: 'Pessoas sensíveis podem ter enxaquecas fortes - procure ajuda médica se necessário',
        priority: 'Alto',
        icon: 'local-hospital'
      });
    } else if (weatherData.pressure < 1010) {
      recommendations.push({
        title: 'Pressão Baixa',
        description: 'Pessoas sensíveis podem sentir dores de cabeça - monitore sintomas',
        priority: 'Sugestão',
        icon: 'speed'
      });
    }

    // Recomendações baseadas no vento
    if (weatherData.windSpeed > 30) {
      recommendations.push({
        title: 'Vento Muito Forte',
        description: 'Cuidado com objetos soltos. Evite áreas com árvores',
        priority: 'Alto',
        icon: 'warning'
      });
    } else if (weatherData.windSpeed > 20) {
      recommendations.push({
        title: 'Vento Forte',
        description: 'Cuidado ao andar na rua e com objetos leves',
        priority: 'Importante',
        icon: 'air'
      });
    }

    // Se não há riscos específicos
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Condições Favoráveis',
        description: 'Aproveite o dia! Condições climáticas estão ideais',
        priority: 'Positivo',
        icon: 'check-circle'
      });
    }

    return recommendations;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style='light' backgroundColor={Colors.primary} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Image
                source={logo}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <View style={styles.headerTextContainer}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>{getUserFirstName()}</Text>
                <Text style={styles.subtitle}>Como você está se sentindo hoje?</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.container}>
          {/* Status Card */}
          <View style={{ marginBottom: 16 }}>
            <StatusCard
              location={statusData.location}
              riskLevel={statusData.riskLevel}
              riskPercentage={statusData.riskPercentage}
              description={statusData.description}
              lastUpdate={statusData.lastUpdate}
              weatherCondition={weatherData.condition}
              onReload={reloadWeather}
              isLoading={loadingWeather}
            />
          </View>

          {/* Weather Cards Grid */}
          {loadingWeather ? (
            <View style={{ alignItems: 'center', padding: Spacing.md }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.weatherGrid}>
              <WeatherCard
                title="Temperatura"
                value={weatherData.temperature === null ? '—' : weatherData.temperature.toString()}
                unit="°C"
                status={weatherData.temperature === null ? 'Indisponível' :
                       weatherData.temperature > 34 ? 'Muito Quente' : 
                       weatherData.temperature > 28 ? 'Quente' : 
                       weatherData.temperature < 18 ? 'Frio' : 
                       weatherData.temperature < 24 ? 'Fresco' : 'Agradável'}
                icon="thermostat"
                iconColor={weatherData.temperature === null ? Colors.textSecondary :
                          weatherData.temperature > 34 ? Colors.weather.hot : 
                          weatherData.temperature > 28 ? Colors.weather.warm : 
                          weatherData.temperature < 18 ? Colors.weather.cool : Colors.primaryLight}
                statusColor={weatherData.temperature === null ? Colors.textSecondary :
                           weatherData.temperature > 28 ? Colors.danger : 
                           weatherData.temperature > 25 ? Colors.warning : 
                           weatherData.temperature < 18 ? Colors.primary : Colors.primaryLight}
              />
              <WeatherCard
                title="Umidade"
                value={weatherData.humidity === null ? '—' : weatherData.humidity.toString()}
                unit="%"
                status={weatherData.humidity === null ? 'Indisponível' :
                       weatherData.humidity > 70 ? 'Muito Alta' : 
                       weatherData.humidity > 60 ? 'Alta' : 
                       weatherData.humidity < 40 ? 'Baixa' : 'Normal'}
                icon="water-drop"
                iconColor={weatherData.humidity === null ? Colors.textSecondary :
                          weatherData.humidity > 70 ? Colors.danger : 
                          weatherData.humidity > 60 ? Colors.warning : Colors.primary}
                statusColor={weatherData.humidity === null ? Colors.textSecondary :
                           weatherData.humidity > 70 ? Colors.danger : 
                           weatherData.humidity > 60 ? Colors.warning : Colors.primary}
              />
              <WeatherCard
                title="Pressão"
                value={weatherData.pressure === null ? '—' : weatherData.pressure.toString()}
                unit="hPa"
                status={weatherData.pressure === null ? 'Indisponível' :
                       weatherData.pressure < 1000 ? 'Muito Baixa' : 
                       weatherData.pressure < 1013 ? 'Baixa' : 
                       weatherData.pressure > 1020 ? 'Alta' : 'Normal'}
                icon="speed"
                iconColor={weatherData.pressure === null ? Colors.textSecondary :
                          weatherData.pressure < 1000 ? Colors.danger : 
                          weatherData.pressure < 1013 ? Colors.warning : Colors.primaryLight}
                statusColor={weatherData.pressure === null ? Colors.textSecondary :
                           weatherData.pressure < 1000 ? Colors.danger : 
                           weatherData.pressure < 1013 ? Colors.warning : Colors.primaryLight}
              />
              <WeatherCard
                title="Vento"
                value={weatherData.windSpeed === null ? '—' : weatherData.windSpeed.toString()}
                unit="km/h"
                status={weatherData.windSpeed === null ? 'Indisponível' :
                       weatherData.windSpeed > 30 ? 'Muito Forte' : 
                       weatherData.windSpeed > 20 ? 'Forte' : 
                       weatherData.windSpeed > 10 ? 'Moderado' : 'Fraco'}
                icon="air"
                iconColor={weatherData.windSpeed === null ? Colors.textSecondary :
                          weatherData.windSpeed > 30 ? Colors.danger : 
                          weatherData.windSpeed > 20 ? Colors.warning : Colors.textSecondary}
                statusColor={weatherData.windSpeed === null ? Colors.textSecondary :
                           weatherData.windSpeed > 30 ? Colors.danger : 
                           weatherData.windSpeed > 20 ? Colors.warning : Colors.textSecondary}
              />
              <WeatherCard
                title="UV"
                value={weatherData.uvIndex.toString()}
                unit=""
                status={!weatherData.uvFromApi ? 'Indisponível' :
                       weatherData.uvIndex > 8 ? 'Muito Alto' : 
                       weatherData.uvIndex > 6 ? 'Alto' : 
                       weatherData.uvIndex > 3 ? 'Moderado' : 'Baixo'}
                icon="wb-sunny"
                iconColor={!weatherData.uvFromApi ? Colors.textSecondary :
                          weatherData.uvIndex > 8 ? Colors.danger : 
                          weatherData.uvIndex > 6 ? Colors.warning : Colors.secondaryLight}
                statusColor={!weatherData.uvFromApi ? Colors.textSecondary :
                            weatherData.uvIndex > 8 ? Colors.danger : 
                            weatherData.uvIndex > 6 ? Colors.warning : Colors.secondaryLight}
              />
              <WeatherCard
                title="Qualidade do Ar"
                value={weatherData.airQuality === null ? '—' : weatherData.airQuality.toString()}
                unit="AQI"
                status={weatherData.airQuality === null ? 'Indisponível' :
                       weatherData.airQuality > 150 ? 'Perigosa' : 
                       weatherData.airQuality > 100 ? 'Insalubre' : 
                       weatherData.airQuality > 50 ? 'Moderada' : 'Boa'}
                icon="visibility"
                iconColor={weatherData.airQuality === null ? Colors.textSecondary :
                          weatherData.airQuality > 150 ? Colors.danger : 
                          weatherData.airQuality > 100 ? Colors.warning : Colors.primaryLight}
                statusColor={weatherData.airQuality === null ? Colors.textSecondary :
                           weatherData.airQuality > 150 ? Colors.danger : 
                           weatherData.airQuality > 100 ? Colors.warning : Colors.primaryLight}
              />
            </View>
          )}

          {/* Risk Analysis */}
          <RiskAnalysis
            riskPercentage={statusData.riskPercentage}
            factors={getRiskFactors()}
            recommendations={getRecommendations()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl2,
  },
  header: {
    ...ComponentStyles.header,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: Spacing.base,
  },
  greeting: {
    ...Typography.body,
    color: Colors.secondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    ...Typography.h4,
    color: Colors.textWhite,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textWhite,
    opacity: 0.8,
  },
  headerLogo: { 
    width: 64, 
    height: 64,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textDark,
    marginBottom: Spacing.base,
    marginTop: Spacing.sm,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl2,
  },
});

export default HomeTab;