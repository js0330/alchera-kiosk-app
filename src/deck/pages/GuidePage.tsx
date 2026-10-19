import { BRAND, GUIDE_RULES, TONES, TYPE_SCALE, type Tone } from '../guide'
import FitWidth from '../components/FitWidth'
import SlideCanvas from '../components/SlideCanvas'
import { makeSlide } from '../kits'
import { LAYOUT_MAP } from '../layouts'

const COLOR_SWATCHES = [
  { name: 'Navy', hex: BRAND.colors.navy, use: '제목·표지 배경' },
  { name: 'Alchera Blue', hex: BRAND.colors.blue, use: '강조·섹션 배경' },
  { name: 'Bright Blue', hex: BRAND.colors.brightBlue, use: '어두운 배경 위 강조' },
  { name: 'Gray', hex: BRAND.colors.gray, use: '보조 텍스트' },
  { name: 'Line', hex: BRAND.colors.line, use: '구분선' },
  { name: 'Panel', hex: BRAND.colors.panel, use: '카드 배경' },
]

const toneSample = (tone: Tone) => makeSlide('statement', LAYOUT_MAP.statement.sample, tone)

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
      <section className="pt-12">
        <p className="deck-label">Alchera Presentation Guide</p>
        <h1 className="mt-2 text-[28px] font-bold text-[#000038]">프레젠테이션 가이드</h1>
        <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-[#666]">
          스튜디오의 모든 레이아웃은 아래 규칙으로 만들어집니다. 직접 지킬 필요는 없어요 — 칸에 글만 채우면 자동으로 적용됩니다.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GUIDE_RULES.map((r, i) => (
          <div key={r.title} className="rounded-2xl border border-[#E0E5F0] bg-white p-5">
            <span className="text-[12px] font-bold text-[#0000A5]">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-2 text-[15px] font-bold text-[#000038]">{r.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#666]">{r.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="text-[20px] font-bold text-[#000038]">컬러</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {COLOR_SWATCHES.map((c) => (
            <div key={c.name} className="overflow-hidden rounded-2xl border border-[#E0E5F0] bg-white">
              <div className="h-20" style={{ background: c.hex }} />
              <div className="p-3">
                <p className="text-[13px] font-bold text-[#000038]">{c.name}</p>
                <p className="font-mono text-[12px] text-[#666]">{c.hex}</p>
                <p className="mt-1 text-[11px] text-[#7A8099]">{c.use}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-[20px] font-bold text-[#000038]">배경 톤</h2>
        <p className="mt-1 text-[13px] text-[#7A8099]">슬라이드마다 세 가지 톤 중 하나를 고를 수 있어요. 본문은 화이트, 표지·마무리는 네이비, 섹션은 블루가 기본입니다.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {(Object.keys(TONES) as Tone[]).map((t) => (
            <div key={t}>
              <div className="overflow-hidden rounded-xl ring-1 ring-[#E0E5F0]">
                <FitWidth>{(w) => <SlideCanvas slide={toneSample(t)} index={3} footer={BRAND.footer} width={w} />}</FitWidth>
              </div>
              <p className="mt-2 text-[13px] font-semibold text-[#000038]">{TONES[t].label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-[20px] font-bold text-[#000038]">글자 크기</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#E0E5F0] bg-white">
            {TYPE_SCALE.map((t) => (
              <div key={t.name} className="flex items-center gap-4 border-b border-[#E0E5F0] px-5 py-3 last:border-0">
                <span className="w-14 text-right font-mono text-[12px] text-[#7A8099]">{t.size}pt</span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[#000038]"
                    style={{ fontSize: Math.min(28, t.size * 0.7), fontWeight: t.weight === 'Bold' ? 700 : 400 }}
                  >
                    {t.name}
                  </p>
                  <p className="text-[11px] text-[#7A8099]">{t.use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-[20px] font-bold text-[#000038]">글꼴과 여백</h2>
          <div className="mt-5 space-y-4 rounded-2xl border border-[#E0E5F0] bg-white p-5 text-[13px] leading-relaxed text-[#333A4D]">
            <p>
              <b className="text-[#000038]">글꼴: {BRAND.font.ppt}</b>
              <br />
              PPTX도 같은 글꼴로 저장됩니다. 발표 PC에 Pretendard가 없으면 다른 글꼴로 보이니,{' '}
              <a className="font-semibold text-[#0000A5] underline" href="https://github.com/orioncactus/pretendard" target="_blank" rel="noreferrer">
                Pretendard를 설치
              </a>
              해 주세요.
            </p>
            <p>
              <b className="text-[#000038]">슬라이드: 16:9 (13.33 × 7.5in)</b>
              <br />
              좌우 여백 0.67in, 제목은 좌상단, 로고는 우상단, 페이지 번호는 우하단에 고정됩니다.
            </p>
            <p>
              <b className="text-[#000038]">가이드를 바꾸려면</b>
              <br />
              색·글꼴·여백은 코드의 <code className="rounded bg-[#F2F4FB] px-1">src/deck/guide.ts</code> 한 곳에서 관리합니다. 고치면 모든 팀원의 템플릿과
              PPTX에 함께 반영돼요.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
