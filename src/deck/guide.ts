// 알체라 프레젠테이션 가이드 — 색·글꼴·여백의 단일 기준(Single Source of Truth)
// 화면 편집기와 PPTX 내보내기가 모두 이 값을 사용하므로, 회사 가이드가 바뀌면 이 파일만 고치면 됩니다.

// 슬라이드는 16:9(13.333in × 7.5in). 1280×720px 좌표계를 쓰면 96px = 1in 로 정확히 맞아떨어집니다.
export const SLIDE_W = 1280
export const SLIDE_H = 720
export const PX_PER_IN = 96

// pt → px (96dpi 기준). PPT 글자 크기(pt)를 그대로 화면에 옮길 때 사용합니다.
export const ptToPx = (pt: number) => (pt * 4) / 3

export const BRAND = {
  name: 'ALCHERA',
  colors: {
    navy: '#000038',
    blue: '#0000A5',
    brightBlue: '#4D6BFF',
    ink: '#1A1A2E',
    gray: '#666666',
    line: '#E0E5F0',
    panel: '#F5F7FC',
    white: '#FFFFFF',
  },
  font: {
    // PPT에서 사용할 글꼴 이름. 팀원 PC에 Pretendard가 없다면 '맑은 고딕'으로 바꿔도 됩니다.
    ppt: 'Pretendard',
    web: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  margin: 64, // 좌우 안전 여백(px) = 0.67in
  footer: '© ALCHERA Inc. All rights reserved.',
  logo: {
    white: '/alchera-logo.png',
    navy: '/alchera-logo-navy.png',
    ratio: 1140 / 163,
  },
} as const

export type Tone = 'light' | 'navy' | 'blue'

export interface Palette {
  label: string
  bg: string
  title: string
  body: string
  muted: string
  accent: string
  accentSoft: string
  line: string
  logo: 'white' | 'navy'
}

export const TONES: Record<Tone, Palette> = {
  light: {
    label: '화이트',
    bg: '#FFFFFF',
    title: '#000038',
    body: '#333A4D',
    muted: '#7A8099',
    accent: '#0000A5',
    accentSoft: '#F2F4FB',
    line: '#E0E5F0',
    logo: 'navy',
  },
  navy: {
    label: '네이비',
    bg: '#000038',
    title: '#FFFFFF',
    body: '#D3D7EE',
    muted: '#8A90B8',
    accent: '#7B8CFF',
    accentSoft: '#0D0D4A',
    line: '#24245E',
    logo: 'white',
  },
  blue: {
    label: '알체라 블루',
    bg: '#0000A5',
    title: '#FFFFFF',
    body: '#DCE1FF',
    muted: '#9CA8FF',
    accent: '#FFFFFF',
    accentSoft: '#1414B4',
    line: '#3434C2',
    logo: 'white',
  },
}

// 가이드 페이지에 노출되는 글자 크기 체계(pt)
export const TYPE_SCALE = [
  { name: '표지 제목', size: 40, weight: 'Bold', use: '표지·마무리 슬라이드 제목' },
  { name: '섹션 제목', size: 40, weight: 'Bold', use: '섹션 구분 슬라이드' },
  { name: '슬라이드 제목', size: 28, weight: 'Bold', use: '모든 본문 슬라이드 좌상단' },
  { name: '본문', size: 18, weight: 'Regular', use: '불릿 목록·설명' },
  { name: '카드 본문', size: 14, weight: 'Regular', use: '카드·타임라인 설명' },
  { name: '캡션', size: 11, weight: 'Regular', use: '출처·주석' },
] as const

export const GUIDE_RULES = [
  { title: '한 장에 한 메시지', body: '슬라이드 제목은 결론을 말하는 한 문장으로 씁니다. "현황"보다 "도입 3개월 만에 사고 0건".' },
  { title: '본문은 6줄 이하', body: '불릿은 6개, 한 줄은 40자 안팎으로. 넘치면 슬라이드를 나눕니다.' },
  { title: '색은 3가지만', body: '네이비·알체라 블루·그레이. 강조는 블루 하나로만 합니다.' },
  { title: '로고·여백은 고정', body: '로고 위치와 좌우 0.67in 여백은 템플릿이 자동으로 지킵니다. 옮기지 마세요.' },
] as const
