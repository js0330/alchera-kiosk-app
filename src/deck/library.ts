import { BRAND, ptToPx } from './guide'
import { FREE_AREA, HEADER_BAR, HEADER_BODY, HEADER_PANELS, LINE_PANELS, linePanelRadius } from './layouts'
import { GUIDE_EMPHASIS_SIZE } from './freeObjects'
import { uid } from './kits'
import type { NumberStyle } from './insert'
import type { FreeObj, Geom } from './types'

// 요소 라이브러리: 알체라 샘플덱(Face Trust · 공기질 AI · Physical AI)에서 쓰인 아이콘과 자주 쓰는 구성을
// 가이드 색·글자 크기로 다시 만든 것. 클릭하거나 슬라이드로 끌어다 놓으면 편집 가능한 요소로 들어갑니다.

const C = BRAND.colors

// ── 아이콘 ─────────────────────────────────────────────────────
// public/deck/library/icons 의 흰색 모양 이미지를 원하는 색으로 칠해서 넣습니다.

export interface IconDef {
  id: string
  label: string
  source: 'Face Trust' | 'Physical AI'
}

export const ICONS: IconDef[] = [
  { id: 'chip', label: '칩·AI', source: 'Face Trust' },
  { id: 'shield', label: '보안', source: 'Face Trust' },
  { id: 'database', label: '데이터베이스', source: 'Face Trust' },
  { id: 'pie', label: '파이 차트', source: 'Face Trust' },
  { id: 'fingerprint', label: '지문', source: 'Face Trust' },
  { id: 'charger', label: '충전', source: 'Face Trust' },
  { id: 'factory', label: '공장', source: 'Face Trust' },
  { id: 'warehouse', label: '창고', source: 'Face Trust' },
  { id: 'bolt', label: '전력', source: 'Face Trust' },
  { id: 'people', label: '사람 감지', source: 'Face Trust' },
  { id: 'airplane', label: '비행기', source: 'Face Trust' },
  { id: 'chevron-down', label: '아래 꺾쇠', source: 'Face Trust' },
  { id: 'checkbox', label: '체크 박스', source: 'Physical AI' },
  { id: 'gauge', label: '속도계', source: 'Physical AI' },
  { id: 'frames', label: '영상 프레임', source: 'Physical AI' },
  { id: 'storage', label: '데이터 저장', source: 'Physical AI' },
  { id: 'shield-check', label: '보안 확인', source: 'Physical AI' },
  { id: 'flask', label: '실험·검증', source: 'Physical AI' },
  { id: 'bar-chart', label: '막대 그래프', source: 'Physical AI' },
  { id: 'sigma', label: '합계·통계', source: 'Physical AI' },
  { id: 'warning', label: '경고', source: 'Physical AI' },
  { id: 'block', label: '금지', source: 'Physical AI' },
  { id: 'sync', label: '순환·반복', source: 'Physical AI' },
]

export const iconUrl = (id: string) => `${import.meta.env.BASE_URL}deck/library/icons/${id}.png`

const tintCache = new Map<string, Promise<string>>()

// 흰색 모양 아이콘을 color 로 칠한 PNG(data URL). 같은 조합은 한 번만 만듭니다.
export function tintIcon(url: string, color: string): Promise<string> {
  const key = `${url}|${color}`
  let p = tintCache.get(key)
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        ctx.globalCompositeOperation = 'source-in'
        ctx.fillStyle = color
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = url
    })
    tintCache.set(key, p)
    p.catch(() => tintCache.delete(key))
  }
  return p
}

function icon(id: string, x: number, y: number, size: number, color: string = C.blue): FreeObj {
  return { id: uid(), kind: 'image', x, y, w: size, h: size, icon: iconUrl(id), color }
}

// 아직 칠하지 않은 아이콘(src 없음)을 칠해서 돌려줍니다.
export async function resolveIcons(objs: FreeObj[]): Promise<FreeObj[]> {
  return Promise.all(objs.map(async (o) => (o.icon && !o.src ? { ...o, src: await tintIcon(o.icon, o.color ?? C.blue) } : o)))
}

