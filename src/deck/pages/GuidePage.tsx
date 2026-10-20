import { ExternalLink } from 'lucide-react'
import FitWidth from '../components/FitWidth'
import SlideCanvas from '../components/SlideCanvas'
import { BRAND, GUIDE_RULES, SLIDE_H, SLIDE_W, TYPE_SCALE } from '../guide'
import { GUIDE_TEXT_SIZES } from '../freeObjects'
import { makeSlide } from '../kits'
import { GUIDE_BOXES } from '../library'
import { LAYOUT_MAP, LINE_BOX_AREA, LINE_PANELS } from '../layouts'
import type { FreeObj, LayoutId } from '../types'

const GUIDE_URL = 'https://docs.google.com/presentation/d/1wFAze7VjYDsDJM4q5tEqPVd4PEfu0DJNMiVGzUpdtYo/edit'

const C = BRAND.colors

const COLOR_SWATCHES = [
  { name: 'Navy', hex: C.navy, use: '타이틀 · 본문 · 간지 배경' },
  { name: 'Alchera Blue', hex: C.blue, use: '슬라이드 서브 · 헤더 · 강조선' },
  { name: 'Gray', hex: C.gray, use: '안내문 · 이미지 안내 문구' },
  { name: 'Crumb', hex: C.crumb, use: '키 네임(상단 목차)' },
  { name: 'Page', hex: C.pageNum, use: '페이지 번호 · 마무리 연락처' },
  { name: 'Line', hex: C.line, use: '가이드 박스 테두리' },
  { name: 'Image', hex: C.imageFill, use: '이미지 자리 · 옅은 배경' },
  { name: 'White', hex: C.white, use: '박스 바탕 · 어두운 배경 위 글자' },
]

const sample = (id: LayoutId, content?: Record<string, string>) => ({ ...makeSlide(id, content ?? LAYOUT_MAP[id].sample), id: `guide-${id}` })

// 슬라이드 구조 예시: 라인형 1단 박스 안에 글과 이미지 자리
const A = LINE_BOX_AREA
const ANATOMY_OBJECTS: FreeObj[] = [
  {
    id: 'g-text',
    kind: 'shape',
    geom: 'rect',
    x: A.x,
    y: A.y,
    w: 520,
    h: 160,
    text: '**콘텐츠 타이틀 12pt**\n\n• 본문 10pt · 줄간격 1.3\n• 강조는 **Bold**\n• 글머리 •는 텍스트로',
    size: 10,
    color: C.navy,
    align: 'left',
    valign: 'top',
    lineHeight: 1.3,
    pad: [0, 0, 0, 0],
  },
  { id: 'g-img', kind: 'shape', geom: 'roundRect', x: A.x + A.w - 540, y: A.y, w: 540, h: 360, radius: 16, fill: C.imageFill, text: '이미지 · 블록 · 도형', size: 10, color: C.gray, align: 'center', valign: 'middle', lineHeight: 1.3, pad: [0, 0, 0, 0] },
]
const anatomySlide = {
  ...sample('line-box', { crumb: '2. 제품 소개', title: '슬라이드 타이틀 — 결론을 한 문장으로', sub: '슬라이드 서브 — 한 줄로 요약' }),
  objects: ANATOMY_OBJECTS,
}

// 슬라이드 위 번호 표시 (1280×720 기준 좌표)
const [panelX, panelY, panelW, panelH] = LINE_PANELS.one[0]
const MARKERS = [
  { n: 1, x: 24, y: 39, label: '키 네임 (상단 목차)', spec: '9pt · #9CA3AF · 직접 입력, 비우면 간지 제목' },
  { n: 2, x: 24, y: 75, label: '슬라이드 타이틀', spec: '19pt · Bold · #000038 · 결론을 한 문장으로' },
  { n: 3, x: 24, y: 122, label: '슬라이드 서브', spec: '11pt · #0000A5 · 파란 바 + 한 줄' },
  { n: 4, x: 1128, y: 50, label: '로고', spec: '오른쪽 위 고정' },
  { n: 5, x: panelX + panelW - 10, y: panelY + 4, label: '라인형 1단 박스', spec: `${panelW} × ${panelH}px · 흰 바탕 · #E7E6E6 테두리 · 위쪽 파란 선` },
  { n: 6, x: A.x + 10, y: A.y + A.h - 10, label: '안쪽 여백 24px', spec: '박스 안 요소는 이 점선 영역 밖으로 나가지 않음' },
  { n: 7, x: 1262, y: 700, label: '페이지 번호', spec: '7pt · #BFBFBF · 박스 오른쪽 아래 바깥' },
]

const CHANGES = [
  '슬라이드 타이틀을 6px 위로 (서브와 간격 확보)',
  '페이지 번호 8pt → 7pt, 본문 박스 오른쪽 아래 바깥으로',
  '키 네임(상단 목차)을 칸으로 — 직접 입력, 비우면 간지 제목',
  '라인형 1단: 안의 제목·본문·이미지 칸 대신 사방 여백 24px 박스',
  '표지 (제목 1줄) 추가 — 흰 바·서브타이틀 자리는 2줄 표지와 같음',
  '2단·3단·4분할·타이틀형은 고정 레이아웃 대신 요소 라이브러리의 가이드 박스로',
]

