/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Paleta de colores brand
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#b2cce4',
          300: '#8bb5d6',
          400: '#5a94c8',
          500: '#1f4e78', // Navy principal
          600: '#1a3f5f',
          700: '#143047',
          800: '#0f242f',
          900: '#0a1820',
        },
        charcoal: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#bdbdbd',
          300: '#9e9e9e',
          400: '#707070',
          500: '#424242', // Charcoal principal
          600: '#383838',
          700: '#2e2e2e',
          800: '#242424',
          900: '#1a1a1a',
        },
        ivory: {
          50: '#fffbf7',
          100: '#fef5ed',
          200: '#fdebd7',
          300: '#fce0c1',
          400: '#fbcfa0',
          500: '#faf3ed', // Blanco roto principal
          600: '#d9c2a8',
          700: '#b8907f',
          800: '#8d6b54',
          900: '#62452f',
        },
        gold: {
          50: '#fffef4',
          100: '#fffde3',
          200: '#fffac5',
          300: '#fff6a3',
          400: '#fffb87',
          500: '#d4af37', // Dorado mate principal
          600: '#c9a227',
          700: '#b39a1d',
          800: '#8b7413',
          900: '#6d5c0a',
        },
      },
      fontFamily: {
        // Tipografías brand
        serif: ['"Cormorant Garamond"', 'serif'], // Para títulos
        sans: ['"Inter"', 'sans-serif'], // Para textos
        display: ['"Cormorant Garamond"', 'serif'], // Para displays grandes
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['2rem', { lineHeight: '2.5rem' }],
        '4xl': ['2.5rem', { lineHeight: '3rem' }],
        '5xl': ['3rem', { lineHeight: '3.5rem' }],
      },
      spacing: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '32': '8rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