export const newIcon = (id: string, color: string = C.blue) => icon(id, FREE_AREA.x + 80, FREE_AREA.y + 80, 64, color)

// ── 원 숫자 ─────────────────────────────────────────────────────
// 샘플덱의 번호 원. 원과 숫자를 따로 넣어 각각 색을 바꿀 수 있습니다.
// 숫자 상자는 원보다 작게 두어, 원의 가장자리를 누르면 원이, 가운데를 누르면 숫자가 선택됩니다.

export const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const NUMBER_STYLES: { id: NumberStyle; label: string; fill: string; line?: string; color: string }[] = [
  { id: 'fill', label: '채움', fill: C.blue, color: C.white },
  { id: 'line', label: '테두리', fill: C.white, line: C.blue, color: C.blue },
  { id: 'soft', label: '연한 바탕', fill: C.imageFill, color: C.blue },
]

export function numberCircle(n: number, style: NumberStyle): FreeObj[] {
  const s = NUMBER_STYLES.find((x) => x.id === style) ?? NUMBER_STYLES[0]
  const d = 44
  const x = FREE_AREA.x + 80
  const y = FREE_AREA.y + 80
  return [
    shape(x, y, d, d, { geom: 'ellipse', fill: s.fill, line: s.line, pad: NO_PAD }),
    shape(x + 8, y + 8, d - 16, d - 16, { text: String(n), size: 12, bold: true, color: s.color, pad: NO_PAD }),
  ]
}

// ── 구성 블록 ───────────────────────────────────────────────────

type Pad = [number, number, number, number]
const NO_PAD: Pad = [0, 0, 0, 0]

interface TextOpts {
  size?: number
  bold?: boolean
  color?: string
  align?: 'left' | 'center' | 'right'
  valign?: 'top' | 'middle' | 'bottom'
}

// 채우기 없는 글 상자. 높이는 최소한 글 줄 수 × 글자 크기 × 줄간격(1.3)이 되게 맞춰 글이 잘리지 않게 합니다.
function text(x: number, y: number, w: number, h: number, value: string, o: TextOpts = {}): FreeObj {
  const need = Math.ceil(value.split('\n').length * ptToPx(o.size ?? 10) * 1.3) + 1
  return {
    id: uid(),
    kind: 'shape',
    geom: 'rect',
    x,
    y,
    w,
    h: Math.max(h, need),
    text: value,
    size: o.size ?? 10,
    bold: o.bold,
    color: o.color ?? C.navy,
    align: o.align ?? 'left',
    valign: o.valign ?? 'top',
    lineHeight: 1.3,
    pad: NO_PAD,
  }
}

interface ShapeOpts extends TextOpts {
  geom?: Geom
  fill?: string
  line?: string
  radius?: number
  pad?: Pad
  text?: string
}

function shape(x: number, y: number, w: number, h: number, o: ShapeOpts = {}): FreeObj {
  return {
    id: uid(),
    kind: 'shape',
    geom: o.geom ?? 'rect',
    x,
    y,
    w,
    h,
    fill: o.fill,
    line: o.line,
    lineWidth: o.line ? 0.75 : undefined,
    radius: o.radius,
    text: o.text ?? '',
    size: o.size ?? 10,
    bold: o.bold,
    color: o.color ?? C.navy,
    align: o.align ?? 'center',
    valign: o.valign ?? 'middle',
    lineHeight: 1.3,
    pad: o.pad ?? [8, 4, 8, 4],
  }
}

function line(x1: number, y1: number, x2: number, y2: number, o: { color?: string; width?: number; end?: boolean; dash?: FreeObj['dash'] } = {}): FreeObj {
  return {
    id: uid(),
    kind: 'line',
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
    flipH: x1 > x2 || undefined,
    flipV: y1 > y2 || undefined,
    line: o.color ?? C.crumb,
    lineWidth: o.width ?? 1,
    arrowEnd: o.end ? 'triangle' : undefined,
    dash: o.dash,
  }
}

