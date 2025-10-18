export const colors = {
  primary: {
    light: '#7b7fff',
    main: '#5559ff',
    dark: '#3135a3',
  },
  neutral: {
    white: '#ffffff',
    light: '#f4f4f5',
    medium: '#a1a1aa',
    dark: '#52525b',
    black: '#18181b',
  },
  accent: {
    light: '#a4a8ff',
    main: '#8183ff',
    background: '#f0f2ff',
  },
  highlight: {
    light: '#f4d93d',
    main: '#e9c46a',
    dark: '#d97706',
  },
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
} as const;

export const theme = {
  colors,
  background: {
    primary: colors.neutral.white,
    secondary: colors.neutral.light,
    accent: colors.accent.light,
    brand: colors.primary.main,
  },
  text: {
    primary: colors.neutral.black,
    secondary: colors.neutral.dark,
    muted: colors.neutral.medium,
    inverse: colors.neutral.white,
    brand: colors.primary.main,
    highlight: colors.highlight.main,
  },
  border: {
    light: colors.neutral.light,
    default: colors.neutral.medium,
    focus: colors.primary.main,
  },
  surface: {
    primary: colors.neutral.white,
    secondary: colors.neutral.light,
    accent: colors.accent.background,
  },
  interactive: {
    primary: colors.primary.main,
    secondary: colors.highlight.main,
    danger: colors.error,
    success: colors.success,
    warning: colors.warning,
  },
  shadow: {
    color: colors.neutral.black,
    opacity: 0.1,
  },
  status: {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.primary.main,
  },
} as const;

export type Theme = typeof theme;
