import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Spacing } from '../styles';
import { HealthLocation } from '../types/health-location.types';

interface HealthLocationListProps {
  locations: HealthLocation[];
  onEdit: (location: HealthLocation) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  isLoading?: boolean;
}

export const HealthLocationList: React.FC<HealthLocationListProps> = ({
  locations,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading = false,
}) => {
  const handleDelete = (location: HealthLocation) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir "${location.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDelete(location.id),
        },
      ]
    );
  };

  const handleToggleActive = (location: HealthLocation) => {
    const action = location.is_active ? 'desativar' : 'ativar';
    Alert.alert(
      `Confirmar ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Deseja realmente ${action} "${location.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: () => onToggleActive(location.id, !location.is_active),
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const isExpired = (location: HealthLocation): boolean => {
    if (location.type === 'ubs') return false;
    if (!location.expires_at) return false;
    return new Date(location.expires_at) < new Date();
  };

  const renderItem = ({ item }: { item: HealthLocation }) => {
    const expired = isExpired(item);

    return (
      <View style={[styles.card, !item.is_active && styles.cardInactive]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.typeIcon}>
              {item.type === 'ubs' ? '🏥' : '📅'}
            </Text>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardType}>
                {item.type === 'ubs' ? 'UBS' : 'Evento'}
                {expired && ' (Expirado)'}
              </Text>
            </View>
          </View>
          {!item.is_active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inativo</Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.infoLabel}>📍 Endereço:</Text>
          <Text style={styles.infoText}>{item.address}</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.infoLabel}>📌 Coordenadas:</Text>
          <Text style={styles.infoText}>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </Text>
        </View>

        {item.contact_phone && (
          <View style={styles.cardInfo}>
            <Text style={styles.infoLabel}>📞 Telefone:</Text>
            <Text style={styles.infoText}>{item.contact_phone}</Text>
          </View>
        )}

        {item.type === 'event' && item.event_date && (
          <>
            <View style={styles.cardInfo}>
              <Text style={styles.infoLabel}>📅 Data:</Text>
              <Text style={styles.infoText}>
                {formatDate(item.event_date)}
                {item.event_time && ` às ${item.event_time}`}
              </Text>
            </View>
            {item.event_end_date && (
              <View style={styles.cardInfo}>
                <Text style={styles.infoLabel}>🏁 Término:</Text>
                <Text style={styles.infoText}>
                  {formatDate(item.event_end_date)}
                </Text>
              </View>
            )}
          </>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(item)}
          >
            <Text style={styles.actionButtonText}>✏️ Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.toggleButton]}
            onPress={() => handleToggleActive(item)}
          >
            <Text style={styles.actionButtonText}>
              {item.is_active ? '🔽 Desativar' : '🔼 Ativar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.deleteButtonText}>🗑️ Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (locations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Nenhum local cadastrado</Text>
        <Text style={styles.emptySubtext}>
          Toque no botão "+" para adicionar
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={locations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInactive: {
    opacity: 0.6,
    backgroundColor: Colors.surfaceLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardType: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  inactiveBadge: {
    backgroundColor: Colors.textSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: 12,
    color: Colors.textWhite,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  cardInfo: {
    marginBottom: Spacing.xs,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: Spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: Colors.info + '15',
    borderColor: Colors.info,
  },
  toggleButton: {
    backgroundColor: Colors.warning + '15',
    borderColor: Colors.warning,
  },
  deleteButton: {
    backgroundColor: Colors.danger + '15',
    borderColor: Colors.danger,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
