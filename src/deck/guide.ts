// 알체라 PPT 가이드(ALCHERA_PPT_Template_ver.260507)를 코드로 옮긴 값 — 색·글꼴·크기의 단일 기준
// 편집 화면과 PPTX 내보내기가 모두 이 값을 쓰므로, 가이드가 바뀌면 이 파일만 고치면 됩니다.

// 가이드 슬라이드 크기: 10in × 5.625in (Google Slides 16:9 기본)
// 화면에서는 1280×720 좌표를 쓰므로 128px = 1in.
export const SLIDE_W = 1280
export const SLIDE_H = 720
export const PX_PER_IN = 128
export const SLIDE_IN = { w: 10, h: 5.625 }

// pt → px (1280px 너비 기준). 가이드의 pt 값을 그대로 화면에 옮길 때 사용합니다.
export const ptToPx = (pt: number) => (pt * PX_PER_IN) / 72

const asset = (name: string) => `${import.meta.env.BASE_URL}deck/${name}`

export const BRAND = {
  name: 'ALCHERA',
  colors: {
    navy: '#000038', // 슬라이드 타이틀·본문·간지 배경
    blue: '#0000A5', // 슬라이드 서브·강조·타이틀형 헤더
    gray: '#666666', // 안내문·이미지 안내 문구
    crumb: '#9CA3AF', // 상단 목차
    pageNum: '#BFBFBF', // 페이지 번호·마무리 연락처
    line: '#E7E6E6', // 라인형 패널 테두리
    imageFill: '#F0F3F8', // 이미지 자리
    white: '#FFFFFF',
  },
  font: {
    ppt: 'Noto Sans KR',
    web: "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
  },
  coverBg: asset('cover-bg.png'),
  logo: {
    white: asset('logo-white.png'),
    navy: asset('logo-navy.png'),
    ratio: 2048 / 292,
  },
  contact: '서울특별시 강남구 논현로 653, 3층(논현동)\ncontact@alcherainc.com\n02-2135-6874',
} as const

// 배경: 본문(흰색) · 간지(네이비) · 표지/마무리(대각선 그래픽 이미지)
export type Tone = 'light' | 'navy' | 'cover'

export interface Palette {
  label: string
  bg: string
  bgImage?: string
  logo: 'white' | 'navy'
}

export const TONES: Record<Tone, Palette> = {
  light: { label: '본문', bg: '#FFFFFF', logo: 'navy' },
  navy: { label: '간지', bg: BRAND.colors.navy, logo: 'white' },
  cover: { label: '표지', bg: BRAND.colors.navy, bgImage: BRAND.coverBg, logo: 'white' },
}

// 가이드 페이지에 노출되는 글자 체계 (가이드 원문 그대로)
export const TYPE_SCALE = [
  { name: '표지 타이틀', spec: '36pt · Bold · 두 줄까지', size: 36, bold: true },
  { name: '목차 · 간지 타이틀', spec: '27pt · Bold', size: 27, bold: true },
  { name: '슬라이드 타이틀', spec: '19pt · Bold · #000038', size: 19, bold: true },
  { name: '목차 항목', spec: '16pt · Bold · 두 줄 간격', size: 16, bold: true },
  { name: '서브타이틀', spec: '14pt · 표지', size: 14, bold: false },
  { name: '콘텐츠 타이틀', spec: '12pt · Bold · #000038 · 줄간격 1.2', size: 12, bold: true },
  { name: '슬라이드 서브', spec: '11pt · #0000A5 · 한 줄', size: 11, bold: false },
  { name: '콘텐츠 서브', spec: '10pt · Bold · #000038 · 줄간격 1.3', size: 10, bold: true },
  { name: '본문', spec: '10pt · #000038 · 줄간격 1.3 · 강조는 Bold', size: 10, bold: false },
  { name: '상단 목차', spec: '9pt · #9CA3AF', size: 9, bold: false },
  { name: '안내문', spec: '8pt · #666666 · 줄간격 1.3', size: 8, bold: false },
] as const

export const GUIDE_RULES = [
  { title: '라인형 vs 타이틀형', body: '텍스트 중심이면 라인형, 강조 헤더가 필요하면 타이틀형 패널을 씁니다.' },
  { title: '글머리는 텍스트로', body: '본문 앞 •는 글머리 기호 기능이 아닌 텍스트로 넣고, 강조는 Bold로만 합니다.' },
  { title: '슬라이드 서브는 한 줄', body: '타이틀 아래 파란 서브 문장은 한 줄로 씁니다. 상단 목차는 섹션에서 자동으로 채워집니다.' },
  { title: '이미지 높이는 고정', body: '이미지는 레이아웃이 정한 높이를 지키고, 아래에 이미지 안내 문구를 붙입니다.' },
] as const
