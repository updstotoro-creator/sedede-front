/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta institucional SEDEDE Chuquisaca (deportiva)
        brand: {
          800: '#7A0F1F',
          700: '#9F1327', // rojo institucional oscuro (footer, textos fuertes)
          600: '#C41230', // rojo primario (botones, acentos, navbar)
          500: '#DC2B45',
          100: '#FBE4E7',
          50: '#FDF3F4',
        },
        navyflag: '#1E3A8A', // azul de detalle (franja bandera)
        ink: '#1F2937',
        paper: '#F7F8FA',
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
