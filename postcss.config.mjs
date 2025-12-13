const config = {
  plugins: {
    "@tailwindcss/postcss": {
      theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
    },
  },
};

export default config;