const card = (x: number, y: number, w: number, h: number) => shape(x, y, w, h, { geom: 'roundRect', fill: C.white, line: C.line, radius: 12 })
const pill = (x: number, y: number, w: number, label: string, fill: string = C.blue) =>
  shape(x, y, w, 26, { geom: 'roundRect', fill, radius: 13, text: label, size: 9, bold: true, color: C.white, pad: [10, 0, 10, 0] })

export interface BlockDef {
  id: string
  label: string
  description: string
  source: string
  build: () => FreeObj[]
}

const X = FREE_AREA.x
const Y = FREE_AREA.y + 20
const W = FREE_AREA.w

// 블록 아래쪽 한 줄 메시지 (네이비 바)
const bar = (y: number, label: string) => shape(X, y, W, 40, { geom: 'roundRect', fill: C.navy, radius: 6, text: label, size: 9, bold: true, color: C.white })

export const BLOCKS: BlockDef[] = [
  {
    id: 'step-badges',
    label: '번호 단계',
    description: '원 안의 번호 + 단계 이름 + 한 줄 설명',
    source: 'Face Trust · Use Case',
    build: () =>
      [0, 1, 2, 3].flatMap((i) => {
        const x = X + i * 200
        return [
          shape(x + 76, Y, 28, 28, { geom: 'ellipse', fill: C.blue, text: String(i + 1), size: 10, bold: true, color: C.white, pad: NO_PAD }),
          text(x, Y + 38, 180, 24, ['접근', '얼굴 촬영', 'Liveness', '게이트 오픈'][i], { bold: true, align: 'center' }),
          text(x, Y + 64, 180, 20, '단계 설명을 한 줄로', { size: 8, color: C.gray, align: 'center' }),
          ...(i < 3 ? [line(x + 120, Y + 14, x + 260, Y + 14, { color: C.line })] : []),
        ]
      }),
  },
  {
    id: 'icon-process',
    label: '아이콘 프로세스',
    description: '아이콘 원 + 제목 + 설명, 화살표로 연결',
    source: 'Physical AI · 데이터 품질 검수',
    build: () =>
      (['checkbox', 'gauge', 'frames', 'storage'] as const).flatMap((id, i) => {
        const x = X + i * 290
        return [
          shape(x + 105, Y, 70, 70, { geom: 'ellipse', fill: C.imageFill }),
          icon(id, x + 122, Y + 17, 36),
          text(x, Y + 82, 280, 24, ['요구사항 분석', '작업·수집 설계', '수집 운영', '검수·납품'][i], { bold: true, align: 'center' }),
          text(x + 20, Y + 108, 240, 38, '이 단계에서 하는 일을\n두 줄 이내로 적어 주세요', { size: 8, color: C.gray, align: 'center' }),
          ...(i < 3 ? [line(x + 200, Y + 35, x + 370, Y + 35, { color: C.crumb, end: true })] : []),
        ]
      }),
  },
  {
    id: 'stat-cards',
    label: '숫자 카드 3개',
    description: '큰 숫자 + 항목 + 설명',
    source: 'Face Trust · 회사 개요',
    build: () =>
      [0, 1, 2].flatMap((i) => {
        const x = X + i * 300
        return [
          card(x, Y, 280, 136),
          text(x + 20, Y + 16, 240, 38, ['2020년', '5.1억+', '380+명'][i], { size: 16, bold: true, color: C.blue, align: 'center' }),
          text(x + 20, Y + 56, 240, 24, ['KOSDAQ 상장', '전 세계 AI 사용자', 'AI 전문 인력'][i], { bold: true, align: 'center' }),
          text(x + 20, Y + 84, 240, 38, '숫자를 뒷받침하는 설명', { size: 8, color: C.gray, align: 'center' }),
        ]
      }),
  },
  {
    id: 'numbered-cards',
    label: '번호 카드 3개',
    description: '01 · 02 · 03 + 질문형 제목 + 하단 라벨',
    source: 'Physical AI · THE PROBLEM',
    build: () =>
      [0, 1, 2].flatMap((i) => {
        const x = X + i * 390
        return [
          card(x, Y, 370, 220),
          text(x + 24, Y + 20, 200, 38, `0${i + 1}`, { size: 16, bold: true, color: C.blue }),
          text(x + 24, Y + 62, 320, 56, ['무엇을 더\n모아야 하나?', '이 데이터를\n믿어도 되나?', '로봇이 정말\n잘하는가?'][i], { size: 12, bold: true }),
          text(x + 24, Y + 132, 320, 20, '질문을 한 줄로 풀어 주세요', { size: 8, color: C.gray }),
          pill(x + 24, Y + 174, 200, ['수집 비용 누적', '품질 검증의 어려움', '결과 비교의 어려움'][i]),
        ]
      }),
  },
  {
    id: 'chevron-flow',
    label: '갈매기형 흐름',
    description: '오각형 화살표로 이어지는 4단계',
    source: 'Face Trust · PROVEN CAPABILITY',
    build: () =>
      [0, 1, 2, 3].map((i) =>
        shape(X + i * 250, Y, 262, 52, {
          geom: i === 0 ? 'homePlate' : 'chevron',
          fill: i === 3 ? C.navy : C.blue,
          text: ['1:N 인증', '얼굴 등록', '출입 기록', '중앙 관리'][i],
          size: 10,
          bold: true,
          color: C.white,
          pad: i === 0 ? [16, 0, 4, 0] : [4, 0, 4, 0],
        }),
      ),
  },
  {
    id: 'timeline',
    label: '타임라인',
    description: 'STEP 점 + 단계 제목 + 설명',
    source: '공기질 AI · 사후 대응 중심의 구조',
    build: () => [
      line(X + 140, Y + 40, X + 1040, Y + 40, { color: C.line, width: 1.5 }),
      ...[0, 1, 2, 3].flatMap((i) => {
        const cx = X + 140 + i * 300
        return [
          text(cx - 60, Y + 4, 120, 20, `STEP 0${i + 1}`, { size: 8, bold: true, color: C.blue, align: 'center' }),
          shape(cx - 9, Y + 31, 18, 18, { geom: 'ellipse', fill: i === 2 ? C.blue : C.white, line: C.blue, pad: NO_PAD }),
          text(cx - 110, Y + 60, 220, 24, ['오염 발생', '인원 접수', '현장 확인', '사후 조치'][i], { bold: true, align: 'center' }),
          text(cx - 110, Y + 86, 220, 38, '이 단계의 상황을\n짧게 적어 주세요', { size: 8, color: C.gray, align: 'center' }),
        ]
      }),
    ],
  },
  {
    id: 'before-after',
    label: '도입 전 → 후',
    description: '두 카드를 화살표로 비교',
    source: '공기질 AI · 개별 관리에서 통합 AI 관리',
    build: () => [
      card(X, Y, 500, 240),
      pill(X + 24, Y + 22, 110, '도입 전', C.gray),
      text(X + 24, Y + 66, 450, 150, '• 기존 방식의 한계 1\n• 기존 방식의 한계 2\n• 기존 방식의 한계 3'),
      shape(X + 530, Y + 95, 70, 50, { geom: 'rightArrow', fill: C.blue }),
      shape(X + 630, Y, 500, 240, { geom: 'roundRect', fill: C.white, line: C.blue, radius: 12 }),
      pill(X + 654, Y + 22, 110, '도입 후'),
      text(X + 654, Y + 66, 450, 150, '• **달라지는 점 1**\n• 달라지는 점 2\n• 달라지는 점 3'),
    ],
  },
  {
    id: 'hub',
    label: '입력 → 중앙 → 출력',
    description: '여러 입력이 중앙 시스템을 거쳐 결과로',
    source: 'Face Trust · 출입 대상별 시나리오',
    build: () => {
      const rows = [0, 1, 2]
      return [
        text(X, Y + 2, 260, 20, 'INPUT', { size: 8, bold: true, color: C.blue, align: 'center' }),
        text(X + 860, Y + 2, 260, 20, 'OUTPUT', { size: 8, bold: true, color: C.blue, align: 'center' }),
        ...rows.flatMap((i) => [
          shape(X, Y + 28 + i * 74, 260, 58, { geom: 'roundRect', fill: C.white, line: C.line, radius: 10, text: `**입력 ${i + 1}**\n설명`, align: 'left', pad: [16, 6, 16, 6] }),
          shape(X + 860, Y + 28 + i * 74, 260, 58, { geom: 'roundRect', fill: C.white, line: C.line, radius: 10, text: `**결과 ${i + 1}**\n설명`, align: 'left', pad: [16, 6, 16, 6] }),
          line(X + 270, Y + 57 + i * 74, X + 440, Y + 131, { color: C.crumb, end: true }),
          line(X + 680, Y + 131, X + 850, Y + 57 + i * 74, { color: C.crumb, end: true }),
        ]),
        shape(X + 450, Y + 41, 220, 180, { geom: 'ellipse', fill: C.navy, text: '**ALCHERA**\nCentral Server', size: 12, color: C.white }),
      ]
    },
  },
  {
    id: 'check-list',
    label: '체크 리스트',
    description: '체크 아이콘 + 한 줄 설명',
    source: 'Physical AI · 신뢰를 만드는 두 가지 검증',
    build: () =>
      [0, 1, 2].flatMap((i) => [
        icon('checkbox', X, Y + i * 44, 24),
        text(X + 36, Y + i * 44, 600, 24, ['**핵심 내용 1** — 짧은 설명', '**핵심 내용 2** — 짧은 설명', '**핵심 내용 3** — 짧은 설명'][i]),
      ]),
  },
  {
    id: 'navy-highlight',
    label: '강조 카드 (네이비)',
    description: '큰 숫자를 네이비 카드로 강조',
    source: '공기질 AI · 390개소 구축',
    build: () => [
      shape(X, Y, 300, 190, { geom: 'roundRect', fill: C.navy, radius: 12 }),
      pill(X + 85, Y + 22, 130, '누적 구축 현황', C.blue),
      text(X + 20, Y + 62, 260, 50, '390개소', { size: 16, bold: true, color: C.white, align: 'center', valign: 'middle' }),
      text(X + 20, Y + 118, 260, 50, '강조할 성과를\n두 줄로 설명합니다', { size: 9, color: C.white, align: 'center' }),
    ],
  },
  {
    id: 'bottom-bar',
    label: '하단 결론 바',
    description: '슬라이드 아래 한 줄 결론',
    source: 'Physical AI · 하단 요약',
    build: () => [
      shape(X, FREE_AREA.y + FREE_AREA.h - 56, FREE_AREA.w, 44, {
        geom: 'roundRect',
        fill: C.navy,
        radius: 8,
        text: '**핵심 결론** — 이 슬라이드에서 전하고 싶은 한 문장',
        size: 10,
        color: C.white,
      }),
    ],
  },
  {
    id: 'label-chips',
    label: '라벨 칩',
    description: '파란·네이비 둥근 라벨',
    source: 'Face Trust · Use Case 라벨',
    build: () => [pill(X, Y, 120, 'Use Case'), pill(X + 130, Y, 120, 'AI Solution', C.navy), pill(X + 260, Y, 120, '도입 효과', C.gray)],
  },
  // ── 사내 템플릿(이전에 쓰던 GPT 템플릿 샘플)에서 옮긴 구성 ──
  {
    id: 'service-cards',
    label: '3단 카드',
    description: '서비스·핵심 역량 + 아래 한 줄 메시지',
    source: '사내 템플릿 · 3단 카드',
    build: () => {
      const w = (W - 40) / 3
      return [
        ...[0, 1, 2].flatMap((i) => {
          const x = X + i * (w + 20)
          return [
            card(x, Y, w, 210),
            text(x + 24, Y + 22, w - 48, 18, ['자체 구축이 필요하다면', '데이터가 필요하다면', '검증이 필요하다면'][i], { size: 8, bold: true, color: C.blue }),
            text(x + 24, Y + 46, w - 48, 24, ['Turnkey 구축', '데이터 공급', '품질 검증'][i], { size: 12, bold: true }),
            text(x + 24, Y + 84, w - 48, 38, '서비스 내용을 두 줄 이내로\n적어 주세요', { size: 9, color: C.gray }),
            icon('checkbox', x + 24, Y + 166, 16),
            text(x + 48, Y + 166, w - 72, 18, ['Output: 운영 환경', 'Output: 검증된 데이터', 'Output: 품질 리포트'][i], { size: 8, bold: true }),
          ]
        }),
        bar(Y + 230, '전체 서비스를 한 문장으로 정리하세요'),
      ]
    },
  },
  {
    id: 'compare-panels',
    label: '좌우 비교',
    description: '현재 방식 ↔ 개선 방향 (머리띠 + 요약 줄)',
    source: '사내 템플릿 · 좌우 비교',
    build: () => {
      const w = (W - 20) / 2
      return [0, 1].flatMap((i) => {
        const x = X + i * (w + 20)
        return [
          shape(x, Y, w, 40, { geom: 'round2SameRect', fill: i ? C.blue : C.navy, radius: 8, text: i ? '개선 방향' : '현재 방식', size: 10, bold: true, color: C.white, align: 'left', pad: [20, 0, 20, 0] }),
          shape(x, Y + 40, w, 250, { fill: C.imageFill }),
          text(x + 24, Y + 64, w - 48, 24, i ? '핵심 개선 내용을 입력하세요' : '현재 상황을 입력하세요', { size: 10, bold: true }),
          text(x + 24, Y + 98, w - 48, 80, '• 첫 번째 내용을 입력하세요\n• 두 번째 내용을 입력하세요\n• 세 번째 내용을 입력하세요', { size: 9 }),
          shape(x + 24, Y + 236, w - 48, 32, { geom: 'roundRect', fill: C.white, radius: 6, text: i ? '기대 효과를 한 줄로 정리하세요' : '핵심 과제를 한 줄로 정리하세요', size: 8, color: C.gray, align: 'left', pad: [14, 0, 14, 0] }),
        ]
      })
    },
  },
  {
    id: 'four-steps',
    label: '4단계 흐름',
    description: '01~04 진행 과정 + 아래 핵심 메시지',
    source: '사내 템플릿 · 4단계 흐름',
    build: () => {
      const cw = W / 4
      return [
        ...[0, 1, 2, 3].flatMap((i) => {
          const cx = X + cw * i + cw / 2
          return [
            ...(i < 3 ? [line(cx + 34, Y + 22, cx + cw - 34, Y + 22, { color: C.line, width: 1.5 })] : []),
            shape(cx - 22, Y, 44, 44, { geom: 'ellipse', fill: i ? C.imageFill : C.blue, text: `0${i + 1}`, size: 9, bold: true, color: i ? C.blue : C.white, pad: NO_PAD }),
            text(cx - cw / 2 + 12, Y + 60, cw - 24, 20, ['데이터 수집', '데이터 가공', '품질 검증', '모델 활용'][i], { size: 10, bold: true, align: 'center' }),
            text(cx - cw / 2 + 12, Y + 86, cw - 24, 36, '단계별 핵심 내용을\n적어 주세요', { size: 8, color: C.gray, align: 'center' }),
          ]
        }),
        bar(Y + 150, '전체 프로세스의 핵심 메시지를 입력하세요'),
      ]
    },
  },
  {
    id: 'kpi-cards',
    label: '핵심 수치',
    description: '지표 이름 + 큰 숫자 + 기준 (연한 카드)',
    source: '사내 템플릿 · 핵심 수치',
    build: () => {
      const w = (W - 40) / 3
      return [0, 1, 2].flatMap((i) => {
        const x = X + i * (w + 20)
        return [
          shape(x, Y, w, 220, { geom: 'roundRect', fill: C.imageFill, radius: 12 }),
          text(x + 24, Y + 22, w - 48, 18, `핵심 지표 0${i + 1}`, { size: 9, bold: true }),
          // 큰 숫자: 가이드 간지 타이틀 크기(27pt)
          text(x + 24, Y + 50, w - 48, 60, '00%', { size: GUIDE_EMPHASIS_SIZE, bold: true, color: C.blue }),
          text(x + 24, Y + 124, w - 48, 36, '수치의 의미와 비교 기준을\n적어 주세요', { size: 9, color: C.gray }),
          text(x + 24, Y + 186, w - 48, 16, '측정 기준 · 기간 명시', { size: 8, color: C.crumb }),
        ]
      })
    },
  },
  {
    id: 'image-text',
    label: '이미지와 설명',
    description: '왼쪽 이미지 자리 + 오른쪽 소개 문구',
    source: '사내 템플릿 · 이미지와 설명',
    build: () => {
      const iw = W / 2 - 10
      const x = X + iw + 40
      const w = W - iw - 40
      return [
        shape(X, Y, iw, 320, { geom: 'roundRect', fill: C.imageFill, radius: 12, text: '이미지 자리 — 그림을 넣고 이 상자는 지워 주세요', size: 9, color: C.gray }),
        text(x, Y + 12, w, 18, 'SOLUTION / CASE', { size: 8, bold: true, color: C.blue }),
        text(x, Y + 38, w, 34, '핵심 소개 문구를 입력하세요', { size: 12, bold: true }),
        text(x, Y + 90, w, 60, '제품이나 사례의 특징을\n두세 줄로 설명하세요', { size: 9, color: C.gray }),
        shape(x, Y + 276, w, 44, { geom: 'roundRect', fill: C.navy, radius: 6, text: '가장 중요한 메시지를 입력하세요', size: 9, bold: true, color: C.white }),
      ]
    },
  },
  {
    id: 'architecture',
    label: '구성도',
    description: '입력 3개 → 핵심 처리 → 결과 2개',
    source: '사내 템플릿 · 구성도',
    build: () => {
      const bw = 240
      const core = { x: X + W / 2 - 130, y: Y + 80, w: 260, h: 110 }
      const outX = X + W - bw
      return [
        ...[0, 1, 2].flatMap((i) => {
          const y = Y + i * 96
          return [
            line(X + bw + 10, y + 32, core.x - 10, core.y + core.h / 2, { color: C.crumb }),
            shape(X, y, bw, 64, { geom: 'roundRect', fill: C.imageFill, radius: 8, text: `입력 데이터 ${'ABC'[i]}`, size: 9, bold: true }),
          ]
        }),
        ...[0, 1].flatMap((i) => {
          const y = Y + 48 + i * 112
          return [
            line(core.x + core.w + 10, core.y + core.h / 2, outX - 10, y + 32, { color: C.crumb }),
            shape(outX, y, bw, 64, { geom: 'roundRect', fill: C.white, line: C.blue, radius: 8, text: `결과 / 활용 ${'AB'[i]}`, size: 9, bold: true, color: C.blue }),
          ]
        }),
        shape(core.x, core.y, core.w, core.h, { geom: 'roundRect', fill: C.navy, radius: 10, text: '**핵심 처리 단계**\n분석 · 가공 · 검증', size: 10, color: C.white }),
      ]
    },
  },
]

