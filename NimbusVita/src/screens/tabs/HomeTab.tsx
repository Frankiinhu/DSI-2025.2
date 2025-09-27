import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { signOut, getCurrentUser, PublicUser } from '../../services/auth';
import WeatherCard from '../../components/WeatherCard';
import StatusCard from '../../components/StatusCard';
import RiskAnalysis from '../../components/RiskAnalysis';

const logo = require('../../../assets/logo.png');

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  uvIndex: number;
  airQuality: number;
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
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 28,
    humidity: 79,
    pressure: 1007,
    windSpeed: 8,
    uvIndex: 9,
    airQuality: 91,
    condition: 'Nublado'
  });
  const [statusData, setStatusData] = useState<StatusData>({
    location: 'Recife-PE, Brasil',
    riskLevel: 'Moderado',
    riskPercentage: 60,
    description: 'Algumas condições podem afetar pessoas sensíveis. Monitore sintomas.',
    lastUpdate: '17:15'
  });

  useEffect(() => {
    loadUserData();
    generateRandomWeatherData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadUserData = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
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
      airQuality: Math.floor(Math.random() * 150) + 30, // 30-180 AQI
      condition: randomCondition
    };

    setWeatherData(newWeatherData);

    // Calcular risco baseado nas condições climáticas
    const calculateRisk = () => {
      let riskScore = 0;
      let riskFactors = [];

      // Temperatura
      if (newWeatherData.temperature > 28) {
        riskScore += 25;
        riskFactors.push('Calor intenso');
      } else if (newWeatherData.temperature < 18) {
        riskScore += 20;
        riskFactors.push('Frio intenso');
      }

      // Umidade
      if (newWeatherData.humidity > 70) {
        riskScore += 15;
        riskFactors.push('Umidade alta');
      }

      // Qualidade do ar
      if (newWeatherData.airQuality > 100) {
        riskScore += 30;
        riskFactors.push('Ar poluído');
      } else if (newWeatherData.airQuality > 150) {
        riskScore += 40;
        riskFactors.push('Ar muito poluído');
      }

      // UV
      if (newWeatherData.uvIndex > 7) {
        riskScore += 20;
        riskFactors.push('UV elevado');
      }

      // Pressão
      if (newWeatherData.pressure < 1010) {
        riskScore += 15;
        riskFactors.push('Pressão baixa');
      }

      // Vento
      if (newWeatherData.windSpeed > 25) {
        riskScore += 10;
        riskFactors.push('Vento forte');
      }

      const riskPercentage = Math.min(riskScore, 90);
      let riskLevel;
      let description;

      if (riskPercentage < 30) {
        riskLevel = 'Baixo';
        description = 'Condições favoráveis! Aproveite o dia.';
      } else if (riskPercentage < 60) {
        riskLevel = 'Moderado';
        description = `Atenção para: ${riskFactors.slice(0, 2).join(', ')}.`;
      } else {
        riskLevel = 'Alto';
        description = `Cuidado com: ${riskFactors.slice(0, 3).join(', ')}.`;
      }

      return { riskLevel, riskPercentage, description };
    };

    const risk = calculateRisk();

    setStatusData({
      location: 'Recife-PE, Brasil',
      riskLevel: risk.riskLevel,
      riskPercentage: risk.riskPercentage,
      description: risk.description,
      lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
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
    if (!currentUser?.username) return 'Usuário';
    return currentUser.username;
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
      <StatusBar barStyle="light-content" backgroundColor="#5559ff" />
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
            <TouchableOpacity onPress={generateRandomWeatherData} style={styles.debugBtn}>
              <MaterialIcons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.container}>
          {/* Status Card */}
          <StatusCard
            location={statusData.location}
            riskLevel={statusData.riskLevel}
            riskPercentage={statusData.riskPercentage}
            description={statusData.description}
            lastUpdate={statusData.lastUpdate}
            weatherCondition={weatherData.condition}
          />

          {/* Weather Cards Grid */}
          <Text style={styles.sectionTitle}>Condições Atuais</Text>
          <View style={styles.weatherGrid}>
            <WeatherCard
              title="Temperatura"
              value={weatherData.temperature.toString()}
              unit="°C"
              status={weatherData.temperature > 34 ? 'Muito Quente' : 
                     weatherData.temperature > 28 ? 'Quente' : 
                     weatherData.temperature < 18 ? 'Frio' : 
                     weatherData.temperature < 24 ? 'Fresco' : 'Agradável'}
              icon="thermostat"
              iconColor={weatherData.temperature > 34 ? "#d4572a" : 
                        weatherData.temperature > 28 ? "#e9c46a" : 
                        weatherData.temperature < 18 ? "#5559ff" : "#7b7fff"}
              statusColor={weatherData.temperature > 28 ? "#d4572a" : 
                          weatherData.temperature > 25 ? "#e9c46a" : 
                          weatherData.temperature < 18 ? "#5559ff" : "#7b7fff"}
            />
            <WeatherCard
              title="Umidade"
              value={weatherData.humidity.toString()}
              unit="%"
              status={weatherData.humidity > 70 ? 'Muito Alta' : 
                     weatherData.humidity > 60 ? 'Alta' : 
                     weatherData.humidity < 40 ? 'Baixa' : 'Normal'}
              icon="water-drop"
              iconColor={weatherData.humidity > 70 ? "#d4572a" : 
                        weatherData.humidity > 60 ? "#e9c46a" : "#5559ff"}
              statusColor={weatherData.humidity > 70 ? "#d4572a" : 
                          weatherData.humidity > 60 ? "#e9c46a" : "#5559ff"}
            />
            <WeatherCard
              title="Pressão"
              value={weatherData.pressure.toString()}
              unit="hPa"
              status={weatherData.pressure < 1000 ? 'Muito Baixa' : 
                     weatherData.pressure < 1013 ? 'Baixa' : 
                     weatherData.pressure > 1020 ? 'Alta' : 'Normal'}
              icon="speed"
              iconColor={weatherData.pressure < 1000 ? "#d4572a" : 
                        weatherData.pressure < 1013 ? "#e9c46a" : "#7b7fff"}
              statusColor={weatherData.pressure < 1000 ? "#d4572a" : 
                          weatherData.pressure < 1013 ? "#e9c46a" : "#7b7fff"}
            />
            <WeatherCard
              title="Vento"
              value={weatherData.windSpeed.toString()}
              unit="km/h"
              status={weatherData.windSpeed > 30 ? 'Muito Forte' : 
                     weatherData.windSpeed > 20 ? 'Forte' : 
                     weatherData.windSpeed > 10 ? 'Moderado' : 'Fraco'}
              icon="air"
              iconColor={weatherData.windSpeed > 30 ? "#d4572a" : 
                        weatherData.windSpeed > 20 ? "#e9c46a" : "#9999b3"}
              statusColor={weatherData.windSpeed > 30 ? "#d4572a" : 
                          weatherData.windSpeed > 20 ? "#e9c46a" : "#9999b3"}
            />
            <WeatherCard
              title="UV"
              value={weatherData.uvIndex.toString()}
              unit=""
              status={weatherData.uvIndex > 8 ? 'Muito Alto' : 
                     weatherData.uvIndex > 6 ? 'Alto' : 
                     weatherData.uvIndex > 3 ? 'Moderado' : 'Baixo'}
              icon="wb-sunny"
              iconColor={weatherData.uvIndex > 8 ? "#d4572a" : 
                        weatherData.uvIndex > 6 ? "#e9c46a" : "#f5d76e"}
              statusColor={weatherData.uvIndex > 8 ? "#d4572a" : 
                          weatherData.uvIndex > 6 ? "#e9c46a" : "#f5d76e"}
            />
            <WeatherCard
              title="Qualidade do Ar"
              value={weatherData.airQuality.toString()}
              unit="AQI"
              status={weatherData.airQuality > 150 ? 'Perigosa' : 
                     weatherData.airQuality > 100 ? 'Insalubre' : 
                     weatherData.airQuality > 50 ? 'Moderada' : 'Boa'}
              icon="visibility"
              iconColor={weatherData.airQuality > 150 ? "#d4572a" : 
                        weatherData.airQuality > 100 ? "#e9c46a" : "#7b7fff"}
              statusColor={weatherData.airQuality > 150 ? "#d4572a" : 
                          weatherData.airQuality > 100 ? "#e9c46a" : "#7b7fff"}
            />
          </View>

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
    backgroundColor: '#a4a8ff',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 30,
  },
  header: {
    backgroundColor: '#5559ff',
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  greeting: {
    fontSize: 16,
    color: '#e9c46a',
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  debugBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerLogo: { 
    width: 64, 
    height: 64,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    marginTop: 8,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
});

export default HomeTab;