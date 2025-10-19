import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../styles';

interface StatusCardProps {
  location: string;
  riskLevel: string;
  riskPercentage: number;
  description: string;
  lastUpdate: string;
  weatherCondition: string;
}

const StatusCard: React.FC<StatusCardProps> = ({
  location,
  riskLevel,
  riskPercentage,
  description,
  lastUpdate,
  weatherCondition,
}) => {
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'baixo': return '#7b7fff';
      case 'moderado': return '#e9c46a';
      case 'alto': return '#d4572a';
      default: return '#9999b3';
    }
  };

  const getRiskBackgroundColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'baixo': return '#f5f6ff';
      case 'moderado': return '#fefbf6';
      case 'alto': return '#fdf2f0';
      default: return '#f7f8fa';
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'nublado': return 'cloud';
      case 'ensolarado': return 'wb-sunny';
      case 'chuvoso': return 'grain';
      case 'tempestade': return 'flash-on';
      default: return 'cloud';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={16} color={Colors.primary} />
          <Text style={styles.location}>{location}</Text>
        </View>
      </View>

      <View style={styles.statusHeader}>
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Status Atual</Text>
        <View style={[
          styles.riskBadge, 
          { 
            backgroundColor: getRiskBackgroundColor(riskLevel),
            borderColor: getRiskColor(riskLevel) + '40'
          }
        ]}>
          <Text style={[styles.riskText, { color: getRiskColor(riskLevel) }]}>
            Risco {riskLevel}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>{description}</Text>
      <Text style={styles.lastUpdate}>Última atualização: {lastUpdate}</Text>

      <View style={styles.conditionsSection}>
        <Text style={styles.sectionTitle}>Condições Atuais</Text>
        <View style={styles.conditionContainer}>
          <MaterialIcons 
            name={getWeatherIcon(weatherCondition) as any} 
            size={20} 
            color={Colors.primary} 
          />
          <Text style={styles.weatherCondition}>{weatherCondition}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    marginBottom: 12,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  conditionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    paddingTop: 16,
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherCondition: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default StatusCard;