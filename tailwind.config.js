/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta institucional SEDEDE Chuquisaca — vino oficial #800020
        brand: {
          50: '#fdf2f4',
          100: '#fbe6e9',
          200: '#f7cfd6',
          300: '#efa9b8',
          400: '#e0758a',
          500: '#d44562',
          600: '#b91c3c',
          700: '#991532',
          800: '#800020', // vino oficial institucional Chuquisaca
          900: '#690b21',
          950: '#400210',
        },
        navyflag: '#1E3A8A', // azul de detalle (franja bandera)
        ink: '#1F2937',
        paper: '#F7F8FA',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      fontFamily: {
        display: ['"Libre Franklin"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
