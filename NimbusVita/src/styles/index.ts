/**
 * Sistema de Design Unificado do NimbusVita
 * Exportação centralizada de todos os estilos
 */

export { Colors } from './colors';
export { Typography, FontSizes } from './typography';
export { Spacing, BorderRadius, Shadows } from './spacing';
export { ComponentStyles } from './components';
export * from './utils';

// Tema completo consolidado
export const Theme = {
  colors: require('./colors').Colors,
  typography: require('./typography').Typography,
  spacing: require('./spacing').Spacing,
  borderRadius: require('./spacing').BorderRadius,
  shadows: require('./spacing').Shadows,
  components: require('./components').ComponentStyles,
} as const;

export type AppTheme = typeof Theme;
