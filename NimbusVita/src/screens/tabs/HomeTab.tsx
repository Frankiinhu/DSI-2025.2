import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import WeatherCard from '../../components/WeatherCard';
import StatusCard from '../../components/StatusCard';
import RiskAnalysis from '../../components/RiskAnalysis';
import MonitoredLocationsManager from '../../components/MonitoredLocationsManager';
import MonitoredLocationForm from '../../components/MonitoredLocationForm';
import { Colors, Typography, Spacing, ComponentStyles, BorderRadius, Shadows } from '../../styles';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getCurrentWeather, getWeatherByCoordinates, loadWeatherCache, saveWeatherCache } from '../../services/weather.service';
import { useNotifications } from '../../config/notifications';
import { generateRandomWeatherData, transformWeatherData, type WeatherData } from '../../utils/weatherHelpers';
import { getMonitoredLocations, createMonitoredLocation } from '../../services/supabase/monitored-locations.service';
import type { MonitoredLocation, CreateMonitoredLocationDTO } from '../../types/monitored-location.types';

const logo = require('../../../assets/logo.png');

interface StatusData {
  location: string;
  riskLevel: string;
  riskPercentage: number;
  description: string;
  lastUpdate: string;
}

const HomeTab: React.FC = () => {
  const { user: currentUser, signOut } = useAuth();
  const { notify } = useNotifications();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [monitoredLocations, setMonitoredLocations] = useState<MonitoredLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null);
  const [locationWeatherData, setLocationWeatherData] = useState<Record<string, WeatherData>>({});
  const [selectedLocation, setSelectedLocation] = useState<MonitoredLocation | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
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

  // Carrega localizações monitoradas
  const loadMonitoredLocations = async () => {
    if (!currentUser) {
      console.log('❌ Sem usuário logado');
      return;
    }
    console.log('🔄 Carregando localizações monitoradas...');
    setLoadingLocations(true);
    const result = await getMonitoredLocations(currentUser.id);
    console.log('📍 Resultado:', result);
    if (result.ok && Array.isArray(result.data)) {
      console.log(`✅ ${result.data.length} localizações carregadas:`, result.data);
      setMonitoredLocations(result.data);
    } else {
      console.log('⚠️ Falha ao carregar ou dados inválidos');
    }
    setLoadingLocations(false);
  };

  // Carrega dados meteorológicos de uma localização específica
  const loadLocationWeather = async (location: MonitoredLocation) => {
    try {
      console.log(`🌤️ Carregando clima para ${location.city_name}...`);
      const weatherResult = await getWeatherByCoordinates(
        Number(location.latitude),
        Number(location.longitude)
      );
      
      const transformedData = transformWeatherData(weatherResult);
      setLocationWeatherData(prev => ({
        ...prev,
        [location.id]: transformedData
      }));
      console.log(`✅ Clima carregado para ${location.city_name}`);
    } catch (error) {
      console.error(`❌ Erro ao carregar clima de ${location.city_name}:`, error);
      // Usar dados simulados em caso de erro
      const simulatedData = generateRandomWeatherData();
      setLocationWeatherData(prev => ({
        ...prev,
        [location.id]: simulatedData
      }));
    }
  };

  // Toggle expansão do card e carrega dados se necessário
  const toggleLocationExpand = async (location: MonitoredLocation) => {
    if (expandedLocationId === location.id) {
      setExpandedLocationId(null);
    } else {
      setExpandedLocationId(location.id);
      // Se ainda não temos dados meteorológicos para essa localização, carregar
      if (!locationWeatherData[location.id]) {
        await loadLocationWeather(location);
      }
    }
  };

  // Abre menu de ações para uma localização
  const handleLocationAction = (location: MonitoredLocation) => {
    setSelectedLocation(location);
    setShowActionMenu(true);
  };

  // Edita uma localização
  const handleEditLocation = () => {
    setShowActionMenu(false);
    // Pequeno delay para suavizar a transição entre modals
    setTimeout(() => {
      setShowLocationsModal(true);
    }, 300);
  };

  // Deleta uma localização
  const handleDeleteLocation = async () => {
    if (!selectedLocation) return;
    
    setShowActionMenu(false);
    
    // Importar dinamicamente para evitar erro de dependência circular
    const { deleteMonitoredLocation } = await import('../../services/supabase/monitored-locations.service');
    
    if (!currentUser) return;
    
    const result = await deleteMonitoredLocation(selectedLocation.id, currentUser.id);
    
    if (result.ok) {
      notify('success', {
        params: {
          title: 'Sucesso',
          description: 'Localização removida com sucesso'
        }
      });
      loadMonitoredLocations();
    } else {
      notify('error', {
        params: {
          title: 'Erro',
          description: result.message || 'Erro ao remover localização'
        }
      });
    }
    
    setSelectedLocation(null);
  };

  // Handler para adicionar nova localização via formulário inline
  const handleInlineFormSubmit = async (data: CreateMonitoredLocationDTO) => {
    if (!currentUser) {
      notify('error', {
        params: {
          title: 'Erro',
          description: 'Usuário não autenticado'
        }
      });
      return;
    }

    const result = await createMonitoredLocation(currentUser.id, data);
    
    if (result.ok) {
      notify('success', {
        params: {
          title: 'Sucesso',
          description: result.message || 'Localização adicionada com sucesso'
        }
      });
      setShowInlineForm(false);
      await loadMonitoredLocations();
    } else {
      notify('error', {
        params: {
          title: 'Erro',
          description: result.message || 'Erro ao adicionar localização'
        }
      });
    }
  };

  // Calcula nível de risco baseado nos dados meteorológicos
  const calculateRiskLevel = (weather: WeatherData): { level: string; percentage: number; description: string } => {
    let riskScore = 0;
    const factors: string[] = [];

    const temp = weather.temperature ?? 25;
    const humidity = weather.humidity ?? 60;
    const airQuality = weather.airQuality ?? 50;
    const uvIndex = weather.uvIndex ?? 5;

    if (temp > 32) { riskScore += 25; factors.push('calor extremo'); }
    else if (temp > 28) { riskScore += 15; factors.push('calor intenso'); }
    else if (temp < 15) { riskScore += 20; factors.push('frio intenso'); }

    if (humidity > 80) { riskScore += 20; factors.push('umidade muito alta'); }
    else if (humidity < 30) { riskScore += 15; factors.push('ar muito seco'); }

    if (airQuality > 150) { riskScore += 30; factors.push('ar muito poluído'); }
    else if (airQuality > 100) { riskScore += 20; factors.push('ar poluído'); }

    if (uvIndex > 8) { riskScore += 15; factors.push('UV extremo'); }
    else if (uvIndex > 6) { riskScore += 10; factors.push('UV alto'); }

    const percentage = Math.min(riskScore, 100);
    let level = 'Baixo';
    if (percentage >= 70) level = 'Alto';
    else if (percentage >= 40) level = 'Moderado';

    const description = factors.length > 0 
      ? `Atenção: ${factors.join(', ')}` 
      : 'Condições meteorológicas favoráveis';

    return { level, percentage, description };
  };

  // Gera uma descrição do status atual baseado nas condições meteorológicas
  const generateStatusDescription = (data: WeatherData) => {
    const factors: string[] = [];

    const temp = data.temperature ?? 25;
    const humidity = data.humidity ?? 60;
    const pressure = data.pressure ?? 1013;
    const airQuality = data.airQuality ?? 50;
    const windSpeed = data.windSpeed ?? 10;

    if (temp > 28) factors.push('calor intenso');
    else if (temp < 18) factors.push('frio intenso');

    if (humidity > 70) factors.push('umidade alta');
    else if (humidity < 40) factors.push('umidade baixa');

    if (pressure < 1000) factors.push('pressão muito baixa');
    else if (pressure < 1010) factors.push('pressão baixa');

    if (data.uvFromApi && data.uvIndex !== null && data.uvIndex > 8) factors.push('UV muito alto');
    else if (data.uvFromApi && data.uvIndex !== null && data.uvIndex > 6) factors.push('UV alto');

    if (airQuality > 150) factors.push('ar muito poluído');
    else if (airQuality > 100) factors.push('ar poluído');

    if (windSpeed > 30) factors.push('vento muito forte');
    else if (windSpeed > 20) factors.push('vento forte');

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

    const temp = data.temperature ?? 25;
    const humidity = data.humidity ?? 60;
    const pressure = data.pressure ?? 1013;
    const airQuality = data.airQuality ?? 50;
    const windSpeed = data.windSpeed ?? 10;

    // Temperatura
    if (temp > 28) riskScore += 25;
    else if (temp < 18) riskScore += 20;

    // Umidade
    if (humidity > 70) riskScore += 15;

    // Qualidade do ar
    if (airQuality > 150) riskScore += 40;
    else if (airQuality > 100) riskScore += 30;

    // UV
    if (data.uvFromApi && data.uvIndex !== null && data.uvIndex > 7) riskScore += 20;

    // Pressão
    if (pressure < 1000) riskScore += 20;
    else if (pressure < 1010) riskScore += 15;

    // Vento
    if (windSpeed > 30) riskScore += 15;
    else if (windSpeed > 20) riskScore += 10;

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

  // Carrega localizações ao montar
  useEffect(() => {
    loadMonitoredLocations();
  }, [currentUser]);

  useEffect(() => {
    const load = async () => {
      setLoadingWeather(true);
      try {
        const cached = await loadWeatherCache();
        if (cached) {
          const cachedWeatherData = transformWeatherData(cached);
          setWeatherData(cachedWeatherData);
          setWeatherSource('api');
          updateStatus(cachedWeatherData);
        }

        const real = await getCurrentWeather('Recife', 'BR');
        const newWeatherData = transformWeatherData(real);
        setWeatherData(newWeatherData);
        setWeatherSource('api');
        updateStatus(newWeatherData);
        await saveWeatherCache(real);
      } catch (e) {
        console.warn('getCurrentWeather: falhou, usando dados simulados', e);
        const simulatedData = generateRandomWeatherData();
        setWeatherData(simulatedData);
        updateStatus(simulatedData);
        setWeatherSource('simulado');
      } finally {
        setLoadingWeather(false);
      }
    };
    load();
    // Atualizar relógio a cada minuto (não precisa de precisão de segundos)
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 segundos
    
    return () => {
      clearInterval(timer);
    };
  }, []);

  const reloadWeather = async () => {
    setLoadingWeather(true);
    try {
      const real = await getCurrentWeather('Recife', 'BR');
      const newWeatherData = transformWeatherData(real);
      setWeatherData(newWeatherData);
      setWeatherSource('api');
      updateStatus(newWeatherData);
      await saveWeatherCache(real);
      
      // Toast de sucesso
      notify('success', {
        params: {
          title: 'Clima Atualizado',
          description: 'Dados meteorológicos atualizados com sucesso'
        }
      });
    } catch (e) {
      console.warn('reloadWeather: falhou', e);
      const simulatedData = generateRandomWeatherData();
      setWeatherData(simulatedData);
      updateStatus(simulatedData);
      setWeatherSource('simulado');
      
      // Toast de erro
      notify('error', {
        params: {
          title: 'Erro ao Atualizar',
          description: 'Não foi possível obter dados reais. Usando dados simulados.'
        }
      });
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
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

    const temp = weatherData.temperature ?? 25;
    const pressure = weatherData.pressure ?? 1013;
    const airQuality = weatherData.airQuality ?? 50;
    const humidity = weatherData.humidity ?? 60;

    // Fator Cardiovascular
    let cardiovascularImpact = 'Baixo';
    let cardiovascularReason = 'Condições normais';
    
    if (temp > 28) {
      cardiovascularImpact = 'Alto';
      cardiovascularReason = 'Calor excessivo';
    } else if (temp < 18) {
      cardiovascularImpact = 'Alto';
      cardiovascularReason = 'Frio intenso';
    } else if (pressure < 1010) {
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
    
    if (airQuality > 150) {
      respiratoryImpact = 'Alto';
      respiratoryReason = 'Ar muito poluído';
    } else if (airQuality > 100) {
      respiratoryImpact = 'Alto';
      respiratoryReason = 'Ar poluído';
    } else if (humidity > 70) {
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
    
    if (pressure < 1000) {
      neurologicalImpact = 'Alto';
      neurologicalReason = 'Pressão muito baixa';
    } else if (pressure < 1010) {
      neurologicalImpact = 'Moderado';
      neurologicalReason = 'Pressão baixa';
    } else if (weatherData.uvIndex !== null && weatherData.uvIndex > 8) {
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

    const temp = weatherData.temperature ?? 25;
    const humidity = weatherData.humidity ?? 60;
    const airQuality = weatherData.airQuality ?? 50;
    const pressure = weatherData.pressure ?? 1013;
    const windSpeed = weatherData.windSpeed ?? 10;

    // Recomendações baseadas na temperatura
    if (temp > 28) {
      recommendations.push({
        title: 'Calor Intenso',
        description: 'Hidrate-se frequentemente e evite exposição prolongada ao sol',
        priority: 'Alto',
        icon: 'wb-sunny'
      });
    } else if (temp < 18) {
      recommendations.push({
        title: 'Frio Intenso',
        description: 'Vista roupas adequadas e proteja extremidades do corpo',
        priority: 'Importante',
        icon: 'ac-unit'
      });
    }

    // Recomendações baseadas na umidade
    if (humidity > 70) {
      recommendations.push({
        title: 'Umidade Alta',
        description: 'Monitore sintomas respiratórios e use desumidificador se possível',
        priority: 'Importante',
        icon: 'water-drop'
      });
    }

    // Recomendações baseadas na qualidade do ar
    if (airQuality > 150) {
      recommendations.push({
        title: 'Ar Muito Poluído',
        description: 'Evite atividades ao ar livre e use máscara N95',
        priority: 'Alto',
        icon: 'masks'
      });
    } else if (airQuality > 100) {
      recommendations.push({
        title: 'Ar Poluído',
        description: 'Evite exercícios intensos ao ar livre e use máscara se necessário',
        priority: 'Alto',
        icon: 'visibility-off'
      });
    }

    // Recomendações baseadas no UV
    if (weatherData.uvIndex !== null && weatherData.uvIndex > 8) {
      recommendations.push({
        title: 'UV Muito Alto',
        description: 'Use protetor solar FPS 50+, chapéu e óculos de sol. Evite sol das 10h-16h',
        priority: 'Alto',
        icon: 'wb-sunny'
      });
    } else if (weatherData.uvIndex !== null && weatherData.uvIndex > 6) {
      recommendations.push({
        title: 'UV Elevado',
        description: 'Use protetor solar FPS 30+ e óculos de sol',
        priority: 'Importante',
        icon: 'wb-sunny'
      });
    }

    // Recomendações baseadas na pressão
    if (pressure < 1000) {
      recommendations.push({
        title: 'Pressão Muito Baixa',
        description: 'Pessoas sensíveis podem ter enxaquecas fortes - procure ajuda médica se necessário',
        priority: 'Alto',
        icon: 'local-hospital'
      });
    } else if (pressure < 1010) {
      recommendations.push({
        title: 'Pressão Baixa',
        description: 'Pessoas sensíveis podem sentir dores de cabeça - monitore sintomas',
        priority: 'Sugestão',
        icon: 'speed'
      });
    }

    // Recomendações baseadas no vento
    if (windSpeed > 30) {
      recommendations.push({
        title: 'Vento Muito Forte',
        description: 'Cuidado com objetos soltos. Evite áreas com árvores',
        priority: 'Alto',
        icon: 'warning'
      });
    } else if (windSpeed > 20) {
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
    <View style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                value={weatherData.uvIndex === null ? '—' : weatherData.uvIndex.toString()}
                unit=""
                status={!weatherData.uvFromApi || weatherData.uvIndex === null ? 'Indisponível' :
                       weatherData.uvIndex > 8 ? 'Muito Alto' : 
                       weatherData.uvIndex > 6 ? 'Alto' : 
                       weatherData.uvIndex > 3 ? 'Moderado' : 'Baixo'}
                icon="wb-sunny"
                iconColor={!weatherData.uvFromApi || weatherData.uvIndex === null ? Colors.textSecondary :
                          weatherData.uvIndex > 8 ? Colors.danger : 
                          weatherData.uvIndex > 6 ? Colors.warning : Colors.secondaryLight}
                statusColor={!weatherData.uvFromApi || weatherData.uvIndex === null ? Colors.textSecondary :
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

          {/* Monitored Locations Section */}
          <View style={styles.monitoredContainer}>
            <View style={styles.monitoredHeaderRow}>
              <View style={styles.monitoredHeader}>
                <Ionicons name="location" size={24} color={Colors.primary} />
                <Text style={styles.monitoredTitle}>Localizações Monitoradas</Text>
              </View>
              <TouchableOpacity
                style={styles.addIconButton}
                onPress={() => setShowInlineForm(!showInlineForm)}
              >
                <Ionicons name={showInlineForm ? "close-circle" : "add-circle"} size={28} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            {/* Inline Form - Renderizado independentemente */}
            {showInlineForm && (
              <View style={styles.inlineFormContainer}>
                <MonitoredLocationForm
                  inline={true}
                  onSubmit={handleInlineFormSubmit}
                  onCancel={() => setShowInlineForm(false)}
                />
              </View>
            )}
            
            {/* Lista de localizações ou estados vazios */}
            {loadingLocations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando...</Text>
              </View>
            ) : monitoredLocations.length === 0 && !showInlineForm ? (
              <View style={styles.emptyLocations}>
                <Ionicons name="location-outline" size={48} color={Colors.textLight} />
                <Text style={styles.emptyText}>Nenhuma cidade adicionada</Text>
                <Text style={styles.emptySubtext}>
                  Adicione cidades para monitorar informações de saúde em tempo real
                </Text>
              </View>
            ) : (
              <>
                {monitoredLocations.map((location) => {
                  const isExpanded = expandedLocationId === location.id;
                  const weather = locationWeatherData[location.id];
                  const riskData = weather ? calculateRiskLevel(weather) : null;

                  return (
                    <View key={location.id} style={styles.locationCard}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleLocationExpand(location)}
                      >
                        <View style={styles.locationCardHeader}>
                          <View style={styles.locationCardInfo}>
                            {location.is_primary && (
                              <View style={styles.primaryBadge}>
                                <Ionicons name="star" size={12} color={Colors.warning} />
                                <Text style={styles.primaryBadgeText}>Principal</Text>
                              </View>
                            )}
                            <Text style={styles.locationCardCity}>
                              {location.nickname || location.city_name}
                            </Text>
                            {location.nickname && (
                              <Text style={styles.locationCardSubname}>{location.city_name}</Text>
                            )}
                            <Text style={styles.locationCardDetails}>
                              {[location.state, location.country].filter(Boolean).join(', ')}
                            </Text>
                          </View>
                          <View style={styles.locationCardActions}>
                            <TouchableOpacity
                              style={styles.locationCardActionButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleLocationAction(location);
                              }}
                            >
                              <Ionicons name="ellipsis-vertical" size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>
                            <Ionicons 
                              name={isExpanded ? "chevron-up" : "chevron-down"} 
                              size={20} 
                              color={Colors.textSecondary} 
                            />
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* Conteúdo Expandido */}
                      {isExpanded && (
                        <View style={styles.locationExpandedContent}>
                          {!weather ? (
                            <View style={styles.locationLoadingContainer}>
                              <ActivityIndicator size="small" color={Colors.primary} />
                              <Text style={styles.locationLoadingText}>Carregando dados meteorológicos...</Text>
                            </View>
                          ) : (
                            <>
                              {/* Risk Badge */}
                              {riskData && (
                                <View style={[
                                  styles.riskBadge,
                                  { backgroundColor: 
                                    riskData.level === 'Alto' ? Colors.danger + '15' :
                                    riskData.level === 'Moderado' ? Colors.warning + '15' :
                                    Colors.success + '15'
                                  }
                                ]}>
                                  <Ionicons 
                                    name="warning-outline" 
                                    size={16} 
                                    color={
                                      riskData.level === 'Alto' ? Colors.danger :
                                      riskData.level === 'Moderado' ? Colors.warning :
                                      Colors.success
                                    }
                                  />
                                  <Text style={[
                                    styles.riskBadgeText,
                                    { color: 
                                      riskData.level === 'Alto' ? Colors.danger :
                                      riskData.level === 'Moderado' ? Colors.warning :
                                      Colors.success
                                    }
                                  ]}>
                                    Risco {riskData.level} ({riskData.percentage}%)
                                  </Text>
                                </View>
                              )}

                              {/* Weather Grid */}
                              <View style={styles.weatherMiniGrid}>
                                <View style={styles.weatherMiniCard}>
                                  <Ionicons name="thermometer-outline" size={20} color={Colors.primary} />
                                  <Text style={styles.weatherMiniValue}>
                                    {weather.temperature !== null ? `${Math.round(weather.temperature)}°C` : '—'}
                                  </Text>
                                  <Text style={styles.weatherMiniLabel}>Temperatura</Text>
                                </View>

                                <View style={styles.weatherMiniCard}>
                                  <Ionicons name="water-outline" size={20} color={Colors.primary} />
                                  <Text style={styles.weatherMiniValue}>
                                    {weather.humidity !== null ? `${weather.humidity}%` : '—'}
                                  </Text>
                                  <Text style={styles.weatherMiniLabel}>Umidade</Text>
                                </View>

                                <View style={styles.weatherMiniCard}>
                                  <Ionicons name="speedometer-outline" size={20} color={Colors.primary} />
                                  <Text style={styles.weatherMiniValue}>
                                    {weather.pressure !== null ? `${weather.pressure}` : '—'}
                                  </Text>
                                  <Text style={styles.weatherMiniLabel}>Pressão</Text>
                                </View>

                                <View style={styles.weatherMiniCard}>
                                  <Ionicons name="sunny-outline" size={20} color={Colors.primary} />
                                  <Text style={styles.weatherMiniValue}>
                                    {weather.uvIndex !== null ? weather.uvIndex : '—'}
                                  </Text>
                                  <Text style={styles.weatherMiniLabel}>UV Index</Text>
                                </View>

                                <View style={styles.weatherMiniCard}>
                                  <Ionicons name="cloud-outline" size={20} color={Colors.primary} />
                                  <Text style={styles.weatherMiniValue}>
                                    {weather.airQuality !== null ? weather.airQuality : '—'}
                                  </Text>
                                  <Text style={styles.weatherMiniLabel}>Qualidade Ar</Text>
                                </View>

                                <View style={styles.weatherMiniCard}>
                                  <MaterialCommunityIcons name="weather-windy" size={20} color={Colors.primary} />
                                  <Text style={styles.weatherMiniValue}>
                                    {weather.windSpeed !== null ? `${weather.windSpeed}` : '—'}
                                  </Text>
                                  <Text style={styles.weatherMiniLabel}>Vento km/h</Text>
                                </View>
                              </View>

                              {/* Description */}
                              {riskData && (
                                <Text style={styles.riskDescription}>{riskData.description}</Text>
                              )}
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title="Confirmação"
        message="Tem certeza que deseja sair da sua conta?"
        confirmText="Sair"
        cancelText="Cancelar"
        confirmColor={Colors.danger}
        onConfirm={signOut}
        onCancel={() => setShowLogoutDialog(false)}
      />

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity 
          style={styles.actionMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={styles.actionMenuContainer}>
            <View style={styles.actionMenuHeader}>
              <Text style={styles.actionMenuTitle}>
                {selectedLocation?.nickname || selectedLocation?.city_name}
              </Text>
              <Text style={styles.actionMenuSubtitle}>
                {selectedLocation?.state && selectedLocation?.country 
                  ? `${selectedLocation.state}, ${selectedLocation.country}`
                  : selectedLocation?.country}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={handleEditLocation}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={22} color={Colors.primary} />
              <Text style={styles.actionMenuItemText}>Editar Localização</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionMenuItem, styles.actionMenuItemDanger]}
              onPress={handleDeleteLocation}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={22} color={Colors.danger} />
              <Text style={[styles.actionMenuItemText, styles.actionMenuItemTextDanger]}>
                Remover Localização
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuCancelButton}
              onPress={() => setShowActionMenu(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionMenuCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Monitored Locations Manager Modal */}
      <MonitoredLocationsManager
        visible={showLocationsModal}
        onClose={() => setShowLocationsModal(false)}
        userId={currentUser?.id || ''}
        locations={monitoredLocations}
        onRefresh={loadMonitoredLocations}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  container: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.accent,
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
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  locationButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  monitoredSection: {
    marginBottom: Spacing.xl,
  },
  monitoredContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  monitoredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyLocations: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textWhite,
  },
  locationCard: {
    backgroundColor: '#f0f3ffe1',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#f0f3ffe1',
  },
  locationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationCardInfo: {
    flex: 1,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
    gap: 4,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
  },
  locationCardCity: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 2,
  },
  locationCardSubname: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  locationCardDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  locationCardAction: {
    padding: Spacing.sm,
  },
  monitoredHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  monitoredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addIconButton: {
    padding: Spacing.xs,
  },
  inlineFormContainer: {
    backgroundColor: '#f0f3ffe1',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#f0f3ffe1',
    minHeight: 500,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  locationCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationCardActionButton: {
    padding: Spacing.xs,
  },
  locationExpandedContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  locationLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  locationLoadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  riskBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weatherMiniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  weatherMiniCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.accent,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: 4,
  },
  weatherMiniValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  weatherMiniLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  riskDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  actionMenuContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.xl,
  },
  actionMenuHeader: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 4,
  },
  actionMenuSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    gap: Spacing.md,
  },
  actionMenuItemDanger: {
    backgroundColor: Colors.danger + '08',
  },
  actionMenuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  actionMenuItemTextDanger: {
    color: Colors.danger,
  },
  actionMenuCancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.border,
    alignItems: 'center',
  },
  actionMenuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
});

export default HomeTab;