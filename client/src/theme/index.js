import { createTheme } from '@mui/material/styles';

// Journey-inspired color palette
const palette = {
  primary: {
    main: '#0D5E6D',    // Deep Teal
    light: '#1A7A8C',
    dark: '#084954',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#FF7F66',    // Coral
    light: '#FF9985',
    dark: '#E56B54',
    contrastText: '#ffffff',
  },
  background: {
    default: '#f5f7fa',
    paper: '#ffffff',
    dark: '#081F2C',    // Dark blue for gradients
    darkAlt: '#0A2536', // Slightly lighter dark blue for gradients
  },
  success: {
    main: '#4CD7D0',    // Mint Green
    light: '#6EEAE3',
    dark: '#3AABA5',
    contrastText: '#ffffff',
  },
  error: {
    main: '#FF5252',
    light: '#FF7373',
    dark: '#D14343',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
    disabled: '#999999',
    light: '#ffffff',
  },
};

// Custom shadows
const shadows = [
  'none',
  '0px 2px 4px rgba(0, 0, 0, 0.05)',
  '0px 4px 8px rgba(0, 0, 0, 0.08)',
  '0px 8px 16px rgba(0, 0, 0, 0.1)',
  '0px 12px 24px rgba(0, 0, 0, 0.12)',
  '0px 16px 32px rgba(0, 0, 0, 0.14)',
  '0px 20px 40px rgba(0, 0, 0, 0.16)',
  '0px 24px 48px rgba(0, 0, 0, 0.18)',
  '0px 28px 56px rgba(0, 0, 0, 0.20)',
  '0px 32px 64px rgba(0, 0, 0, 0.22)',
  '0px 36px 72px rgba(0, 0, 0, 0.24)',
  '0px 40px 80px rgba(0, 0, 0, 0.26)',
  '0px 44px 88px rgba(0, 0, 0, 0.28)',
  '0px 48px 96px rgba(0, 0, 0, 0.30)',
  '0px 52px 104px rgba(0, 0, 0, 0.32)',
  '0px 56px 112px rgba(0, 0, 0, 0.34)',
  '0px 60px 120px rgba(0, 0, 0, 0.36)',
  '0px 64px 128px rgba(0, 0, 0, 0.38)',
  '0px 68px 136px rgba(0, 0, 0, 0.40)',
  '0px 72px 144px rgba(0, 0, 0, 0.42)',
  '0px 76px 152px rgba(0, 0, 0, 0.44)',
  '0px 80px 160px rgba(0, 0, 0, 0.46)',
  '0px 84px 168px rgba(0, 0, 0, 0.48)',
  '0px 88px 176px rgba(0, 0, 0, 0.50)',
  '0px 92px 184px rgba(0, 0, 0, 0.52)',
];

// Custom typography
const typography = {
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontWeight: 700,
    fontSize: '2.5rem',
  },
  h2: {
    fontWeight: 600,
    fontSize: '2rem',
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.5rem',
  },
  subtitle1: {
    fontSize: '1.1rem',
    fontWeight: 500,
  },
  subtitle2: {
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  button: {
    textTransform: 'none',
    fontWeight: 600,
  },
};

// Custom shape
const shape = {
  borderRadius: 8,
};

// Create the theme
const theme = createTheme({
  palette,
  typography,
  shadows,
  shape,
  components: {
    // Custom default props and styles for MUI components
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: shadows[1],
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.2s',
        },
        contained: {
          '&:hover': {
            boxShadow: shadows[2],
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: shadows[1],
          '&:hover': {
            boxShadow: shadows[2],
          },
          transition: 'box-shadow 0.3s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: shadows[1],
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: palette.primary.main,
            },
          },
        },
      },
    },
  },
});

export default theme; 