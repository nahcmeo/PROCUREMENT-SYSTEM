/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Helvetica', 'sans-serif'],
      },
      colors: {
        'action-primary': '#4F46E5',
        'action-primary-hover': '#4338CA',
        'background-canvas': '#F8FAFC',
        'border-default': '#E2E8F0',
        'surface-default': '#FFFFFF',
        'surface-subtle': '#F1F5F9',
        'navigation-selected-background': '#EEF2FF',
        
        'text-brand': '#4F46E5',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        
        'status-approved-background': '#F0FDF4',
        'status-approved-text': '#15803D',
        'status-pending-background': '#FFFBEB',
        'status-pending-text': '#B45309',
        'status-processing-background': '#EFF6FF',
        'status-processing-text': '#1D4ED8',
        'status-rejected-background': '#FEF2F2',
        'status-rejected-text': '#B91C1C',
        'status-draft-background': '#F1F5F9',
        'status-draft-text': '#475569',

        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        }
      }
    },
  },
  plugins: [],
}
