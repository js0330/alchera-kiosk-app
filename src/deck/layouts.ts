import { BRAND, TONES, type Palette, type Tone } from './guide'
import type { FieldDef, ImageEl, LayoutId, ShapeEl, Slide, SlideEl, TextEl } from './types'

// 좌표는 모두 가이드 원본(ALCHERA_PPT_Template_ver.260507)에서 측정한 값입니다. (1280×720 = 10×5.625in)

export type LayoutCategory = '표지·구성' | '라인형' | '타이틀형' | '자유 배치'

export interface BuildCtx {
  c: Record<string, string>
  p: Palette
  index: number
  section: string
  fields: FieldDef[]
}

export interface LayoutDef {
  id: LayoutId
  name: string
  description: string
  category: LayoutCategory
  tone: Tone
  fields: FieldDef[]
  sample: Record<string, string>
  build: (ctx: BuildCtx) => SlideEl[]
}

const C = BRAND.colors

// 가이드 텍스트 스타일 (pt)
const S = {
  contentTitle: { size: 12, bold: true, color: C.navy, lineHeight: 1.2 },
  contentSub: { size: 10, bold: true, color: C.navy, lineHeight: 1.3 },
  body: { size: 10, color: C.navy, lineHeight: 1.3, paraSpace: 2 },
  note: { size: 8, color: C.gray, lineHeight: 1.3 },
} as const

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
    rich: def?.kind === 'bullets',
    list: def?.kind === 'bullets' ? 'bullet' : def?.kind === 'numbers' ? 'number' : undefined,
    ...style,
  }
}

function logo(p: Palette, x: number, y: number, w: number): SlideEl {
  return { type: 'image', logo: p.logo, x, y, w, h: w / BRAND.logo.ratio, fill: 'transparent', muted: '' }
}

function image(key: string, x: number, y: number, w: number, h: number): ImageEl {
  return { type: 'image', field: key, x, y, w, h, fill: C.imageFill, muted: C.gray, radius: Math.min(16, h * 0.043) }
}

// 본문 슬라이드 상단: 상단 목차 · 슬라이드 타이틀 · 파란 바 + 슬라이드 서브 · 로고 · 페이지 번호
function chrome(ctx: BuildCtx): SlideEl[] {
  return [
    { type: 'text', text: ctx.section, x: 49.5, y: 30, w: 750, h: 18, size: 9, color: C.crumb },
    field(ctx, 'title', 49.5, 60.6, 1080, 41, { size: 19, bold: true, color: C.navy, lineHeight: 1.2 }),
    { type: 'rect', x: 50, y: 112.4, w: 4, h: 18.1, fill: C.blue },
    field(ctx, 'sub', 66, 111, 1076, 22, { size: 11, color: C.blue, lineHeight: 1.1 }),
    logo(ctx.p, 1142.6, 49, 87.7),
    { type: 'text', text: String(ctx.index + 1), x: 1150, y: 686, w: 80, h: 18, size: 8, color: C.pageNum, align: 'right' },
  ]
}

// 라인형 패널: 흰 바탕 + 회색 테두리 + 위쪽 파란 선
function linePanel(x: number, y: number, w: number, h: number): ShapeEl {
  return { type: 'rect', x, y, w, h, fill: C.white, line: C.line, lineWidth: 0.75, radius: Math.min(13, Math.min(w, h) * 0.03), shadow: 'accent' }
}

// 타이틀형 패널: 파란 헤더 바 + 흰 본문 박스
function headerPanel(ctx: BuildCtx, key: string, x: number, w: number): SlideEl[] {
  return [
    { type: 'rect', x, y: 188, w, h: 504, fill: C.white, line: C.line, lineWidth: 0.75, radius: 12, shadow: 'soft' },
    { type: 'rect', x, y: 160.3, w, h: 53.4, fill: C.blue, radius: 12, topOnly: true },
    field(ctx, key, x + 20, 174, w - 40, 26, { size: 12, bold: true, color: C.white, align: 'center', lineHeight: 1.2 }),
  ]
}

