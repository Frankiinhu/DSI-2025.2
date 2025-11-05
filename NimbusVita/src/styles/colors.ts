/**
 * Sistema de Cores do NimbusVita
 * Paleta centralizada para todo o aplicativo
 */

export const Colors = {
  // Cores Primárias
  primary: '#5559ff',
  primaryLight: '#7b7fff',
  primaryDark: '#3d41cc',
  
  // Cores Secundárias
  secondary: '#e9c46a',
  secondaryLight: '#f5d76e',
  secondaryDark: '#d1974b',
  
  // Cores de Acento
  accent: '#a4a8ff',
  accentLight: '#c4c7ff',
  
  // Cores de Status
  success: '#28a745',
  warning: '#ffc107',
  warningLight: '#ffcd38',
  danger: '#d4572a',
  dangerLight: '#e9673f',
  info: '#17a2b8',
  infoLight: '#3bb4c7',
  
  // Cores de Risco
  riskLow: '#7b7fff',
  riskModerate: '#e9c46a',
  riskHigh: '#d4572a',
  
  // Cores de Fundo
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceLight: '#f8f9fa',
  surfaceDark: '#e9ecef',
  
  // Cores de Texto
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textWhite: '#ffffff',
  textDark: '#000000',
  
  // Cores de Borda
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  
  // Cores de Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Cores de Input
  inputBackground: '#f0f2ff',
  inputBorder: '#e0e0e0',
  inputPlaceholder: '#999999',
  
  // Cores Climáticas
  weather: {
    hot: '#d4572a',
    warm: '#e9c46a',
    cool: '#7b7fff',
    air: {
      good: '#7b7fff',
      moderate: '#e9c46a',
      unhealthy: '#d4572a',
      dangerous: '#8b0000',
    },
  },
} as const;

export type ColorPalette = typeof Colors;

/**
 * Theme-compatible color mappings for backward compatibility
 * Maps theme.* patterns to Colors.*
 */
export const ThemeColors = {
  interactive: {
    primary: Colors.primary,
    secondary: Colors.secondary,
    danger: Colors.danger,
    success: Colors.success,
    warning: Colors.warning,
  },
  text: {
    primary: Colors.textPrimary,
    secondary: Colors.textSecondary,
    muted: Colors.textTertiary,
    inverse: Colors.textWhite,
    brand: Colors.primary,
    highlight: Colors.secondary,
  },
  surface: {
    primary: Colors.surface,
    secondary: Colors.surfaceLight,
    accent: Colors.inputBackground,
  },
  border: {
    light: Colors.borderLight,
    default: Colors.border,
    focus: Colors.primary,
  },
  background: {
    primary: Colors.surface,
    secondary: Colors.surfaceLight,
    accent: Colors.accentLight,
    brand: Colors.primary,
  },
  status: {
    success: Colors.success,
    error: Colors.danger,
    warning: Colors.warning,
    info: Colors.info,
  },
  shadow: {
    color: Colors.textDark,
    opacity: 0.1,
  },
} as const;

export type ThemeColorPalette = typeof ThemeColors;
