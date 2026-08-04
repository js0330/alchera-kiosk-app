/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-navy': '#000038',
        'primary-blue': '#0000A5',
        'accent-blue': '#1D4ED8',
        'text-gray': '#666666',
        'text-light': '#595959',
        'border-gray': '#E0E5F0',
        'bg-panel': '#F5F7FC',
        'bg-white': '#FFFFFF',
        'status-normal': '#22C55E',
        'status-caution': '#F1A11D',
        'status-danger': '#E84B55',
      },
      fontFamily: {
        sans: [
          'Pretendard',
          'Noto Sans KR',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        // 원거리(보행 중)에서도 읽히도록 모바일/웹 대비 한 단계 이상 크게 설정
        caption: ['1rem', { lineHeight: '1.5rem' }],
        base: ['1.375rem', { lineHeight: '2rem' }],
        label: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        'card-title': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700' }],
        headline: ['3.25rem', { lineHeight: '3.75rem', fontWeight: '800' }],
        mega: ['5rem', { lineHeight: '5.25rem', fontWeight: '800' }],
      },
      boxShadow: {
        card: '0 2px 6px 0 rgba(0, 0, 56, 0.06)',
      },
    },
  },
  plugins: [],
}
