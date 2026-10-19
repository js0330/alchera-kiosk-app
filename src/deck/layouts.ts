import { BRAND, TONES, type Palette, type Tone } from './guide'
import type { FieldDef, LayoutId, Slide, SlideEl, TextEl } from './types'

export type LayoutCategory = '구성' | '본문' | '데이터' | '마무리'

export interface BuildCtx {
  c: Record<string, string>
  p: Palette
  index: number
  footer: string
  section: string
  fields: FieldDef[]
}

export interface LayoutDef {
  id: LayoutId
  name: string
  description: string
  category: LayoutCategory
  defaultTone: Tone
  tones: Tone[]
  fields: FieldDef[]
  sample: Record<string, string>
  build: (ctx: BuildCtx) => SlideEl[]
}

const M = BRAND.margin
const CONTENT_W = 1280 - M * 2

type TextStyle = Omit<TextEl, 'type' | 'field' | 'x' | 'y' | 'w' | 'h'>

// 레이아웃 필드 정의에서 placeholder·목록 여부를 가져와 편집 가능한 텍스트 요소를 만듭니다.
function field(ctx: BuildCtx, key: string, x: number, y: number, w: number, h: number, style: TextStyle): TextEl {
  const def = ctx.fields.find((f) => f.key === key)
  return {
    type: 'text',
    field: key,
    x,
    y,
    w,
    h,
    placeholder: def?.placeholder,
    multiline: def ? def.kind !== 'text' : false,
    list: def?.kind === 'bullets' ? 'bullet' : def?.kind === 'numbers' ? 'number' : undefined,
    ...style,
  }
}

function logo(p: Palette, x: number, y: number, w: number): SlideEl {
  return { type: 'image', logo: p.logo, x, y, w, h: w / BRAND.logo.ratio, fill: 'transparent', muted: p.muted }
}

// 본문 슬라이드 공통 요소: 상단 목차(직전 섹션 제목 자동), 우상단 로고, 하단 푸터와 페이지 번호
function chrome(ctx: BuildCtx): SlideEl[] {
  const { p } = ctx
  return [
    { type: 'text', text: ctx.section, x: M, y: 22, w: 900, h: 18, size: 9, bold: true, color: p.muted, letterSpacing: 0.5 },
    logo(p, 1280 - M - 96, 52, 96),
    { type: 'text', text: ctx.footer, x: M, y: 668, w: 760, h: 20, size: 9, color: p.muted },
    {
      type: 'text',
      text: String(ctx.index + 1).padStart(2, '0'),
      x: 1280 - M - 100,
      y: 668,
      w: 100,
      h: 20,
      size: 9,
      bold: true,
      color: p.muted,
      align: 'right',
    },
  ]
}

// 좌상단 제목 블록: 블루 액센트 바 + 제목 + (선택) 리드 문장
function heading(ctx: BuildCtx, opts: { lead?: boolean; w?: number } = {}): SlideEl[] {
  const { p } = ctx
  const w = opts.w ?? 1000
  const els: SlideEl[] = [
    { type: 'rect', x: M, y: 56, w: 28, h: 5, fill: p.accent },
    field(ctx, 'title', M, 76, w, 52, { size: 28, bold: true, color: p.title, lineHeight: 1.25 }),
  ]
  if (opts.lead) els.push(field(ctx, 'lead', M, 136, w, 30, { size: 15, color: p.muted, lineHeight: 1.4 }))
  return els
}

// 표지·마무리 공통 장식: 우측 블루 밴드 + 경계에 걸친 라인 원
function heroDecor(p: Palette): SlideEl[] {
  return [
    { type: 'rect', x: 960, y: 0, w: 320, h: 720, fill: BRAND.colors.blue },
    { type: 'ellipse', x: 800, y: 200, w: 320, h: 320, line: '#FFFFFF', lineWidth: 1.5, opacity: 0.4 },
    { type: 'ellipse', x: 1150, y: 96, w: 36, h: 36, fill: p.accent },
    logo(p, M, 64, 140),
  ]
}

const titleField: FieldDef = { key: 'title', label: '슬라이드 제목', kind: 'text', placeholder: '결론을 말하는 한 문장 제목', max: 40 }
const leadField: FieldDef = { key: 'lead', label: '리드 문장', kind: 'text', placeholder: '제목을 보충하는 한 줄 (선택)', max: 70 }