const titleFields: FieldDef[] = [
  { key: 'title', label: '슬라이드 타이틀', kind: 'text', placeholder: '슬라이드 타이틀 (결론을 한 문장으로)', max: 40 },
  { key: 'sub', label: '슬라이드 서브', kind: 'text', placeholder: '슬라이드 서브 — 한 줄로 요약', max: 70 },
]

const f = {
  title: (key: string, label = '콘텐츠 타이틀'): FieldDef => ({ key, label, kind: 'multiline', placeholder: '콘텐츠 타이틀 (두 줄까지)', max: 40 }),
  head: (key: string, label = '헤더 타이틀'): FieldDef => ({ key, label, kind: 'text', placeholder: '콘텐츠 타이틀', max: 30 }),
  sub: (key: string, label = '콘텐츠 서브'): FieldDef => ({ key, label, kind: 'multiline', placeholder: '콘텐츠 서브 (두 줄까지)', max: 60 }),
  body: (key: string, label = '본문', max = 260): FieldDef => ({
    key,
    label,
    kind: 'bullets',
    placeholder: '본문을 한 줄에 하나씩. 강조할 단어는 Ctrl+B',
    max,
  }),
  note: (key: string, label = '안내문'): FieldDef => ({ key, label, kind: 'text', placeholder: '※ 안내문·출처 (선택)', max: 80 }),
  image: (key: string, label = '이미지'): FieldDef => ({ key, label, kind: 'image', placeholder: '이미지' }),
  caption: (key: string, label = '이미지 안내 문구'): FieldDef => ({ key, label, kind: 'text', placeholder: '이미지 안내 문구 (선택)', max: 50 }),
}

const n3 = [1, 2, 3] as const

// 자유 배치 슬라이드에서 요소가 놓이는 본문 영역 (가이드 패널 영역과 같음)
export const FREE_AREA = { x: 50, y: 150, w: 1179.5, h: 542 } as const