// ── 가이드 박스 ─────────────────────────────────────────────────
// 라인형·타이틀형 레이아웃의 틀(패널)만 같은 크기·위치로 넣습니다. 안의 글·이미지는 자유롭게.
// 박스를 더블클릭하면 바로 글을 쓸 수 있고, 다른 요소보다 뒤에 깔립니다.

const panelText = { text: '', size: 10, color: C.navy, align: 'left' as const, valign: 'top' as const, lineHeight: 1.3 }

function linePanelObj([x, y, w, h]: readonly [number, number, number, number]): FreeObj {
  return { id: uid(), kind: 'shape', geom: 'roundRect', x, y, w, h, fill: C.white, line: C.line, lineWidth: 0.75, radius: linePanelRadius(w, h), shadow: 'accent', ...panelText, pad: [25.6, 22, 25.6, 22] }
}

function headerPanelObjs([x, w]: readonly [number, number], label: string): FreeObj[] {
  const below = HEADER_BAR.y + HEADER_BAR.h - HEADER_BODY.y
  return [
    { id: uid(), kind: 'shape', geom: 'roundRect', x, y: HEADER_BODY.y, w, h: HEADER_BODY.h, fill: C.white, line: C.line, lineWidth: 0.75, radius: 12, shadow: 'soft', ...panelText, pad: [25, below + 24, 25, 22] },
    { id: uid(), kind: 'shape', geom: 'round2SameRect', x, y: HEADER_BAR.y, w, h: HEADER_BAR.h, fill: C.blue, text: label, size: 12, bold: true, color: C.white, align: 'center', valign: 'middle', lineHeight: 1.2, pad: [20, 0, 20, 0] },
  ]
}

