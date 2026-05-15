import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#5cb85c',
        secondary: '#373a3c',
        danger: '#b85c5c',
        info: '#357edd',
        muted: '#bbbbbb',
        bg: '#f3f3f3',
      },
      fontFamily: {
        body: ['"Source Sans Pro"', 'sans-serif'],
        logo: ['"Titillium Web"', 'sans-serif'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '48px',
      },
      maxWidth: {
        container: '1140px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

export default config;