function Anatomy() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="overflow-hidden rounded-xl ring-1 ring-[#E0E5F0]">
        <FitWidth>
          {(w) => (
            <div className="relative" style={{ width: w, height: (w * SLIDE_H) / SLIDE_W }}>
              <SlideCanvas slide={anatomySlide} index={2} width={w} showPlaceholders={false} />
              {/* 안쪽 여백 영역 */}
              <div
                className="pointer-events-none absolute border border-dashed border-[#4D6BFF]/60"
                style={{ left: `${(A.x / SLIDE_W) * 100}%`, top: `${(A.y / SLIDE_H) * 100}%`, width: `${(A.w / SLIDE_W) * 100}%`, height: `${(A.h / SLIDE_H) * 100}%` }}
              />
              {MARKERS.map((m) => (
                <span
                  key={m.n}
                  className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#F1A11D] text-[11px] font-bold text-white shadow"
                  style={{ left: `${(m.x / SLIDE_W) * 100}%`, top: `${(m.y / SLIDE_H) * 100}%` }}
                >
                  {m.n}
                </span>
              ))}
            </div>
          )}
        </FitWidth>
      </div>
      <ol className="space-y-2.5">
        {MARKERS.map((m) => (
          <li key={m.n} className="flex gap-3 text-[13px]">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#F1A11D] text-[11px] font-bold text-white">{m.n}</span>
            <span>
              <b className="text-[#000038]">{m.label}</b>
              <br />
              <span className="text-[12px] text-[#7A8099]">{m.spec}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// 요소 라이브러리의 가이드 박스 미리보기
function BoxGallery() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {GUIDE_BOXES.map((b) => (
        <div key={b.id}>
          <div className="overflow-hidden rounded-lg ring-1 ring-[#E0E5F0]">
            <FitWidth>
              {(w) => <SlideCanvas slide={{ ...makeSlide('free', { title: '슬라이드 타이틀', sub: '슬라이드 서브' }), id: `guide-${b.id}`, objects: b.build() }} index={2} width={w} showPlaceholders={false} />}
            </FitWidth>
          </div>
          <p className="mt-1.5 text-[13px] font-semibold text-[#000038]">{b.label}</p>
          <p className="text-[12px] text-[#7A8099]">{b.description}</p>
        </div>
      ))}
    </div>
  )
}

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
      <section className="flex flex-wrap items-end justify-between gap-4 pt-12">
        <div>
          <p className="deck-label">ALCHERA_PPT_Template_ver.260507 · Deck Studio 기준</p>
          <h1 className="mt-2 text-[28px] font-bold text-[#000038]">프레젠테이션 가이드</h1>
          <p className="mt-2 max-w-[680px] text-[14px] leading-relaxed text-[#666]">
            스튜디오의 모든 슬라이드는 아래 값으로 만들어집니다. 표지·목차·간지·마무리는 칸에 글만 채우고, 본문은 라인형 1단 박스나 가이드 박스 안에 글·이미지·블록을 넣으세요.
          </p>
        </div>
        <a href={GUIDE_URL} target="_blank" rel="noreferrer" className="deck-btn">
          <ExternalLink size={15} /> 원본 가이드 열기
        </a>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDE_RULES.map((r) => (
          <div key={r.title} className="rounded-2xl border border-[#E0E5F0] bg-white p-5">
            <h3 className="text-[15px] font-bold text-[#000038]">{r.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#666]">{r.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="text-[20px] font-bold text-[#000038]">본문 슬라이드 구조</h2>
        <p className="mt-1 text-[13px] text-[#7A8099]">라인형 1단 기준. 위쪽 타이틀 가이드는 모든 본문 슬라이드에 똑같이 들어갑니다.</p>
        <div className="mt-5">
          <Anatomy />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-[20px] font-bold text-[#000038]">표지</h2>
        <p className="mt-1 text-[13px] text-[#7A8099]">제목 줄 수에 맞춰 고릅니다. 흰 바와 서브타이틀 자리는 같고, 1줄 표지는 제목이 바 쪽으로 붙습니다.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {(['cover-1', 'cover'] as const).map((id) => (
            <div key={id}>
              <div className="overflow-hidden rounded-xl ring-1 ring-[#E0E5F0]">
                <FitWidth>{(w) => <SlideCanvas slide={sample(id)} index={0} width={w} />}</FitWidth>
              </div>
              <p className="mt-2 text-[13px] font-semibold text-[#000038]">{LAYOUT_MAP[id].name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-[20px] font-bold text-[#000038]">가이드 박스 · 요소 라이브러리</h2>
        <p className="mt-1 text-[13px] text-[#7A8099]">
          칸 나누기가 필요하면 자유 배치 슬라이드에서 요소 라이브러리 → 가이드 박스를 고릅니다. 레이아웃과 같은 크기·위치로 들어가고, ‘잠그기’로 고정할 수 있어요.
        </p>
        <div className="mt-5">
          <BoxGallery />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-[20px] font-bold text-[#000038]">컬러</h2>
        <p className="mt-1 text-[13px] text-[#7A8099]">글자·선·채우기·아이콘 색은 이 팔레트 안에서만 고를 수 있습니다.</p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {COLOR_SWATCHES.map((c) => (
            <div key={c.name} className="overflow-hidden rounded-2xl border border-[#E0E5F0] bg-white">
              <div className="h-16 border-b border-[#E0E5F0]" style={{ background: c.hex }} />
              <div className="p-3">
                <p className="text-[13px] font-bold text-[#000038]">{c.name}</p>
                <p className="font-mono text-[12px] text-[#666]">{c.hex}</p>
                <p className="mt-1 text-[11px] leading-snug text-[#7A8099]">{c.use}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="text-[20px] font-bold text-[#000038]">글자 체계 · Noto Sans KR</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#E0E5F0] bg-white">
            {TYPE_SCALE.map((t) => (
              <div key={t.name} className="flex items-center gap-4 border-b border-[#E0E5F0] px-5 py-3 last:border-0">
                <span className="w-12 text-right font-mono text-[12px] tabular-nums text-[#7A8099]">{t.size}pt</span>
                <p className="min-w-0 flex-1 truncate text-[#000038]" style={{ fontSize: Math.min(24, Math.max(12, t.size * 0.75)), fontWeight: t.bold ? 700 : 400 }}>
                  {t.name}
                </p>
                <span className="hidden text-right text-[11px] text-[#7A8099] sm:block">{t.spec}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="text-[20px] font-bold text-[#000038]">요소 서식 값</h2>
            <dl className="mt-5 space-y-3 rounded-2xl border border-[#E0E5F0] bg-white p-5 text-[13px] text-[#333A4D]">
              <div>
                <dt className="font-bold text-[#000038]">글자 크기</dt>
                <dd className="text-[#666]">{GUIDE_TEXT_SIZES.join(' · ')}pt</dd>
              </div>
              <div>
                <dt className="font-bold text-[#000038]">선 · 테두리</dt>
                <dd className="text-[#666]">두께 0.75 · 1 · 1.5 · 2.25 · 3pt / 실선 · 점선 · 점 / 화살촉 · 끝점 원</dd>
              </div>
              <div>
                <dt className="font-bold text-[#000038]">모서리 둥글기</dt>
                <dd className="text-[#666]">0 · 4 · 8 · 12 · 16 · 24px, 최대(알약 모양) — 둥근 사각형·이미지</dd>
              </div>
              <div>
                <dt className="font-bold text-[#000038]">도형</dt>
                <dd className="text-[#666]">구글 슬라이드·PowerPoint 기본 도형 14종 + 화살표 8종 (PPTX에서도 같은 도형)</dd>
              </div>
            </dl>
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-[#000038]">슬라이드 · 글꼴</h2>
            <div className="mt-5 space-y-4 rounded-2xl border border-[#E0E5F0] bg-white p-5 text-[13px] leading-relaxed text-[#333A4D]">
              <p>
                <b className="text-[#000038]">슬라이드 크기: 16:9 (10 × 5.625in)</b>
                <br />
                가이드 원본(Google Slides)과 같은 크기라서, 다운로드한 PPTX를 가이드 파일에 그대로 붙여 넣어도 크기가 맞습니다.
              </p>
              <p>
                <b className="text-[#000038]">글꼴: {BRAND.font.ppt}</b>
                <br />
                PowerPoint에서 열 PC에 Noto Sans KR이 없으면 다른 글꼴로 보입니다.{' '}
                <a className="font-semibold text-[#0000A5] underline" href="https://fonts.google.com/noto/specimen/Noto+Sans+KR" target="_blank" rel="noreferrer">
                  Noto Sans KR 설치
                </a>{' '}
                후 열어주세요. Google Slides로 가져오면 바로 맞게 보입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-[#F1A11D]/40 bg-[#FFF8EC] p-6">
        <h2 className="text-[17px] font-bold text-[#000038]">원본 가이드(Google Slides ver.260507)와 달라진 점</h2>
        <p className="mt-1 text-[13px] text-[#7A8099]">스튜디오에서 쓰면서 바뀐 값입니다. 원본 가이드 파일도 같이 맞추면 PPT로 작업하는 분들과 결과가 같아져요.</p>
        <ul className="mt-4 grid gap-2 text-[13px] text-[#333A4D] sm:grid-cols-2">
          {CHANGES.map((c) => (
            <li key={c} className="flex gap-2">
              <span className="text-[#F1A11D]">●</span>
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] text-[#7A8099]">
          값을 바꾸려면 색·글꼴은 <code className="rounded bg-white px-1">src/deck/guide.ts</code>, 위치는 <code className="rounded bg-white px-1">src/deck/layouts.ts</code> 한 곳에서 고칩니다.
        </p>
      </section>
    </div>
  )
}