export const GUIDE_BOXES: BlockDef[] = [
  { id: 'box-line-1', label: '라인형 1단', description: '넓은 패널 하나 (가장 많이 씀)', source: '가이드 · 라인형', build: () => LINE_PANELS.one.map(linePanelObj) },
  { id: 'box-line-2', label: '라인형 2단', description: '나란히 두 칸', source: '가이드 · 라인형', build: () => LINE_PANELS.two.map(linePanelObj) },
  { id: 'box-line-3', label: '라인형 3단', description: '나란히 세 칸', source: '가이드 · 라인형', build: () => LINE_PANELS.three.map(linePanelObj) },
  { id: 'box-line-grid', label: '라인형 4분할', description: '2×2 네 칸', source: '가이드 · 라인형', build: () => LINE_PANELS.grid.map(linePanelObj) },
  { id: 'box-header-1', label: '타이틀형 1단', description: '파란 헤더 + 넓은 본문', source: '가이드 · 타이틀형', build: () => headerPanelObjs(HEADER_PANELS.one[0], '헤더 타이틀') },
  {
    id: 'box-header-2',
    label: '타이틀형 2단',
    description: '헤더 두 칸',
    source: '가이드 · 타이틀형',
    build: () => HEADER_PANELS.two.flatMap((p, i) => headerPanelObjs(p, `헤더 타이틀 ${i + 1}`)),
  },
  {
    id: 'box-header-3',
    label: '타이틀형 3단',
    description: '헤더 세 칸',
    source: '가이드 · 타이틀형',
    build: () => HEADER_PANELS.three.flatMap((p, i) => headerPanelObjs(p, `헤더 타이틀 ${i + 1}`)),
  },
]

// 블록·요소 묶음을 원하는 위치(가운데 기준)로 옮기고 새 id 를 붙입니다.
export function placeObjects(objs: FreeObj[], center?: { x: number; y: number }): FreeObj[] {
  if (!objs.length) return objs
  const minX = Math.min(...objs.map((o) => o.x))
  const minY = Math.min(...objs.map((o) => o.y))
  const maxX = Math.max(...objs.map((o) => o.x + o.w))
  const maxY = Math.max(...objs.map((o) => o.y + o.h))
  if (!center) return objs.map((o) => ({ ...o, id: uid() }))
  const w = maxX - minX
  const h = maxY - minY
  // 슬라이드 밖으로 나가지 않게
  const left = Math.max(0, Math.min(1280 - w, center.x - w / 2))
  const top = Math.max(0, Math.min(720 - h, center.y - h / 2))
  return objs.map((o) => ({ ...o, id: uid(), x: Math.round((o.x - minX + left) * 10) / 10, y: Math.round((o.y - minY + top) * 10) / 10 }))
}
