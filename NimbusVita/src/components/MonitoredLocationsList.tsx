/**
 * Lista de localizações monitoradas
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles';
import type { MonitoredLocation } from '../types/monitored-location.types';

interface MonitoredLocationsListProps {
  locations: MonitoredLocation[];
  onEdit: (location: MonitoredLocation) => void;
  onDelete: (location: MonitoredLocation) => void;
  onSetPrimary: (location: MonitoredLocation) => void;
}

const MonitoredLocationsList: React.FC<MonitoredLocationsListProps> = ({
  locations,
  onEdit,
  onDelete,
  onSetPrimary,
}) => {
  const renderLocation = ({ item }: { item: MonitoredLocation }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.locationInfo}>
          {item.is_primary && (
            <View style={styles.primaryBadge}>
              <Ionicons name="star" size={14} color={Colors.warning} />
              <Text style={styles.primaryText}>Principal</Text>
            </View>
          )}
          <Text style={styles.cityName}>
            {item.nickname || item.city_name}
          </Text>
          {item.nickname && (
            <Text style={styles.citySubname}>{item.city_name}</Text>
          )}
          <Text style={styles.locationDetails}>
            {[item.state, item.country].filter(Boolean).join(', ')}
          </Text>
          <Text style={styles.coordinates}>
            📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </Text>
        </View>

        <View style={styles.actions}>
          {!item.is_primary && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onSetPrimary(item)}
            >
              <Ionicons name="star-outline" size={22} color={Colors.warning} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(item)}
          >
            <MaterialCommunityIcons name="pencil" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete(item)}
          >
            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (locations.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="location-outline" size={64} color={Colors.textLight} />
        <Text style={styles.emptyText}>Nenhuma localização adicionada</Text>
        <Text style={styles.emptySubtext}>
          Adicione cidades para monitorar informações de saúde
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={locations}
      renderItem={renderLocation}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
  },
  cityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 4,
  },
  citySubname: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  locationDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});

export default MonitoredLocationsList;
