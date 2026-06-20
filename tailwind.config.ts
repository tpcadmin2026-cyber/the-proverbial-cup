import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        paper:           '#E8E6D8',
        'paper-dark':    '#D8D6C8',
        'paper-aged':    '#b8b090',
        ink:             '#35291C',
        'ink-faded':     '#4B4C44',
        rule:            '#35291C',
        red:             '#7A564C',
        gold:            '#C4AB77',
        millennial:      '#4B4C44',
        'dusty-rose':    '#7A564C',
        'champagne-gold':'#C4AB77',
        sumatra:         '#35291C',
        latte:           '#35291C',
        // Admin palette
        admin: {
          bg:      '#f8f7f4',
          sidebar: '#35291C',
          nav:     '#4B4C44',
          accent:  '#C4AB77',
          danger:  '#7A564C',
        },
      },
      fontFamily: {
        sans:        ['Inter', 'system-ui', 'sans-serif'],
        anton:       ['Anton', 'sans-serif'],
        baskerville: ['Libre Baskerville', 'serif'],
        playfair:    ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
