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
  // ... more shadows as needed
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