import { ArrowDownToLine, ArrowUpToLine, Bold, Copy, TextAlignCenter, TextAlignEnd, TextAlignStart, Trash2, WandSparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { BRAND } from '../guide'
import { GUIDE_FILLS, GUIDE_LINES, GUIDE_TEXT_COLORS, GUIDE_TEXT_SIZES, snapToGuide } from '../freeObjects'
import type { FreeObj } from '../types'

interface ObjectPanelProps {
  obj: FreeObj
  onChange: (obj: FreeObj) => void
  onRemove: () => void
  onDuplicate: () => void
  onOrder: (dir: 'front' | 'back') => void
}

const COLOR_NAMES: Record<string, string> = {
  [BRAND.colors.navy]: '네이비',
  [BRAND.colors.blue]: '알체라 블루',
  [BRAND.colors.gray]: '그레이',
  [BRAND.colors.crumb]: '연한 그레이',
  [BRAND.colors.white]: '흰색',
  [BRAND.colors.imageFill]: '이미지 배경색',
  [BRAND.colors.line]: '테두리 회색',
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-[#666]">{label}</span>
      <div className="flex flex-wrap justify-end gap-1">{children}</div>
    </div>
  )
}

function Swatch({ color, active, onClick }: { color?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color ? (COLOR_NAMES[color] ?? color) : '없음'}
      className={`h-6 w-6 rounded-md border ${active ? 'ring-2 ring-[#4D6BFF] ring-offset-1' : ''} ${color ? 'border-black/10' : 'border-dashed border-[#B6BCD0]'}`}
      style={{ background: color ?? 'transparent' }}
    >
      {!color && <span className="block text-[10px] text-[#B6BCD0]">✕</span>}
    </button>
  )
}

const chip = (active: boolean) =>
  `h-7 min-w-[30px] rounded-md px-1.5 text-[12px] font-semibold tabular-nums ${active ? 'bg-[#0000A5] text-white' : 'bg-[#F2F4FB] text-[#333A4D] hover:bg-[#E5E9F7]'}`

// 선택한 자유 배치 요소의 속성. 고를 수 있는 값은 가이드 값(크기·색)으로만 제한합니다.
export default function ObjectPanel({ obj, onChange, onRemove, onDuplicate, onOrder }: ObjectPanelProps) {
  const set = (patch: Partial<FreeObj>) => onChange({ ...obj, ...patch })
  const isShape = obj.kind === 'shape'
  const offGuideSize = isShape && obj.text && !GUIDE_TEXT_SIZES.includes((obj.size ?? 10) as (typeof GUIDE_TEXT_SIZES)[number])

  return (
    <section className="space-y-3 border-b border-[#E0E5F0] p-4">
      <div className="flex items-center justify-between">
        <h3 className="deck-label">선택한 요소 · {obj.kind === 'image' ? '이미지' : obj.kind === 'line' ? '선' : obj.text ? '텍스트' : '도형'}</h3>
        <span className="text-[11px] tabular-nums text-[#9CA3AF]">
          {Math.round(obj.w)}×{Math.round(obj.h)}
        </span>
      </div>

      {isShape && (
        <>
          <Row label="글자 크기">
            {GUIDE_TEXT_SIZES.map((s) => (
              <button key={s} type="button" className={chip(obj.size === s)} onClick={() => set({ size: s })}>
                {s}
              </button>
            ))}
          </Row>
          {offGuideSize && <p className="text-right text-[11px] text-[#F1A11D]">지금 {obj.size}pt — 가이드 크기가 아니에요</p>}
          <Row label="글자 색">
            {GUIDE_TEXT_COLORS.map((c) => (
              <Swatch key={c} color={c} active={obj.color === c} onClick={() => set({ color: c })} />
            ))}
          </Row>
          <Row label="굵게 · 정렬">
            <button type="button" className={chip(!!obj.bold)} onClick={() => set({ bold: !obj.bold })} aria-label="굵게">
              <Bold size={14} className="mx-auto" />
            </button>
            {(
              [
                ['left', TextAlignStart],
                ['center', TextAlignCenter],
                ['right', TextAlignEnd],
              ] as const
            ).map(([a, Icon]) => (
              <button key={a} type="button" className={chip((obj.align ?? 'left') === a)} onClick={() => set({ align: a })} aria-label={a}>
                <Icon size={14} className="mx-auto" />
              </button>
            ))}
          </Row>
          <Row label="채우기">
            <Swatch active={!obj.fill} onClick={() => set({ fill: undefined })} />
            {GUIDE_FILLS.map((c) => (
              <Swatch key={c} color={c} active={obj.fill === c} onClick={() => set({ fill: c, color: c === BRAND.colors.navy || c === BRAND.colors.blue ? BRAND.colors.white : obj.color })} />
            ))}
          </Row>
          <Row label="테두리">
            <Swatch active={!obj.line} onClick={() => set({ line: undefined })} />
            {GUIDE_LINES.map((c) => (
              <Swatch key={c} color={c} active={obj.line === c} onClick={() => set({ line: c, lineWidth: obj.lineWidth ?? 0.75 })} />
            ))}
          </Row>
          <Row label="모서리">
            {(
              [
                ['rect', '각진'],
                ['roundRect', '둥근'],
                ['ellipse', '원'],
              ] as const
            ).map(([g, label]) => (
              <button key={g} type="button" className={chip((obj.geom ?? 'rect') === g)} onClick={() => set({ geom: g, radius: g === 'roundRect' ? (obj.radius ?? 12) : obj.radius })}>
                {label}
              </button>
            ))}
          </Row>
        </>
      )}
      {obj.kind === 'line' && (
        <Row label="선 색">
          {GUIDE_LINES.map((c) => (
            <Swatch key={c} color={c} active={obj.line === c} onClick={() => set({ line: c })} />
          ))}
        </Row>
      )}

      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <button type="button" className="deck-btn h-8 justify-center px-2 text-[12px]" onClick={() => onOrder('front')}>
          <ArrowUpToLine size={14} /> 맨 앞으로
        </button>
        <button type="button" className="deck-btn h-8 justify-center px-2 text-[12px]" onClick={() => onOrder('back')}>
          <ArrowDownToLine size={14} /> 맨 뒤로
        </button>
        <button type="button" className="deck-btn h-8 justify-center px-2 text-[12px]" onClick={onDuplicate}>
          <Copy size={14} /> 복제
        </button>
        <button type="button" className="deck-btn h-8 justify-center px-2 text-[12px] text-[#C2333D]" onClick={onRemove}>
          <Trash2 size={14} /> 삭제
        </button>
        {obj.kind !== 'image' && (
          <button type="button" className="deck-btn col-span-2 h-8 justify-center px-2 text-[12px]" onClick={() => onChange(snapToGuide(obj))}>
            <WandSparkles size={14} /> 이 요소만 가이드 서식 맞추기
          </button>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-[#9CA3AF]">더블클릭으로 글 수정 · Delete 삭제 · 방향키 이동(Shift 10px) · Ctrl+D 복제</p>
    </section>
  )
}