export const LAYOUTS: LayoutDef[] = [
  {
    id: 'cover',
    name: '표지',
    description: '타이틀 36pt 두 줄 + 서브타이틀 14pt',
    category: '표지·구성',
    tone: 'cover',
    fields: [
      { key: 'title', label: '표지 타이틀', kind: 'multiline', placeholder: '발표 제목 (두 줄까지)', max: 36 },
      { key: 'subtitle', label: '서브타이틀', kind: 'multiline', placeholder: '서브타이틀 — 대상·목적', max: 80 },
    ],
    sample: { title: 'ALCHERA Face Trust\n출입통제 솔루션', subtitle: '공공 · 공공 · 대기업 현장에서 검증된 Face AI 기반 출입통제 서비스' },
    build: (ctx) => [
      field(ctx, 'title', 76.8, 191, 1115, 155, { size: 36, bold: true, color: C.white, lineHeight: 1.2 }),
      { type: 'rect', x: 76.8, y: 367.2, w: 75.6, h: 4.8, fill: C.white },
      field(ctx, 'subtitle', 76.8, 417.5, 1000, 72, { size: 14, color: C.white, lineHeight: 1.4 }),
      logo(ctx.p, 1073.3, 628.3, 133.7),
    ],
  },
  {
    id: 'contents',
    name: '목차',
    description: 'CONTENTS 27pt + 항목 16pt 두 줄 간격',
    category: '표지·구성',
    tone: 'navy',
    fields: [
      { key: 'title', label: '제목', kind: 'text', placeholder: 'CONTENTS', max: 20 },
      { key: 'items', label: '목차 항목', kind: 'numbers', placeholder: '목차를 한 줄에 하나씩 (최대 6개)', max: 160 },
    ],
    sample: { title: 'CONTENTS', items: '회사 소개\n문제 제기\n제품 소개\n작동 원리\n도입 효과' },
    build: (ctx) => [
      logo(ctx.p, 1142.7, 49, 87.5),
      field(ctx, 'title', 144, 84, 800, 60, { size: 27, bold: true, color: C.white }),
      field(ctx, 'items', 155, 209, 700, 440, { size: 16, bold: true, color: C.white, lineHeight: 2 }),
    ],
  },
  {
    id: 'section',
    name: '간지',
    description: '섹션이 바뀔 때. 이후 슬라이드 상단 목차에 자동 표시',
    category: '표지·구성',
    tone: 'navy',
    fields: [
      { key: 'title', label: '섹션 타이틀', kind: 'text', placeholder: '섹션 타이틀', max: 30 },
      { key: 'description', label: '설명', kind: 'text', placeholder: '이 섹션에서 다룰 내용 (선택)', max: 60 },
    ],
    sample: { title: '제품 소개', description: '기존 CCTV와 환경센서로 공간의 위험을 먼저 판단합니다' },
    build: (ctx) => [
      logo(ctx.p, 1142.7, 49, 87.5),
      field(ctx, 'title', 140, 278, 1000, 60, { size: 27, bold: true, color: C.white, align: 'center' }),
      field(ctx, 'description', 140, 403, 1000, 36, { size: 16, bold: true, color: C.white, align: 'center' }),
    ],
  },
  {
    id: 'line-1',
    name: '라인형 1단',
    description: '텍스트 + 큰 이미지 (높이 7.6cm)',
    category: '라인형',
    tone: 'light',
    fields: [...titleFields, f.title('cTitle'), f.sub('cSub'), f.body('body'), f.note('note'), f.image('image'), f.caption('caption')],
    sample: {
      title: '현장 데이터를 AI 자산으로, AI를 현장의 성과로 전환하는 알체라',
      sub: '데이터 설계부터 전용 AI 엔진까지, 현장 문제 해결의 모든 단계를 책임집니다',
      cTitle: '검증된 Vision AI 기술을 공간 안전으로 확장',
      cSub: '얼굴인식 · Liveness · 이상행동 탐지 기술 내재화',
      body: '• **공공 · 금융 · 대기업** 현장 1,000곳 이상 적용\n• 기존 CCTV 그대로 활용, 추가 장비 최소화\n• 현장별 맞춤 학습으로 오탐 감소',
      note: '※ 예시 문구입니다. 실제 수치와 출처로 바꿔주세요.',
      caption: '통합 관제 대시보드 화면',
    },
    build: (ctx) => [
      ...chrome(ctx),
      linePanel(50, 164.1, 1179.5, 528),
      field(ctx, 'cTitle', 75.6, 199, 1128, 52, { ...S.contentTitle }),
      field(ctx, 'cSub', 75.6, 262, 560, 46, { ...S.contentSub }),
      field(ctx, 'body', 75.6, 318, 560, 290, { ...S.body }),
      field(ctx, 'note', 75.6, 640, 560, 22, { ...S.note }),
      image('image', 665, 251, 541, 383),
      field(ctx, 'caption', 665, 642, 541, 20, { ...S.note, align: 'center' }),
    ],
  },
  {
    id: 'line-text',
    name: '라인형 1단 · 텍스트',
    description: '이미지 없이 글로만 채우는 넓은 패널',
    category: '라인형',
    tone: 'light',
    fields: [...titleFields, f.title('cTitle'), f.sub('cSub'), f.body('body', '본문', 500), f.note('note')],
    sample: {
      title: '도입 6주 만에 현장 운영을 시작합니다',
      sub: '현장 실사부터 정식 운영 전환까지 단계별로 함께합니다',
      cTitle: '도입 절차',
      cSub: '기존 CCTV와 환경센서를 그대로 활용해 설치 부담을 줄입니다',
      body: '• **1주차** 현장 실사와 센서 설치 위치 확정\n• **2–3주차** AI Box 설치와 기존 설비 연동\n• **4–5주차** 시범 운영과 알림 기준 조정\n• **6주차** 정식 운영 전환과 관리자 교육',
      note: '※ 현장 규모에 따라 일정은 달라질 수 있습니다.',
    },
    build: (ctx) => [
      ...chrome(ctx),
      linePanel(50, 164.1, 1179.5, 528),
      field(ctx, 'cTitle', 75.6, 199, 1128, 52, { ...S.contentTitle }),
      field(ctx, 'cSub', 75.6, 262, 1128, 46, { ...S.contentSub }),
      field(ctx, 'body', 75.6, 318, 1128, 300, { ...S.body }),
      field(ctx, 'note', 75.6, 640, 1128, 22, { ...S.note }),
    ],
  },
  {
    id: 'line-2',
    name: '라인형 2단',
    description: '왼쪽 설명 · 오른쪽 설명 + 이미지 (4.5cm)',
    category: '라인형',
    tone: 'light',
    fields: [
      ...titleFields,
      f.title('lTitle', '왼쪽 타이틀'),
      f.sub('lSub', '왼쪽 서브'),
      f.body('lBody', '왼쪽 본문', 220),
      f.note('lNote', '왼쪽 안내문'),
      f.title('rTitle', '오른쪽 타이틀'),
      f.body('rBody', '오른쪽 본문', 160),
      f.image('rImage', '오른쪽 이미지'),
      f.caption('rCaption'),
    ],
    sample: {
      title: '사후 대응 중심의 구조에서 사전 예측으로',
      sub: '문제가 생긴 뒤 알게 되는 구조를, 위험 신호를 먼저 보는 구조로 바꿉니다',
      lTitle: '지금 현장',
      lSub: '하루 2회 수기 점검,\n이상 발생 후 보고',
      lBody: '• 측정기는 있지만 **기록은 수기**로 남깁니다\n• 위험 수치를 놓쳐도 즉시 알 방법이 없습니다\n• 사고 이후에야 원인을 역추적합니다',
      rTitle: '도입 후',
      rBody: '• **24시간 자동 측정**과 위험 30분 전 사전 알림\n• 전 현장 데이터를 한 화면에서 관리',
      rCaption: '현장 설치 예시',
    },
    build: (ctx) => {
      const col = (x: number) => x + 25.6
      const w = 526
      return [
        ...chrome(ctx),
        linePanel(50.2, 164.1, 577.5, 528),
        linePanel(651.9, 164.1, 577.5, 528),
        field(ctx, 'lTitle', col(50.2), 199, w, 52, { ...S.contentTitle, align: 'center' }),
        field(ctx, 'lSub', col(50.2), 262, w, 46, { ...S.contentSub }),
        field(ctx, 'lBody', col(50.2), 318, w, 300, { ...S.body }),
        field(ctx, 'lNote', col(50.2), 640, w, 22, { ...S.note }),
        field(ctx, 'rTitle', col(651.9), 199, w, 52, { ...S.contentTitle, align: 'center' }),
        field(ctx, 'rBody', col(651.9), 262, w, 120, { ...S.body }),
        image('rImage', col(651.9), 394, w, 226),
        field(ctx, 'rCaption', col(651.9), 630, w, 20, { ...S.note, align: 'center' }),
      ]
    },
  },
  {
    id: 'line-2t',
    name: '라인형 2단 · 텍스트',
    description: '두 가지를 글로 비교 (이미지 없음)',
    category: '라인형',
    tone: 'light',
    fields: [
      ...titleFields,
      ...(['l', 'r'] as const).flatMap((k) => {
        const side = k === 'l' ? '왼쪽' : '오른쪽'
        return [f.title(`${k}Title`, `${side} 타이틀`), f.sub(`${k}Sub`, `${side} 서브`), f.body(`${k}Body`, `${side} 본문`, 260), f.note(`${k}Note`, `${side} 안내문`)]
      }),
    ],
    sample: {
      title: '수기 점검에서 실시간 예측으로',
      sub: '같은 현장, 다른 운영 방식',
      lTitle: '지금',
      lSub: '하루 2회 수기 점검',
      lBody: '• 이상 발생 후 보고\n• 현장별 기록 방식이 제각각\n• 사고 이후에야 원인 추적',
      rTitle: '도입 후',
      rSub: '24시간 자동 측정',
      rBody: '• 위험 **30분 전** 사전 알림\n• 전 현장 데이터를 한 화면에서\n• 판단 근거 자동 기록',
    },
    build: (ctx) => {
      const w = 526
      return [
        ...chrome(ctx),
        linePanel(50.2, 164.1, 577.5, 528),
        linePanel(651.9, 164.1, 577.5, 528),
        ...[50.2, 651.9].flatMap<SlideEl>((x, i) => {
          const k = i === 0 ? 'l' : 'r'
          const cx = x + 25.6
          return [
            field(ctx, `${k}Title`, cx, 199, w, 52, { ...S.contentTitle, align: 'center' }),
            field(ctx, `${k}Sub`, cx, 262, w, 46, { ...S.contentSub }),
            field(ctx, `${k}Body`, cx, 318, w, 300, { ...S.body }),
            field(ctx, `${k}Note`, cx, 640, w, 22, { ...S.note }),
          ]
        }),
      ]
    },
  },
  {
    id: 'line-3',
    name: '라인형 3단',
    description: '세 가지 항목을 나란히',
    category: '라인형',
    tone: 'light',
    fields: [
      ...titleFields,
      ...n3.flatMap((n) => [f.title(`c${n}Title`, `${n}단 타이틀`), f.sub(`c${n}Sub`, `${n}단 서브`), f.body(`c${n}Body`, `${n}단 본문`, 160), f.note(`c${n}Note`, `${n}단 안내문`)]),
    ],
    sample: {
      title: '데이터 설계부터 전용 AI 엔진까지, 모든 단계를 책임지는 알체라',
      sub: '고객의 AI 도입 리스크를 줄이고 현장에 바로 쓰이는 결과를 만듭니다',
      c1Title: 'AI DATA',
      c1Sub: '목적에 맞는 데이터 설계',
      c1Body: '• 고객 문제를 정의하고\n  데이터 수집 계획 수립\n• 품질 검수 7종 자동화',
      c2Title: 'AI Solution',
      c2Sub: '검증된 Vision AI 엔진',
      c2Body: '• 얼굴인식 · Liveness\n• 이상행동 · 위험 예측\n• 현장 맞춤 학습',
      c3Title: 'AI Foundry',
      c3Sub: '고객 전용 모델 구축',
      c3Body: '• 기획 · 설계 · 운영까지\n• 도입 후 성능 개선 지원',
    },
    build: (ctx) => {
      const xs = [50.2, 451.9, 853.5]
      const w = 326
      return [
        ...chrome(ctx),
        ...xs.map((x) => linePanel(x, 164.1, 375.9, 528)),
        ...xs.flatMap<SlideEl>((x, i) => {
          const n = i + 1
          const cx = x + 25
          return [
            field(ctx, `c${n}Title`, cx, 199, w, 52, { ...S.contentTitle, align: 'center' }),
            field(ctx, `c${n}Sub`, cx, 262, w, 46, { ...S.contentSub, align: 'center' }),
            field(ctx, `c${n}Body`, cx, 326, w, 290, { ...S.body }),
            field(ctx, `c${n}Note`, cx, 640, w, 22, { ...S.note }),
          ]
        }),
      ]
    },
  },
  {
    id: 'line-grid',
    name: '라인형 4분할',
    description: '2×2 카드로 네 가지 항목',
    category: '라인형',
    tone: 'light',
    fields: [
      ...titleFields,
      ...[1, 2, 3, 4].flatMap((n) => [f.sub(`g${n}Sub`, `${n}번 서브`), f.body(`g${n}Body`, `${n}번 본문`, 140), f.note(`g${n}Note`, `${n}번 안내문`)]),
    ],
    sample: {
      title: '검증된 Face Trust AI 출입통제 역량',
      sub: '공공 · 금융 · 대기업 현장에서 검증된 구축 · 운영 경험을 제공합니다',
      g1Sub: '1:N Walk-through 출입',
      g1Body: '• 멈추지 않고 걸으며 **1초 이내** 인증\n• 대규모 출입 현장 적용',
      g2Sub: '방문자 · 협력사 키오스크',
      g2Body: '• 신분증 + 얼굴 1:1 인증\n• 출입증 자동 발급',
      g3Sub: '내부 통제용 안면인증',
      g3Body: '• 업무 PC · 보안 구역 접근 통제\n• Liveness로 사진 · 영상 도용 차단',
      g4Sub: '통합 관리 서버',
      g4Body: '• 출입 이력 · 권한을 한 화면에서\n• 기존 출입 시스템과 연동',
    },
    build: (ctx) => {
      const pos = [
        [50.2, 164.1],
        [651.2, 164.1],
        [50.2, 440.2],
        [651.2, 440.2],
      ] as const
      const w = 527
      return [
        ...chrome(ctx),
        ...pos.map(([x, y]) => linePanel(x, y, 578.6, 252)),
        ...pos.flatMap<SlideEl>(([x, y], i) => {
          const n = i + 1
          return [
            field(ctx, `g${n}Sub`, x + 25.6, y + 22, w, 46, { ...S.contentSub }),
            field(ctx, `g${n}Body`, x + 25.6, y + 76, w, 132, { ...S.body }),
            field(ctx, `g${n}Note`, x + 25.6, y + 214, w, 20, { ...S.note }),
          ]
        }),
      ]
    },
  },
  {
    id: 'header-1',
    name: '타이틀형 1단',
    description: '파란 헤더 + 텍스트 + 큰 이미지',
    category: '타이틀형',
    tone: 'light',
    fields: [...titleFields, f.head('head'), f.sub('cSub'), f.body('body'), f.note('note'), f.image('image'), f.caption('caption')],
    sample: {
      title: '멀티모달 공기질 상태판단',
      sub: '센서 시계열과 CCTV 영상을 함께 분석해 실시간으로 위험을 판단합니다',
      head: '멀티모달 안전 예측 AI',
      cSub: 'CCTV 영상 + 환경센서 데이터를\n하나의 판단으로 통합',
      body: '• CO · 메탄 · VOC 등 **8종 센서** 실시간 분석\n• 영상 속 작업자 상태와 환기 상황 동시 인식\n• 위험 단계별 자동 알림과 조치 기록',
      note: '※ 예시 문구입니다.',
      caption: 'AI Box 연동 구성도',
    },
    build: (ctx) => [
      ...chrome(ctx),
      ...headerPanel(ctx, 'head', 50, 1179.5),
      field(ctx, 'cSub', 75.6, 248, 570, 46, { ...S.contentSub }),
      field(ctx, 'body', 75.6, 304, 570, 300, { ...S.body }),
      field(ctx, 'note', 75.6, 640, 570, 22, { ...S.note }),
      image('image', 665, 246.6, 547.6, 383),
      field(ctx, 'caption', 665, 640, 547.6, 20, { ...S.note, align: 'center' }),
    ],
  },
  {
    id: 'header-2',
    name: '타이틀형 2단',
    description: '헤더 2개: 설명 · 설명 + 이미지',
    category: '타이틀형',
    tone: 'light',
    fields: [
      ...titleFields,
      f.head('lHead', '왼쪽 헤더'),
      f.sub('lSub', '왼쪽 서브'),
      f.body('lBody', '왼쪽 본문', 220),
      f.note('lNote', '왼쪽 안내문'),
      f.head('rHead', '오른쪽 헤더'),
      f.body('rBody', '오른쪽 본문', 160),
      f.image('rImage', '오른쪽 이미지'),
      f.caption('rCaption'),
    ],
    sample: {
      title: '예측 기반 환기 스케줄링',
      sub: '기준치에 도달하기 전, 최적의 환기 시점을 미리 계산해 제안합니다',
      lHead: '지금 vs 이후를 함께 판단',
      lSub: '현재 수치와 30분 뒤 예측값을\n함께 보고 결정',
      lBody: '• 기준치 초과 **30분 전** 사전 경고\n• 공간별 환기 우선순위 자동 산정\n• 불필요한 환기 가동 감소',
      rHead: 'KEY METRIC',
      rBody: '• 시계열 기반 예측 유효 선행\n• 기존 설비 그대로 연동',
      rCaption: '예측 그래프 예시',
    },
    build: (ctx) => {
      const w = 526
      return [
        ...chrome(ctx),
        ...headerPanel(ctx, 'lHead', 50, 577.5),
        ...headerPanel(ctx, 'rHead', 652.1, 577.5),
        field(ctx, 'lSub', 75.6, 248, w, 46, { ...S.contentSub }),
        field(ctx, 'lBody', 75.6, 304, w, 320, { ...S.body }),
        field(ctx, 'lNote', 75.6, 640, w, 22, { ...S.note }),
        field(ctx, 'rBody', 677.7, 248, w, 130, { ...S.body }),
        image('rImage', 677.7, 393.3, w, 227),
        field(ctx, 'rCaption', 677.7, 630, w, 20, { ...S.note, align: 'center' }),
      ]
    },
  },
  {
    id: 'header-3',
    name: '타이틀형 3단',
    description: '헤더 3개로 항목 비교',
    category: '타이틀형',
    tone: 'light',
    fields: [
      ...titleFields,
      ...n3.flatMap((n) => [f.head(`h${n}Head`, `${n}단 헤더`), f.sub(`h${n}Sub`, `${n}단 서브`), f.body(`h${n}Body`, `${n}단 본문`, 160), f.note(`h${n}Note`, `${n}단 안내문`)]),
    ],
    sample: {
      title: '고객의 준비 단계에 맞춘 서비스 구성',
      sub: '데이터 구축부터 검수 · 평가까지 필요한 단계만 선택할 수 있습니다',
      h1Head: '벡터 구축형',
      h1Sub: '데이터 설계가 필요한 고객',
      h1Body: '• 공간 · 장비 설계\n• 수집 · 정제 체계 구축',
      h2Head: '데이터 공급형',
      h2Sub: '학습 데이터가 필요한 고객',
      h2Body: '• 목적 맞춤 수집 · 검수\n• 온디맨드 공급',
      h3Head: '검수 · 평가형',
      h3Sub: '성능 검증이 필요한 고객',
      h3Body: '• 보유 데이터 품질 검수\n• 실측 성능 평가 리포트',
    },
    build: (ctx) => {
      const xs = [50, 451.9, 853.5]
      const w = 326
      return [
        ...chrome(ctx),
        ...xs.flatMap((x, i) => headerPanel(ctx, `h${i + 1}Head`, x, 375.9)),
        ...xs.flatMap<SlideEl>((x, i) => {
          const n = i + 1
          const cx = x + 25
          return [
            field(ctx, `h${n}Sub`, cx, 248, w, 46, { ...S.contentSub }),
            field(ctx, `h${n}Body`, cx, 304, w, 320, { ...S.body }),
            field(ctx, `h${n}Note`, cx, 640, w, 22, { ...S.note }),
          ]
        }),
      ]
    },
  },
  {
    id: 'free',
    name: '자유 배치',
    description: '가이드 상단(타이틀·서브·로고) 아래를 도형·텍스트·이미지로 자유롭게',
    category: '자유 배치',
    tone: 'light',
    fields: [...titleFields],
    sample: {
      title: '원본 배치를 유지한 슬라이드',
      sub: '불러온 PPT의 도형·텍스트·이미지를 그대로 두고 가이드 상단만 입힙니다',
    },
    build: (ctx) => chrome(ctx),
  },
  {
    id: 'closing',
    name: '마무리',
    description: '감사 인사 + 회사 연락처',
    category: '표지·구성',
    tone: 'cover',
    fields: [
      { key: 'title', label: '인사말', kind: 'multiline', placeholder: '감사합니다.', max: 30 },
      { key: 'contact', label: '연락처', kind: 'multiline', placeholder: '주소\n이메일\n전화번호', max: 120 },
    ],
    sample: { title: '감사합니다.', contact: BRAND.contact },
    build: (ctx) => [
      field(ctx, 'title', 76.8, 233.7, 1115, 120, { size: 36, bold: true, color: C.white, lineHeight: 1.2 }),
      { type: 'rect', x: 76.8, y: 367.2, w: 75.6, h: 4.8, fill: C.white },
      { type: 'text', text: 'ALCHERA Inc.\nE-mail.\nTel.', x: 76.8, y: 584.8, w: 130, h: 80, size: 9, bold: true, color: C.pageNum, lineHeight: 1.6 },
      field(ctx, 'contact', 219.6, 584.8, 700, 80, { size: 9, color: C.pageNum, lineHeight: 1.6 }),
      logo(ctx.p, 1073.3, 628.3, 133.7),
    ],
  },
]