export const LAYOUTS: LayoutDef[] = [
  {
    id: 'cover',
    name: '표지',
    description: '문서 종류·제목·발표자를 담는 첫 장',
    category: '구성',
    defaultTone: 'navy',
    tones: ['navy', 'light'],
    fields: [
      { key: 'eyebrow', label: '문서 종류', kind: 'text', placeholder: '예: 제안서 · Company Introduction', max: 30 },
      { key: 'title', label: '제목', kind: 'multiline', placeholder: '발표 제목을 입력하세요', max: 40 },
      { key: 'subtitle', label: '부제', kind: 'multiline', placeholder: '대상·목적을 한두 줄로', max: 80 },
      { key: 'presenter', label: '발표자', kind: 'text', placeholder: '팀 · 이름', max: 40 },
      { key: 'date', label: '날짜', kind: 'text', placeholder: '2026.10', max: 20 },
    ],
    sample: {
      eyebrow: 'PROPOSAL',
      title: 'AI 기반 안전 관리\n플랫폼 도입 제안',
      subtitle: 'OO 고객사 맞춤 제안서',
      presenter: '사업개발팀 홍길동',
      date: '2026.10',
    },
    build: (ctx) => {
      const { p } = ctx
      return [
        ...heroDecor(p),
        field(ctx, 'eyebrow', M, 236, 720, 26, { size: 14, bold: true, color: p.accent, letterSpacing: 1 }),
        field(ctx, 'title', M, 272, 760, 150, { size: 40, bold: true, color: p.title, lineHeight: 1.25 }),
        field(ctx, 'subtitle', M, 436, 720, 60, { size: 16, color: p.body, lineHeight: 1.5 }),
        { type: 'line', x: M, y: 600, w: 832, h: 0, color: p.line, width: 1 },
        field(ctx, 'presenter', M, 620, 500, 24, { size: 13, color: p.body }),
        field(ctx, 'date', 596, 620, 300, 24, { size: 13, color: p.muted, align: 'right' }),
      ]
    },
  },
  {
    id: 'agenda',
    name: '목차',
    description: '발표 흐름을 번호 목록으로',
    category: '구성',
    defaultTone: 'light',
    tones: ['light', 'navy'],
    fields: [
      { key: 'title', label: '제목', kind: 'text', placeholder: '목차', max: 12 },
      { key: 'lead', label: '설명', kind: 'multiline', placeholder: '발표 시간·목적 등 (선택)', max: 60 },
      { key: 'items', label: '목차 항목', kind: 'numbers', placeholder: '항목을 한 줄에 하나씩 (최대 6개)', max: 180 },
    ],
    sample: {
      title: '목차',
      lead: '20분 · 도입 검토를 위한 핵심 내용',
      items: '현장의 문제\n솔루션 소개\n도입 효과\n도입 일정과 비용',
    },
    build: (ctx) => {
      const { p } = ctx
      return [
        ...chrome(ctx),
        { type: 'rect', x: M, y: 200, w: 28, h: 5, fill: p.accent },
        field(ctx, 'title', M, 220, 360, 56, { size: 36, bold: true, color: p.title }),
        field(ctx, 'lead', M, 292, 340, 90, { size: 14, color: p.muted, lineHeight: 1.6 }),
        { type: 'line', x: 456, y: 200, w: 0, h: 400, color: p.line, width: 1 },
        field(ctx, 'items', 520, 204, 696, 420, { size: 22, bold: true, color: p.title, lineHeight: 1.3, paraSpace: 22 }),
      ]
    },
  },
  {
    id: 'section',
    name: '섹션 구분',
    description: '챕터가 바뀔 때 쓰는 간지',
    category: '구성',
    defaultTone: 'blue',
    tones: ['blue', 'navy'],
    fields: [
      { key: 'number', label: '번호', kind: 'text', placeholder: '01', max: 4 },
      { key: 'title', label: '섹션 제목', kind: 'text', placeholder: '섹션 제목', max: 24 },
      { key: 'description', label: '설명', kind: 'multiline', placeholder: '이 섹션에서 다룰 내용 (선택)', max: 80 },
    ],
    sample: { number: '01', title: '현장의 문제', description: '밀폐공간 사고는 왜 반복될까요?' },
    build: (ctx) => {
      const { p } = ctx
      return [
        { type: 'ellipse', x: 880, y: 160, w: 400, h: 400, line: '#FFFFFF', lineWidth: 1.5, opacity: 0.3 },
        logo(p, 1280 - M - 96, 52, 96),
        field(ctx, 'number', M, 200, 400, 100, { size: 72, bold: true, color: p.muted }),
        { type: 'rect', x: M, y: 318, w: 48, h: 4, fill: '#FFFFFF' },
        field(ctx, 'title', M, 344, 800, 64, { size: 40, bold: true, color: p.title }),
        field(ctx, 'description', M, 424, 720, 70, { size: 18, color: p.body, lineHeight: 1.5 }),
      ]
    },
  },
  {
    id: 'statement',
    name: '핵심 메시지',
    description: '한 문장으로 강하게 주장할 때',
    category: '본문',
    defaultTone: 'light',
    tones: ['light', 'navy', 'blue'],
    fields: [
      { key: 'eyebrow', label: '라벨', kind: 'text', placeholder: '예: 문제 정의', max: 20 },
      { key: 'statement', label: '핵심 메시지', kind: 'multiline', placeholder: '청중이 기억해야 할 한 문장', max: 60 },
      { key: 'support', label: '보충 설명', kind: 'multiline', placeholder: '근거나 맥락 한두 줄 (선택)', max: 100 },
    ],
    sample: {
      eyebrow: '문제 정의',
      statement: '사고는 예고 없이 오지 않습니다.\n다만 아무도 보고 있지 않을 뿐입니다.',
      support: '현장의 공기질 변화는 사고 수 시간 전부터 나타나지만, 사람이 실시간으로 확인하기는 어렵습니다.',
    },
    build: (ctx) => {
      const { p } = ctx
      return [
        ...chrome(ctx),
        field(ctx, 'eyebrow', M, 210, 600, 26, { size: 14, bold: true, color: p.accent, letterSpacing: 1 }),
        field(ctx, 'statement', M, 250, 1060, 200, { size: 40, bold: true, color: p.title, lineHeight: 1.3 }),
        field(ctx, 'support', M, 476, 900, 80, { size: 18, color: p.muted, lineHeight: 1.6 }),
      ]
    },
  },
  {
    id: 'title-body',
    name: '제목 + 본문',
    description: '가장 기본적인 불릿 설명',
    category: '본문',
    defaultTone: 'light',
    tones: ['light', 'navy'],
    fields: [
      titleField,
      leadField,
      { key: 'body', label: '본문', kind: 'bullets', placeholder: '핵심 내용을 한 줄에 하나씩 (최대 6줄)', max: 300 },
    ],
    sample: {
      title: '현장 관리자는 매일 같은 문제를 겪습니다',
      lead: '고객 인터뷰 12건에서 반복된 이야기',
      body: '측정기는 있지만, 기록은 수기로 남깁니다\n위험 수치를 놓쳐도 즉시 알 방법이 없습니다\n작업자 교대 시 상황 공유가 끊깁니다\n사고 이후에야 원인을 역추적합니다',
    },
    build: (ctx) => {
      const { p } = ctx
      return [
        ...chrome(ctx),
        ...heading(ctx, { lead: true }),
        field(ctx, 'body', M, 204, CONTENT_W, 440, { size: 18, color: p.body, lineHeight: 1.45, paraSpace: 12 }),
      ]
    },
  },
  {
    id: 'two-column',
    name: '2단 비교',
    description: 'Before/After, 문제/해결 비교',
    category: '본문',
    defaultTone: 'light',
    tones: ['light', 'navy'],
    fields: [
      titleField,
      leadField,
      { key: 'leftTitle', label: '왼쪽 제목', kind: 'text', placeholder: '예: 지금', max: 20 },
      { key: 'leftBody', label: '왼쪽 내용', kind: 'bullets', placeholder: '한 줄에 하나씩 (최대 5줄)', max: 180 },
      { key: 'rightTitle', label: '오른쪽 제목', kind: 'text', placeholder: '예: 도입 후', max: 20 },
      { key: 'rightBody', label: '오른쪽 내용', kind: 'bullets', placeholder: '한 줄에 하나씩 (최대 5줄)', max: 180 },
    ],
    sample: {
      title: '수기 점검에서 실시간 예측으로',
      leftTitle: '지금',
      leftBody: '하루 2회 수기 측정\n이상 발생 후 보고\n현장별 기록 방식이 제각각',
      rightTitle: '도입 후',
      rightBody: '24시간 자동 측정\n위험 30분 전 사전 알림\n전 현장 데이터 한 화면에서 관리',
    },
    build: (ctx) => {
      const { p } = ctx
      const colW = (CONTENT_W - 48) / 2
      const col = (x: number, t: string, b: string, accent: string): SlideEl[] => [
        { type: 'rect', x, y: 196, w: colW, h: 444, fill: p.accentSoft, radius: 12 },
        field(ctx, t, x + 36, 228, colW - 72, 32, { size: 20, bold: true, color: accent }),
        { type: 'line', x: x + 36, y: 276, w: colW - 72, h: 0, color: p.line, width: 1 },
        field(ctx, b, x + 36, 298, colW - 72, 316, { size: 16, color: p.body, lineHeight: 1.5, paraSpace: 10 }),
      ]
      return [
        ...chrome(ctx),
        ...heading(ctx, { lead: true }),
        ...col(M, 'leftTitle', 'leftBody', p.muted),
        ...col(M + colW + 48, 'rightTitle', 'rightBody', p.accent),
      ]
    },
  },
  {
    id: 'three-cards',
    name: '3개 핵심 포인트',
    description: '기능·장점·전략을 3개로 정리',
    category: '본문',
    defaultTone: 'light',
    tones: ['light', 'navy'],
    fields: [
      titleField,
      leadField,
      ...[1, 2, 3].flatMap<FieldDef>((n) => [
        { key: `c${n}Title`, label: `카드 ${n} 제목`, kind: 'multiline', placeholder: `포인트 ${n}`, max: 24 },
        { key: `c${n}Body`, label: `카드 ${n} 설명`, kind: 'multiline', placeholder: '두세 줄로 설명', max: 90 },
      ]),
    ],
    sample: {
      title: '세 가지로 현장을 바꿉니다',
      c1Title: '실시간 감지',
      c1Body: '센서와 영상으로 공기질과 작업자 상태를 24시간 확인합니다.',
      c2Title: '위험 예측',
      c2Body: 'AI가 수치 변화 패턴을 학습해 위험을 미리 알려줍니다.',
      c3Title: '통합 관제',
      c3Body: '모든 현장의 상태를 한 화면에서 보고 바로 조치합니다.',
    },
    build: (ctx) => {
      const { p } = ctx
      const cardW = (CONTENT_W - 48) / 3
      return [
        ...chrome(ctx),
        ...heading(ctx, { lead: true }),
        ...[0, 1, 2].flatMap<SlideEl>((i) => {
          const x = M + i * (cardW + 24)
          return [
            { type: 'rect', x, y: 196, w: cardW, h: 444, fill: p.accentSoft, radius: 12 },
            { type: 'rect', x: x + 32, y: 228, w: 28, h: 4, fill: p.accent },
            { type: 'text', text: String(i + 1).padStart(2, '0'), x: x + 32, y: 244, w: 100, h: 24, size: 14, bold: true, color: p.accent },
            field(ctx, `c${i + 1}Title`, x + 32, 280, cardW - 64, 64, { size: 22, bold: true, color: p.title, lineHeight: 1.3 }),
            field(ctx, `c${i + 1}Body`, x + 32, 364, cardW - 64, 250, { size: 15, color: p.body, lineHeight: 1.6 }),
          ]
        }),
      ]
    },
  },
  {
    id: 'kpi',
    name: '핵심 지표',
    description: '숫자 3개로 성과를 보여줄 때',
    category: '데이터',
    defaultTone: 'light',
    tones: ['light', 'navy', 'blue'],
    fields: [
      titleField,
      leadField,
      ...[1, 2, 3].flatMap<FieldDef>((n) => [
        { key: `k${n}Value`, label: `지표 ${n} 숫자`, kind: 'text', placeholder: '00%', max: 8 },
        { key: `k${n}Label`, label: `지표 ${n} 설명`, kind: 'multiline', placeholder: '무엇이 얼마나 변했는지', max: 40 },
      ]),
      { key: 'note', label: '출처·주석', kind: 'text', placeholder: '출처: 데이터 기준일·조사 대상 (선택)', max: 80 },
    ],
    sample: {
      title: '도입 현장에서 확인된 변화',
      k1Value: '92%',
      k1Label: '위험 상황\n사전 감지율',
      k2Value: '30분',
      k2Label: '평균 조기 경보\n확보 시간',
      k3Value: '0건',
      k3Label: '도입 후\n중대 사고',
      note: '※ 예시 수치입니다. 실제 데이터와 출처로 바꿔주세요.',
    },
    build: (ctx) => {
      const { p } = ctx
      const colW = CONTENT_W / 3
      return [
        ...chrome(ctx),
        ...heading(ctx, { lead: true }),
        ...[0, 1, 2].flatMap<SlideEl>((i) => {
          const x = M + i * colW + (i === 0 ? 0 : 40)
          const els: SlideEl[] = [
            { type: 'rect', x, y: 236, w: 40, h: 4, fill: p.accent },
            field(ctx, `k${i + 1}Value`, x, 256, colW - 56, 96, { size: 60, bold: true, color: p.accent }),
            field(ctx, `k${i + 1}Label`, x, 368, colW - 72, 80, { size: 17, color: p.body, lineHeight: 1.5 }),
          ]
          if (i > 0) els.unshift({ type: 'line', x: M + i * colW, y: 236, w: 0, h: 212, color: p.line, width: 1 })
          return els
        }),
        field(ctx, 'note', M, 612, CONTENT_W, 22, { size: 11, color: p.muted }),
      ]
    },
  },
  {
    id: 'image-text',
    name: '이미지 + 설명',
    description: '제품 화면·현장 사진과 설명',
    category: '본문',
    defaultTone: 'light',
    tones: ['light', 'navy'],
    fields: [
      titleField,
      leadField,
      { key: 'body', label: '설명', kind: 'bullets', placeholder: '이미지에서 봐야 할 포인트 (최대 5줄)', max: 200 },
      { key: 'image', label: '이미지', kind: 'image', placeholder: '이미지 업로드' },
    ],
    sample: {
      title: '한 화면에서 모든 현장을',
      lead: '통합 관제 대시보드',
      body: '현장별 위험도를 색으로 구분\n임계치 도달 시 담당자에게 즉시 알림\n시간대별 추이와 조치 이력 기록',
    },
    build: (ctx) => {
      const { p } = ctx
      return [
        ...chrome(ctx),
        ...heading(ctx, { lead: true, w: 540 }),
        field(ctx, 'body', M, 212, 540, 420, { size: 17, color: p.body, lineHeight: 1.5, paraSpace: 12 }),
        { type: 'image', field: 'image', x: 656, y: 96, w: 560, h: 540, fill: p.accentSoft, muted: p.muted },
      ]
    },
  },
  {
    id: 'timeline',
    name: '로드맵',
    description: '4단계 일정·연혁·도입 절차',
    category: '데이터',
    defaultTone: 'light',
    tones: ['light', 'navy'],
    fields: [
      titleField,
      leadField,
      ...[1, 2, 3, 4].flatMap<FieldDef>((n) => [
        { key: `s${n}Period`, label: `단계 ${n} 시기`, kind: 'text', placeholder: `STEP ${n}`, max: 14 },
        { key: `s${n}Body`, label: `단계 ${n} 내용`, kind: 'multiline', placeholder: '이 단계에서 하는 일', max: 70 },
      ]),
    ],
    sample: {
      title: '6주 안에 현장 적용을 마칩니다',
      s1Period: '1주차',
      s1Body: '현장 실사와\n센서 설치 위치 확정',
      s2Period: '2–3주차',
      s2Body: '장비 설치와\n네트워크 연동',
      s3Period: '4–5주차',
      s3Body: '시범 운영과\n알림 기준 조정',
      s4Period: '6주차',
      s4Body: '정식 운영 전환\n관리자 교육',
    },
    build: (ctx) => {
      const { p } = ctx
      const stepW = CONTENT_W / 4
      return [
        ...chrome(ctx),
        ...heading(ctx, { lead: true }),
        { type: 'line', x: M, y: 300, w: CONTENT_W, h: 0, color: p.line, width: 2 },
        ...[0, 1, 2, 3].flatMap<SlideEl>((i) => {
          const x = M + i * stepW
          return [
            { type: 'ellipse', x, y: 290, w: 20, h: 20, fill: p.accent },
            field(ctx, `s${i + 1}Period`, x, 330, stepW - 24, 32, { size: 20, bold: true, color: p.accent }),
            field(ctx, `s${i + 1}Body`, x, 374, stepW - 32, 220, { size: 15, color: p.body, lineHeight: 1.6 }),
          ]
        }),
      ]
    },
  },
  {
    id: 'quote',
    name: '인용·고객 후기',
    description: '고객의 목소리로 신뢰를 더할 때',
    category: '데이터',
    defaultTone: 'light',
    tones: ['light', 'navy', 'blue'],
    fields: [
      { key: 'quote', label: '인용문', kind: 'multiline', placeholder: '고객이 실제로 한 말을 그대로', max: 90 },
      { key: 'author', label: '이름', kind: 'text', placeholder: '이름 · 직함', max: 30 },
      { key: 'role', label: '소속', kind: 'text', placeholder: '회사·기관명', max: 40 },
    ],
    sample: {
      quote: '이제 현장에 직접 가지 않아도\n어디가 위험한지 먼저 알 수 있습니다.',
      author: '김OO 팀장',
      role: 'OO건설 안전관리팀',
    },
    build: (ctx) => {
      const { p } = ctx
      return [
        ...chrome(ctx),
        { type: 'text', text: '“', x: M + 24, y: 120, w: 120, h: 110, size: 110, bold: true, color: p.accent, lineHeight: 1 },
        field(ctx, 'quote', M + 32, 240, 1040, 220, { size: 30, bold: true, color: p.title, lineHeight: 1.45 }),
        { type: 'rect', x: M + 32, y: 490, w: 28, h: 3, fill: p.accent },
        field(ctx, 'author', M + 32, 508, 600, 28, { size: 17, bold: true, color: p.title }),
        field(ctx, 'role', M + 32, 542, 600, 24, { size: 13, color: p.muted }),
      ]
    },
  },
  {
    id: 'closing',
    name: '마무리·연락처',
    description: '감사 인사와 연락처',
    category: '마무리',
    defaultTone: 'navy',
    tones: ['navy', 'light'],
    fields: [
      { key: 'title', label: '인사말', kind: 'text', placeholder: 'Thank you', max: 20 },
      { key: 'message', label: '메시지', kind: 'multiline', placeholder: '다음 단계 제안이나 한 줄 메시지', max: 80 },
      { key: 'contact', label: '연락처', kind: 'multiline', placeholder: '담당자 이름 · 이메일 · 전화번호', max: 120 },
    ],
    sample: {
      title: 'Thank you',
      message: '현장 실사부터 함께하겠습니다.',
      contact: '홍길동 매니저 · 사업개발팀\nname@alcherainc.com · 02-000-0000',
    },
    build: (ctx) => {
      const { p } = ctx
      return [
        ...heroDecor(p),
        field(ctx, 'title', M, 236, 760, 90, { size: 54, bold: true, color: p.title }),
        field(ctx, 'message', M, 340, 760, 64, { size: 18, color: p.body, lineHeight: 1.5 }),
        { type: 'line', x: M, y: 480, w: 832, h: 0, color: p.line, width: 1 },
        field(ctx, 'contact', M, 504, 760, 110, { size: 14, color: p.body, lineHeight: 1.7 }),
      ]
    },
  },
]

