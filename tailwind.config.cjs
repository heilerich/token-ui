// Tailwind CSS configuration
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,svelte,ts}"
  ],
  theme: {
    extend: {
      colors: {
        kubeflowBlue: "#1a3a6d"
      }
    }
  },
  plugins: []
};
