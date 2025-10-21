import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../styles';

interface WeatherCardProps {
  title: string;
  value: string;
  unit?: string;
  status?: string;
  icon?: string;
  iconColor?: string;
  statusColor?: string;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  title,
  value,
  unit = '',
  status,
  icon = 'wb-sunny',
  iconColor = Colors.primary,
  statusColor = '#666'
}) => {
  const getBackgroundColor = () => {
    // Mantém a lógica original de mapping por cores, mas simplificada
    if (!statusColor) return '#f8f9fa';
    switch (statusColor) {
      case Colors.weather.hot:
        return '#fdf2f0';
      case Colors.weather.warm:
        return '#fefbf6';
      case Colors.primary:
        return '#f0f1ff';
      case Colors.weather.air.good:
        return '#f5f6ff';
      case '#f5d76e':
        return '#fefdf4';
      case '#9999b3':
        return '#f7f8fa';
      default:
        return '#f8f9fa';
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: getBackgroundColor() }]}>
      <View style={styles.cardHeader}>
        <MaterialIcons name={icon as any} size={20} color={iconColor} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {status && (
        <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
  },
  extraInfo: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
  },
  extraInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
    fontWeight: '500',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  unit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default WeatherCard;