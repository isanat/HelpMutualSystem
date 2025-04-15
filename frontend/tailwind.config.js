/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}', // Escaneia arquivos no diretório src/app
    './src/components/**/*.{js,ts,jsx,tsx}', // Escaneia componentes reutilizáveis
  ],
  theme: {
    extend: {}, // Personalize o tema aqui, se desejar
  },
  plugins: [], // Adicione plugins do Tailwind aqui, se necessário
};