/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(220, 15%, 6%)',
        foreground: 'hsl(210, 40%, 98%)',
        card: 'hsl(220, 15%, 8%)',
        'card-foreground': 'hsl(210, 40%, 98%)',
        border: 'hsl(220, 10%, 18%)',
        input: 'hsl(220, 10%, 18%)',
        accent: 'hsl(220, 10%, 20%)',
        'accent-foreground': 'hsl(210, 40%, 98%)',
        muted: 'hsl(220, 10%, 15%)',
        'muted-foreground': 'hsl(215.4, 16.3%, 65%)',
        // Deploy status colors
        'deploy-yes': 'hsl(142, 76%, 36%)',
        'deploy-yes-foreground': 'hsl(0, 0%, 100%)',
        'deploy-caution': 'hsl(45, 93%, 47%)',
        'deploy-caution-foreground': 'hsl(0, 0%, 100%)',
        'deploy-no': 'hsl(0, 84%, 60%)',
        'deploy-no-foreground': 'hsl(0, 0%, 100%)',
        'deploy-hell-no': 'hsl(0, 65%, 35%)',
        'deploy-hell-no-foreground': 'hsl(0, 0%, 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-gentle': 'bounce-gentle 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.6s ease-out',
      },
      keyframes: {
        'bounce-gentle': {
          '0%, 100%': { 
            transform: 'translateY(0)',
          },
          '50%': { 
            transform: 'translateY(-10px)',
          },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        'fade-in': {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(20px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
      },
    },
  },
  plugins: [],
} 