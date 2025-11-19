/**
 * Formulário para adicionar/editar medicações
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles';
import type { Medication, CreateMedicationDTO } from '../types/medication.types';

interface MedicationFormProps {
  medication?: Medication;
  onSubmit: (data: CreateMedicationDTO) => void;
  onCancel: () => void;
}

const MedicationForm: React.FC<MedicationFormProps> = ({
  medication,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(medication?.name || '');
  const [dosage, setDosage] = useState(medication?.dosage || '');
  const [frequency, setFrequency] = useState(medication?.frequency || '');
  const [times, setTimes] = useState<string[]>(medication?.times || []);
  const [notes, setNotes] = useState(medication?.notes || '');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  const handleAddTime = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      if (!times.includes(timeString)) {
        setTimes([...times, timeString].sort());
      }
    }
  };

  const handleRemoveTime = (timeToRemove: string) => {
    setTimes(times.filter(t => t !== timeToRemove));
  };

  const handleSubmit = () => {
    if (!name.trim() || !dosage.trim() || !frequency.trim() || times.length === 0) {
      return;
    }

    onSubmit({
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      times,
      notes: notes.trim() || undefined,
      is_active: true,
    });
  };

  const isValid = name.trim() && dosage.trim() && frequency.trim() && times.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {medication ? 'Editar Medicação' : 'Nova Medicação'}
          </Text>
          <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color={Colors.textDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Nome */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Medicação *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Paracetamol"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Dosagem */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dosagem *</Text>
            <TextInput
              style={styles.input}
              value={dosage}
              onChangeText={setDosage}
              placeholder="Ex: 500mg"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Frequência */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Frequência *</Text>
            <TextInput
              style={styles.input}
              value={frequency}
              onChangeText={setFrequency}
              placeholder="Ex: A cada 8 horas, 2x ao dia"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Horários */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Horários * (pelo menos 1)</Text>
            <TouchableOpacity
              style={styles.addTimeButton}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color={Colors.primary} />
              <Text style={styles.addTimeText}>Adicionar Horário</Text>
            </TouchableOpacity>

            {times.length > 0 && (
              <View style={styles.timesList}>
                {times.map((time, index) => (
                  <View key={index} style={styles.timeChip}>
                    <Ionicons name="time-outline" size={16} color={Colors.primary} />
                    <Text style={styles.timeText}>{time}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTime(time)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Observações */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ex: Tomar após as refeições"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton, !isValid && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!isValid}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>
              {medication ? 'Atualizar' : 'Adicionar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleAddTime}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  formScroll: {
    flex: 1,
  },
  form: {
    gap: Spacing.md,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  addTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  button: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textWhite,
  },
  disabledButton: {
    backgroundColor: Colors.textLight,
    ...Shadows.none,
  },
});

export default MedicationForm;
