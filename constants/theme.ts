// src/constants/theme.ts

export const lightTheme = {
  dark: false,
  colors: {
    background: '#f0f2f5',
    surface: '#ffffff',      // Cards, Modais
    primary: '#6200ea',      // Roxo principal
    secondary: '#03dac6',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e0e0e0',
    inputBg: '#f9f9f9',
    error: '#e53935',
    success: '#2e7d32',
    warning: '#f9a825',
    
    // Cores específicas de RPG
    hp: '#e53935',
    focus: '#1e88e5',
    gold: '#f9a825',
    
    // Elementos de UI
    iconDefault: '#666666',
    cardBorder: '#e0e0e0',
  }
};

export const darkTheme = {
  dark: true,
  colors: {
    background: '#121212',   // Preto quase absoluto
    surface: '#1e1e1e',      // Cinza escuro para cards
    primary: '#bb86fc',      // Roxo mais claro (melhor contraste no escuro)
    secondary: '#03dac6',
    text: '#e0e0e0',         // Branco suave
    textSecondary: '#a0a0a0',
    border: '#333333',
    inputBg: '#2c2c2c',
    error: '#cf6679',
    success: '#81c784',
    warning: '#ffd54f',

    // Cores específicas de RPG
    hp: '#ef5350',           // Vermelho mais claro
    focus: '#42a5f5',        // Azul mais claro
    gold: '#ffca28',

    // Elementos de UI
    iconDefault: '#a0a0a0',
    cardBorder: '#333333',
  }
};

// Tipo para ajudar no TypeScript
export type ThemeColors = typeof lightTheme.colors;