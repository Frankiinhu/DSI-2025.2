/**
 * Estilos de Componentes Reutilizáveis do NimbusVita
 */

import { ViewStyle, TextStyle } from 'react-native';
import { Colors } from './colors';
import { Typography } from './typography';
import { Spacing, BorderRadius, Shadows } from './spacing';

export const ComponentStyles = {
  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  } as ViewStyle,
  
  cardSmall: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    ...Shadows.sm,
  } as ViewStyle,
  
  // Buttons
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Shadows.sm,
  } as ViewStyle,
  
  buttonSecondary: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Shadows.sm,
  } as ViewStyle,
  
  buttonText: {
    ...Typography.button,
    color: Colors.textWhite,
  } as TextStyle,
  
  // Inputs
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    ...Typography.body,
    color: Colors.textPrimary,
  } as TextStyle & ViewStyle,
  
  // Headers
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl2,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl2,
    borderBottomRightRadius: BorderRadius.xl2,
    ...Shadows.lg,
  } as ViewStyle,
  
  headerTitle: {
    ...Typography.h3,
    color: Colors.textWhite,
    marginBottom: Spacing.xs,
  } as TextStyle,
  
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textWhite,
    opacity: 0.9,
  } as TextStyle,
  
  // Badges
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  } as ViewStyle,
  
  badgeText: {
    ...Typography.captionBold,
    color: Colors.textWhite,
  } as TextStyle,
  
  // Chips
  chip: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  } as ViewStyle,
  
  chipSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondaryDark,
  } as ViewStyle,
  
  chipText: {
    ...Typography.labelSmall,
    color: Colors.textPrimary,
  } as TextStyle,
  
  chipTextSelected: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600' as const,
  } as TextStyle,
  
  // Dividers
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.base,
  } as ViewStyle,
  
  // List Items
  listItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  } as ViewStyle,
  
  listItemText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  } as TextStyle,
  
  // Empty States
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.xl4,
    paddingHorizontal: Spacing.lg,
  } as ViewStyle,
  
  emptyStateText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: Spacing.base,
  } as TextStyle,
  
  emptyStateSubtext: {
    ...Typography.body,
    color: Colors.textTertiary,
    textAlign: 'center' as const,
    marginTop: Spacing.sm,
  } as TextStyle,
} as const;
