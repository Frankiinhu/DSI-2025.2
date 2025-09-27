import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface WeatherCardProps {
  title: string;
  value: string;
  unit: string;
  status?: string;
  icon: string;
  iconColor?: string;
  statusColor?: string;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ 
  title, 
  value, 
  unit, 
  status, 
  icon, 
  iconColor = '#5559ff',
  statusColor = '#666'
}) => {
  // Função para determinar a cor de fundo baseada na cor do status
  const getBackgroundColor = () => {
    if (!statusColor) return '#f8f9fa';
    
    switch (statusColor) {
      case '#d4572a': // Laranja escuro - Alto risco
        return '#fdf2f0';
      case '#e9c46a': // Amarelo dourado - Moderado
        return '#fefbf6';
      case '#5559ff': // Azul principal - Normal/Frio
        return '#f0f1ff';
      case '#7b7fff': // Azul claro - Bom
        return '#f5f6ff';
      case '#f5d76e': // Amarelo claro - UV baixo
        return '#fefdf4';
      case '#9999b3': // Cinza azulado - Neutro
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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