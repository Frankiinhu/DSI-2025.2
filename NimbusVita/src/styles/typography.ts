/**
 * Sistema de Tipografia do NimbusVita
 * Estilos de texto padronizados
 */

import { TextStyle } from 'react-native';

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xl2: 24,
  xl3: 28,
  xl4: 32,
  xl5: 36,
} as const;

const createTypography = (fontSize: number, fontWeight: TextStyle['fontWeight']) => ({
  fontSize,
  fontWeight,
  lineHeight: fontSize * 1.5,
});

export const Typography = {
  // Headings
  h1: createTypography(FontSizes.xl5, '700'),
  h2: createTypography(FontSizes.xl4, '700'),
  h3: createTypography(FontSizes.xl3, '700'),
  h4: createTypography(FontSizes.xl2, '600'),
  h5: createTypography(FontSizes.xl, '600'),
  h6: createTypography(FontSizes.lg, '600'),
  
  // Body Text
  bodyLarge: createTypography(FontSizes.lg, '400'),
  body: createTypography(FontSizes.base, '400'),
  bodySmall: createTypography(FontSizes.md, '400'),
  
  // Labels
  label: createTypography(FontSizes.md, '500'),
  labelSmall: createTypography(FontSizes.sm, '500'),
  
  // Buttons
  button: createTypography(FontSizes.base, '600'),
  buttonSmall: createTypography(FontSizes.md, '600'),
  buttonLarge: createTypography(FontSizes.lg, '600'),
  
  // Caption
  caption: createTypography(FontSizes.sm, '400'),
  captionBold: createTypography(FontSizes.sm, '600'),
} as const;

export type TypographyVariant = keyof typeof Typography;
