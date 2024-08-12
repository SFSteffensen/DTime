/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "media",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
      keyframes: {
        expand: {
          '0%': { maxHeight: '0px', opacity: '0' },
          '100%': { maxHeight: '500px', opacity: '1' },
        },
        collapse: {
          '0%': { maxHeight: '500px', opacity: '1' },
          '100%': { maxHeight: '0px', opacity: '0' },
        },
      },
      animation: {
        expand: 'expand 0.5s ease-out forwards',
        collapse: 'collapse 0.5s ease-out forwards',
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#4c4f69",
          "secondary": "#5c5f77",
          "accent": "#6c6f85",
          "neutral": "#ccd0da",
          "base-100": "#eff1f1",
          "info": "#1e66f5",
          "success": "#40a02b",
          "warning": "#df8e1d",
          "error": "#d20f39",
        },
        dark: {
          "primary": "#c6d0f5",
          "secondary": "#b5bfe2",
          "accent": "#a5adce",
          "neutral": "#292c3c",
          "base-100": "#303446",
          "info": "#8caaee",
          "success": "#a6d189",
          "warning": "#e5c890",
          "error": "#e78284",
        },
      },
      "nord",
      "black",
      "lofi",
      "retro",
      "night",
      "cyberpunk",
      "aqua",
      "valentine",
    ],
  },
  plugins: [
    require('daisyui'),
  ],
}
