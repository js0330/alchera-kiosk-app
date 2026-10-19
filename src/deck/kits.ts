import { BRAND } from './guide'
import { LAYOUT_MAP } from './layouts'
import type { Deck, LayoutId, Slide } from './types'

interface KitSlide {
  layout: LayoutId
  content?: Record<string, string>
  notes?: string
}

export interface Kit {
  id: string
  name: string
  description: string
  slides: KitSlide[]
}

const contact = { title: '감사합니다.', contact: BRAND.contact }

// 시작 키트: 실제 알체라 소개서들(Face Trust · 공기질 AI · 피지컬 AI)의 흐름을 바탕으로 짠 슬라이드 묶음.
// 내용은 비워두고 placeholder 로 무엇을 쓸지 안내합니다.
export const KITS: Kit[] = [
  {
    id: 'solution',
    name: '솔루션 소개서',
    description: '고객사 제안용. 회사 소개 → 문제 → 제품 → 작동 원리 → 성과',
    slides: [
      { layout: 'cover', notes: '고객사 이름과 미팅 목적을 먼저 말합니다.' },
      { layout: 'contents', content: { title: 'CONTENTS', items: '회사 소개\n문제 제기\n제품 소개\n작동 원리\n도입 효과' } },
      { layout: 'line-1' },
      { layout: 'section', content: { title: '문제 제기' } },
      { layout: 'line-2' },
      { layout: 'section', content: { title: '제품 소개' } },
      { layout: 'header-1' },
      { layout: 'line-3' },
      { layout: 'section', content: { title: '작동 원리' } },
      { layout: 'header-2' },
      { layout: 'line-grid', notes: '수치에는 출처와 기준일을 안내문으로 붙입니다.' },
      { layout: 'closing', content: contact },
    ],
  },
  {
    id: 'company',
    name: '회사 소개서',
    description: '파트너·투자자용. 회사 · 사업 영역 · 레퍼런스',
    slides: [
      { layout: 'cover' },
      { layout: 'contents', content: { title: 'CONTENTS', items: '회사 소개\n사업 영역\n주요 레퍼런스' } },
      { layout: 'section', content: { title: '회사 소개' } },
      { layout: 'line-1' },
      { layout: 'section', content: { title: '사업 영역' } },
      { layout: 'header-3' },
      { layout: 'section', content: { title: '주요 레퍼런스' } },
      { layout: 'line-grid' },
      { layout: 'closing', content: contact },
    ],
  },
  {
    id: 'report',
    name: '프로젝트 보고',
    description: '내부 보고·리뷰. 요약 → 진행 현황 → 이슈 → 다음 단계',
    slides: [
      { layout: 'cover' },
      { layout: 'line-1', content: { title: '요약' } },
      { layout: 'line-grid', content: { title: '진행 현황' } },
      { layout: 'header-2', content: { title: '이슈와 대응', lHead: '이슈', rHead: '대응' } },
      { layout: 'header-3', content: { title: '다음 단계' } },
      { layout: 'closing', content: contact },
    ],
  },
  {
    id: 'blank',
    name: '빈 문서',
    description: '표지 한 장에서 자유롭게 시작',
    slides: [{ layout: 'cover' }],
  },
]

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export function makeSlide(layout: LayoutId, content: Record<string, string> = {}, notes = ''): Slide {
  return { id: uid(), layout, tone: LAYOUT_MAP[layout].tone, content: { ...content }, notes }
}

export function createDeckFromKit(kit: Kit): Deck {
  const now = Date.now()
  return {
    id: uid(),
    title: kit.id === 'blank' ? '제목 없는 문서' : `${kit.name} 초안`,
    slides: kit.slides.map((s) => makeSlide(s.layout, s.content, s.notes)),
    createdAt: now,
    updatedAt: now,
  }
}

// 레이아웃 갤러리에서 "이 레이아웃으로 시작"할 때: 표지 + 선택한 레이아웃(예시 내용 포함)
export function createDeckFromLayout(layout: LayoutId): Deck {
  const deck = createDeckFromKit(KITS.find((k) => k.id === 'blank')!)
  if (layout !== 'cover') deck.slides.push(makeSlide(layout, LAYOUT_MAP[layout].sample))
  return deck
}
