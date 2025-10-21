import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = Colors.primary,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: confirmColor }]}
              onPress={() => {
                onConfirm();
                onCancel();
              }}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialog: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  confirmButtonText: {
    ...Typography.button,
    color: Colors.textWhite,
  },
});

export default ConfirmDialog;
