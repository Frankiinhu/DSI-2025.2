/**
 * Sistema de Espaçamento do NimbusVita
 * Valores padronizados para margins, paddings e gaps
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xl2: 28,
  xl3: 32,
  xl4: 40,
  xl5: 48,
  xl6: 56,
  xl7: 64,
} as const;

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xl2: 24,
  full: 9999,
} as const;

const createShadow = (height: number, opacity: number, radius: number, elevation: number) => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: createShadow(1, 0.05, 2, 1),
  base: createShadow(2, 0.08, 4, 2),
  md: createShadow(3, 0.1, 6, 3),
  lg: createShadow(4, 0.12, 8, 4),
  xl: createShadow(6, 0.15, 12, 6),
} as const;

export type ShadowSize = keyof typeof Shadows;