export const LAYOUT_MAP = Object.fromEntries(LAYOUTS.map((l) => [l.id, l])) as Record<LayoutId, LayoutDef>

export const LAYOUT_CATEGORIES: LayoutCategory[] = ['표지·구성', '라인형', '타이틀형', '자유 배치']

export function slideTone(slide: Slide): Tone {
  return LAYOUT_MAP[slide.layout].tone
}

export function buildSlide(slide: Slide, index: number, section = ''): SlideEl[] {
  const layout = LAYOUT_MAP[slide.layout]
  return layout.build({ c: slide.content, p: TONES[layout.tone], index, section, fields: layout.fields })
}

// 상단 목차: 이 슬라이드 앞의 가장 가까운 간지 — "2. 문제 제기" 처럼 간지 순번을 붙입니다.
export function sectionFor(slides: Slide[], index: number): string {
  let found = -1
  for (let i = index; i >= 0; i--) {
    if (slides[i].layout === 'section') {
      found = i
      break
    }
  }
  if (found === -1) return ''
  const n = slides.slice(0, found + 1).filter((s) => s.layout === 'section').length
  const t = (slides[found].content.title ?? '').trim()
  return t ? `${n}. ${t}` : ''
}

export interface SlideIssue {
  field: string
  label: string
  kind: 'empty' | 'long'
}

// 가이드 체크: 비어 있는 칸과 권장 글자 수를 넘은 칸을 찾습니다.
// 선택 항목(placeholder에 '(선택)')은 비어 있어도 문제 삼지 않습니다. 굵게 표시(**)는 글자 수에서 뺍니다.
export function checkSlide(slide: Slide): SlideIssue[] {
  const layout = LAYOUT_MAP[slide.layout]
  const issues: SlideIssue[] = []
  for (const fd of layout.fields) {
    const v = (slide.content[fd.key] ?? '').replace(/\*\*/g, '').trim()
    if (!v) {
      if (fd.kind !== 'image' && !fd.placeholder.includes('(선택)')) issues.push({ field: fd.key, label: fd.label, kind: 'empty' })
    } else if (fd.max && v.length > fd.max) {
      issues.push({ field: fd.key, label: fd.label, kind: 'long' })
    }
  }
  return issues
}
