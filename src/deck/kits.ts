import { BRAND, type Tone } from './guide'
import { LAYOUT_MAP } from './layouts'
import type { Deck, LayoutId, Slide } from './types'

interface KitSlide {
  layout: LayoutId
  tone?: Tone
  content?: Record<string, string>
  notes?: string
}

export interface Kit {
  id: string
  name: string
  description: string
  slides: KitSlide[]
}

// 시작 키트: 상황별로 가이드에 맞는 슬라이드 흐름을 미리 짜둔 묶음.
// 내용은 비워두고 placeholder 로 무엇을 쓸지 안내합니다.
export const KITS: Kit[] = [
  {
    id: 'sales',
    name: '세일즈 덱',
    description: '고객 미팅용 제안서. 문제 → 해결 → 효과 → 일정 순서',
    slides: [
      { layout: 'cover', content: { eyebrow: 'PROPOSAL' }, notes: '고객사 이름과 미팅 목적을 먼저 말합니다.' },
      { layout: 'agenda', content: { title: '목차' } },
      { layout: 'statement', content: { eyebrow: '문제 정의' }, notes: '고객이 공감할 수 있는 문제를 한 문장으로.' },
      { layout: 'title-body' },
      { layout: 'three-cards' },
      { layout: 'image-text' },
      { layout: 'kpi', notes: '숫자에는 반드시 출처와 기준일을 적습니다.' },
      { layout: 'timeline' },
      { layout: 'quote' },
      { layout: 'closing', content: { title: 'Thank you' } },
    ],
  },
  {
    id: 'company',
    name: '회사 소개서',
    description: '파트너·투자자에게 알체라를 소개할 때',
    slides: [
      { layout: 'cover', content: { eyebrow: 'COMPANY INTRODUCTION' } },
      { layout: 'agenda', content: { title: '목차' } },
      { layout: 'section', content: { number: '01' } },
      { layout: 'statement', content: { eyebrow: 'MISSION' } },
      { layout: 'three-cards' },
      { layout: 'kpi' },
      { layout: 'timeline' },
      { layout: 'closing', content: { title: 'Thank you' } },
    ],
  },
  {
    id: 'report',
    name: '프로젝트 보고',
    description: '내부 보고·주간 리뷰. 요약 → 지표 → 이슈 → 다음 단계',
    slides: [
      { layout: 'cover', content: { eyebrow: 'PROJECT REPORT' } },
      { layout: 'title-body', content: { title: '요약' } },
      { layout: 'kpi' },
      { layout: 'two-column', content: { leftTitle: '이슈', rightTitle: '대응' } },
      { layout: 'timeline', content: { title: '다음 단계' } },
      { layout: 'closing', content: { title: 'Q&A' } },
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

export function makeSlide(layout: LayoutId, content: Record<string, string> = {}, tone?: Tone, notes = ''): Slide {
  return { id: uid(), layout, tone: tone ?? LAYOUT_MAP[layout].defaultTone, content: { ...content }, notes }
}

export function createDeckFromKit(kit: Kit): Deck {
  const now = Date.now()
  return {
    id: uid(),
    title: kit.id === 'blank' ? '제목 없는 문서' : `${kit.name} 초안`,
    footer: BRAND.footer,
    slides: kit.slides.map((s) => makeSlide(s.layout, s.content, s.tone, s.notes)),
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
