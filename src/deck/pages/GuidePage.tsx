import { ExternalLink } from 'lucide-react'
import FitWidth from '../components/FitWidth'
import SlideCanvas from '../components/SlideCanvas'
import { BRAND, GUIDE_RULES, TYPE_SCALE } from '../guide'
import { makeSlide } from '../kits'
import { LAYOUT_MAP } from '../layouts'
import type { LayoutId } from '../types'

const GUIDE_URL = 'https://docs.google.com/presentation/d/1wFAze7VjYDsDJM4q5tEqPVd4PEfu0DJNMiVGzUpdtYo/edit'

const COLOR_SWATCHES = [
  { name: 'Navy', hex: BRAND.colors.navy, use: '타이틀 · 본문 · 간지 배경' },
  { name: 'Alchera Blue', hex: BRAND.colors.blue, use: '슬라이드 서브 · 헤더 · 강조선' },
  { name: 'Gray', hex: BRAND.colors.gray, use: '안내문 · 이미지 안내 문구' },
  { name: 'Crumb', hex: BRAND.colors.crumb, use: '상단 목차' },
  { name: 'Line', hex: BRAND.colors.line, use: '라인형 패널 테두리' },
  { name: 'Image', hex: BRAND.colors.imageFill, use: '이미지 자리' },
]

const sample = (id: LayoutId) => ({ ...makeSlide(id, LAYOUT_MAP[id].sample), id: `guide-${id}` })

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
      <section className="flex flex-wrap items-end justify-between gap-4 pt-12">
        <div>
          <p className="deck-label">ALCHERA_PPT_Template_ver.260507</p>
          <h1 className="mt-2 text-[28px] font-bold text-[#000038]">프레젠테이션 가이드</h1>
          <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-[#666]">
            스튜디오의 모든 레이아웃은 아래 가이드 값으로 만들어집니다. 칸에 글만 채우면 글꼴·크기·색·위치는 자동으로 맞춰져요.
          </p>
        </div>
        <a href={GUIDE_URL} target="_blank" rel="noreferrer" className="deck-btn">
          <ExternalLink size={15} /> 원본 가이드 열기
        </a>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GUIDE_RULES.map((r) => (
          <div key={r.title} className="rounded-2xl border border-[#E0E5F0] bg-white p-5">
            <h3 className="text-[15px] font-bold text-[#000038]">{r.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#666]">{r.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="text-[20px] font-bold text-[#000038]">라인형과 타이틀형</h2>
        <p className="mt-1 text-[13px] text-[#7A8099]">텍스트 중심이면 라인형, 강조 헤더가 필요하면 타이틀형. 둘 다 이미지나 표·그래프와 함께 씁니다.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {(['line-1', 'header-1'] as const).map((id) => (
            <div key={id}>
              <div className="overflow-hidden rounded-xl ring-1 ring-[#E0E5F0]">
                <FitWidth>{(w) => <SlideCanvas slide={sample(id)} index={3} section="1. 회사 소개" width={w} />}</FitWidth>
              </div>
              <p className="mt-2 text-[13px] font-semibold text-[#000038]">{LAYOUT_MAP[id].name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-[20px] font-bold text-[#000038]">컬러</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {COLOR_SWATCHES.map((c) => (
            <div key={c.name} className="overflow-hidden rounded-2xl border border-[#E0E5F0] bg-white">
              <div className="h-20 border-b border-[#E0E5F0]" style={{ background: c.hex }} />
              <div className="p-3">
                <p className="text-[13px] font-bold text-[#000038]">{c.name}</p>
                <p className="font-mono text-[12px] text-[#666]">{c.hex}</p>
                <p className="mt-1 text-[11px] text-[#7A8099]">{c.use}</p>
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
              </a>
              {' '}후 열어주세요. Google Slides로 가져오면 바로 맞게 보입니다.
            </p>
            <p>
              <b className="text-[#000038]">가이드를 바꾸려면</b>
              <br />
              색·글꼴은 <code className="rounded bg-[#F2F4FB] px-1">src/deck/guide.ts</code>, 레이아웃 위치는{' '}
              <code className="rounded bg-[#F2F4FB] px-1">src/deck/layouts.ts</code> 에서 관리합니다. 고치면 모든 팀원의 템플릿과 PPTX에 함께 반영돼요.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
