import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Colors, Spacing } from '../styles';
import { HealthLocationType, CreateHealthLocationDTO, UpdateHealthLocationDTO } from '../types/health-location.types';

interface HealthLocationFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHealthLocationDTO | UpdateHealthLocationDTO) => Promise<void>;
  onPickLocation?: () => void;
  selectedCoordinates?: { latitude: number; longitude: number; address?: string };
  initialData?: {
    id?: string;
    type: HealthLocationType;
    name: string;
    description?: string;
    address: string;
    latitude: number;
    longitude: number;
    contact_phone?: string;
    contact_email?: string;
    event_date?: string;
    event_time?: string;
    event_end_date?: string;
  };
  mode?: 'create' | 'edit';
}

export const HealthLocationForm: React.FC<HealthLocationFormProps> = ({
  visible,
  onClose,
  onSubmit,
  onPickLocation,
  selectedCoordinates,
  initialData,
  mode = 'create',
}) => {
  const [type, setType] = useState<HealthLocationType>(initialData?.type || 'ubs');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [latitude, setLatitude] = useState(initialData?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(initialData?.longitude?.toString() || '');
  const [contactPhone, setContactPhone] = useState(initialData?.contact_phone || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contact_email || '');
  const [eventDate, setEventDate] = useState(initialData?.event_date || '');
  const [eventTime, setEventTime] = useState(initialData?.event_time || '');
  const [eventEndDate, setEventEndDate] = useState(initialData?.event_end_date || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setName(initialData.name);
      setDescription(initialData.description || '');
      setAddress(initialData.address);
      setLatitude(initialData.latitude.toString());
      setLongitude(initialData.longitude.toString());
      setContactPhone(initialData.contact_phone || '');
      setContactEmail(initialData.contact_email || '');
      setEventDate(initialData.event_date || '');
      setEventTime(initialData.event_time || '');
      setEventEndDate(initialData.event_end_date || '');
    }
  }, [initialData]);

  // Atualiza coordenadas e endereço quando selecionados no mapa
  useEffect(() => {
    if (selectedCoordinates) {
      setLatitude(selectedCoordinates.latitude.toFixed(6));
      setLongitude(selectedCoordinates.longitude.toFixed(6));
      
      // Preenche o endereço se disponível
      if (selectedCoordinates.address) {
        setAddress(selectedCoordinates.address);
      }
    }
  }, [selectedCoordinates]);

  const resetForm = () => {
    setType('ubs');
    setName('');
    setDescription('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setContactPhone('');
    setContactEmail('');
    setEventDate('');
    setEventTime('');
    setEventEndDate('');
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome');
      return false;
    }

    if (!address.trim()) {
      Alert.alert('Erro', 'Por favor, insira o endereço');
      return false;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert('Erro', 'Latitude inválida (deve estar entre -90 e 90)');
      return false;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert('Erro', 'Longitude inválida (deve estar entre -180 e 180)');
      return false;
    }

    if (type === 'event') {
      if (!eventDate) {
        Alert.alert('Erro', 'Por favor, insira a data do evento');
        return false;
      }
      if (!eventEndDate) {
        Alert.alert('Erro', 'Por favor, insira a data de término do evento');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const data: CreateHealthLocationDTO | UpdateHealthLocationDTO = {
        type,
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        contact_phone: contactPhone.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        ...(type === 'event' && {
          event_date: eventDate,
          event_time: eventTime || undefined,
          event_end_date: eventEndDate,
        }),
      };

      await onSubmit(data);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Erro ao salvar local de saúde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {mode === 'create' ? 'Adicionar Local' : 'Editar Local'}
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            disabled={isSubmitting}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
          {/* Tipo */}
          {mode === 'create' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'ubs' && styles.typeButtonActive]}
                  onPress={() => setType('ubs')}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.typeButtonText, type === 'ubs' && styles.typeButtonTextActive]}>
                    🏥 UBS
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'event' && styles.typeButtonActive]}
                  onPress={() => setType('event')}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.typeButtonText, type === 'event' && styles.typeButtonTextActive]}>
                    📅 Evento
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Nome */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={type === 'ubs' ? 'Ex: UBS Centro' : 'Ex: Campanha de Vacinação'}
              editable={!isSubmitting}
            />
          </View>

          {/* Descrição */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Informações adicionais..."
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />
          </View>

          {/* Endereço */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Endereço *</Text>
              {selectedCoordinates?.address && (
                <Text style={styles.autoFilledBadge}>✨ Auto-preenchido</Text>
              )}
            </View>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Ex: Rua das Flores, 123"
              editable={!isSubmitting}
              multiline
              numberOfLines={2}
            />
            {selectedCoordinates?.address && (
              <Text style={styles.hint}>
                💡 Endereço obtido automaticamente. Você pode editá-lo se necessário.
              </Text>
            )}
          </View>

          {/* Botão para selecionar no mapa */}
          {onPickLocation && (
            <TouchableOpacity
              style={styles.pickLocationButton}
              onPress={onPickLocation}
              disabled={isSubmitting}
            >
              <Text style={styles.pickLocationIcon}>📍</Text>
              <Text style={styles.pickLocationText}>
                {latitude && longitude 
                  ? 'Alterar localização no mapa' 
                  : 'Selecionar localização no mapa'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Coordenadas */}
          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Latitude *</Text>
              <TextInput
                style={styles.input}
                value={latitude}
                onChangeText={setLatitude}
                placeholder="-8.0476"
                keyboardType="numeric"
                editable={!isSubmitting}
              />
            </View>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Longitude *</Text>
              <TextInput
                style={styles.input}
                value={longitude}
                onChangeText={setLongitude}
                placeholder="-34.8770"
                keyboardType="numeric"
                editable={!isSubmitting}
              />
            </View>
          </View>
          
          {latitude && longitude && (
            <Text style={styles.coordinatesHint}>
              💡 Dica: Você também pode editar as coordenadas manualmente
            </Text>
          )}

          {/* Contatos */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="(81) 99999-9999"
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="contato@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          {/* Campos específicos para eventos */}
          {type === 'event' && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Data do Evento *</Text>
                <TextInput
                  style={styles.input}
                  value={eventDate}
                  onChangeText={setEventDate}
                  placeholder="AAAA-MM-DD (Ex: 2025-12-25)"
                  editable={!isSubmitting}
                />
                <Text style={styles.hint}>Formato: AAAA-MM-DD</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Horário</Text>
                <TextInput
                  style={styles.input}
                  value={eventTime}
                  onChangeText={setEventTime}
                  placeholder="HH:MM (Ex: 09:00)"
                  editable={!isSubmitting}
                />
                <Text style={styles.hint}>Formato: HH:MM (24h)</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Data de Término *</Text>
                <TextInput
                  style={styles.input}
                  value={eventEndDate}
                  onChangeText={setEventEndDate}
                  placeholder="AAAA-MM-DD (Ex: 2025-12-31)"
                  editable={!isSubmitting}
                />
                <Text style={styles.hint}>O evento expirará após esta data</Text>
              </View>
            </>
          )}

          <Text style={styles.requiredNote}>* Campos obrigatórios</Text>
        </ScrollView>

        {/* Botões de ação */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Salvando...' : mode === 'create' ? 'Adicionar' : 'Atualizar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: Spacing.md,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: 16,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  typeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  typeButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  requiredNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  button: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textWhite,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pickLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  pickLocationIcon: {
    fontSize: 24,
  },
  pickLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  coordinatesHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  autoFilledBadge: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    backgroundColor: Colors.success + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