export const LAYOUT_MAP = Object.fromEntries(LAYOUTS.map((l) => [l.id, l])) as Record<LayoutId, LayoutDef>

export const LAYOUT_CATEGORIES: LayoutCategory[] = ['구성', '본문', '데이터', '마무리']

export function buildSlide(slide: Slide, index: number, footer: string, section = ''): SlideEl[] {
  const layout = LAYOUT_MAP[slide.layout]
  return layout.build({ c: slide.content, p: TONES[slideTone(slide)], index, footer, section, fields: layout.fields })
}

// 상단 목차: 이 슬라이드 앞에 있는 가장 가까운 섹션 슬라이드의 제목
export function sectionFor(slides: Slide[], index: number): string {
  for (let i = index; i >= 0; i--) {
    const s = slides[i]
    if (s.layout === 'section') {
      const n = (s.content.number ?? '').trim()
      const t = (s.content.title ?? '').trim()
      return [n, t].filter(Boolean).join('  ')
    }
  }
  return ''
}

export function slideTone(slide: Slide): Tone {
  const layout = LAYOUT_MAP[slide.layout]
  return layout.tones.includes(slide.tone) ? slide.tone : layout.defaultTone
}

export interface SlideIssue {
  field: string
  label: string
  kind: 'empty' | 'long'
}

// 가이드 체크: 비어 있는 칸과 권장 글자 수를 넘은 칸을 찾습니다.
// 선택 항목(placeholder에 '(선택)')은 비어 있어도 문제 삼지 않습니다.
export function checkSlide(slide: Slide): SlideIssue[] {
  const layout = LAYOUT_MAP[slide.layout]
  const issues: SlideIssue[] = []
  for (const f of layout.fields) {
    const v = (slide.content[f.key] ?? '').trim()
    if (!v) {
      if (!f.placeholder.includes('(선택)')) issues.push({ field: f.key, label: f.label, kind: 'empty' })
    } else if (f.max && v.length > f.max) {
      issues.push({ field: f.key, label: f.label, kind: 'long' })
    }
  }
  return issues
}
