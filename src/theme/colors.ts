export type ThemeMode = 'light' | 'dark';

export type ColorTokens = {
  primary: string;
  primaryMuted: string;
  secondary: string;
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  neutral: string;
};

export const colors = {
  light: {
    primary: '#6B8F71',
    primaryMuted: '#DDE6DF',
    secondary: '#D6A77A',
    background: '#F7F8F6',
    surface: '#FFFFFF',
    border: '#E6E9E5',
    textPrimary: '#1F2933',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    success: '#7FB685',
    warning: '#E4B363',
    neutral: '#A3A3A3',
  } satisfies ColorTokens,
  dark: {
    primary: '#8FB79A',
    primaryMuted: '#223028',
    secondary: '#E1B589',
    background: '#0F1512',
    surface: '#151D18',
    border: '#233028',
    textPrimary: '#E7ECE8',
    textSecondary: '#B7C0BA',
    textMuted: '#7D877F',
    success: '#8FCF9A',
    warning: '#F0C27A',
    neutral: '#8B8B8B',
  } satisfies ColorTokens,
} as const;

export function getColors(mode: ThemeMode): ColorTokens {
  return colors[mode];
}
