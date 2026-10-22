import { Bold, TextAlignCenter, TextAlignEnd, TextAlignStart } from 'lucide-react'
import { BRAND } from '../guide'
import { GUIDE_EMPHASIS_SIZE, GUIDE_TEXT_COLORS, GUIDE_TEXT_SIZES } from '../freeObjects'
import type { FreeObj } from '../types'
import { Dropdown } from './InsertMenus'

const COLOR_NAMES: Record<string, string> = {
  [BRAND.colors.navy]: '네이비',
  [BRAND.colors.blue]: '블루',
  [BRAND.colors.gray]: '그레이',
  [BRAND.colors.crumb]: '연한 그레이',
  [BRAND.colors.white]: '흰색',
}

const ALIGNS = [
  ['left', '왼쪽', TextAlignStart],
  ['center', '가운데', TextAlignCenter],
  ['right', '오른쪽', TextAlignEnd],
] as const

// 도구줄의 글자 서식: 고른 글 상자·도형의 글꼴(가이드 글꼴 고정) · 크기 · 굵게 · 색 · 정렬.
// 고를 수 있는 값은 가이드 값뿐입니다. 아무것도 고르지 않으면 흐리게 보입니다.
export default function TextTools({ objs, onPatch }: { objs: FreeObj[]; onPatch: (patch: Partial<FreeObj>) => void }) {
  const texts = objs.filter((o) => o.kind === 'shape')
  const on = texts.length > 0
  const s0 = texts[0]
  const size = s0?.size ?? 10
  const sizes = [...GUIDE_TEXT_SIZES, GUIDE_EMPHASIS_SIZE].sort((a, b) => b - a)
  const color = s0?.color ?? BRAND.colors.navy
  const align = s0?.align ?? 'left'
  const AlignIcon = ALIGNS.find((a) => a[0] === align)?.[2] ?? TextAlignStart
  const btn = 'deck-btn deck-btn-ghost h-8 px-2'

  return (
    <div className={`flex items-center gap-0.5 ${on ? '' : 'pointer-events-none opacity-40'}`} aria-disabled={!on} title={on ? undefined : '글 상자나 도형을 고르면 서식을 바꿀 수 있어요'}>
      <span className="px-2 text-[12px] text-[#333A4D]" title="가이드 글꼴 (바꿀 수 없음)">
        {BRAND.font.ppt}
      </span>
      <select
        value={sizes.includes(size) ? size : ''}
        onChange={(e) => onPatch({ size: Number(e.target.value) })}
        className="h-7 w-[56px] rounded-md border border-[#D9DEEA] bg-white px-1.5 text-[12px] text-[#1A1D3D] outline-none focus:border-[#4D6BFF]"
        aria-label="글자 크기"
        title="글자 크기 (pt)"
      >
        {!sizes.includes(size) && <option value="">{size}</option>}
        {sizes.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button type="button" className={`${btn} ${s0?.bold ? 'bg-[#E6EAFB] text-[#0000A5]' : ''}`} onClick={() => onPatch({ bold: !s0?.bold })} title="굵게 (Ctrl+B)" aria-label="굵게">
        <Bold size={15} />
      </button>
      <Dropdown
        label="글자 색"
        compact
        buttonClass={btn}
        icon={
          <span className="flex flex-col items-center leading-none">
            <span className="text-[14px] font-bold text-[#1A1D3D]">A</span>
            <span className="mt-0.5 h-[3px] w-4 rounded-sm ring-1 ring-black/10" style={{ background: color }} />
          </span>
        }
      >
        {(close) => (
          <div className="flex gap-1.5 p-1.5">
            {GUIDE_TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={COLOR_NAMES[c] ?? c}
                aria-label={COLOR_NAMES[c] ?? c}
                className={`h-7 w-7 rounded-full ring-1 ring-black/10 ${color === c ? 'outline outline-2 outline-offset-2 outline-[#4D6BFF]' : ''}`}
                style={{ background: c }}
                onClick={() => {
                  onPatch({ color: c })
                  close()
                }}
              />
            ))}
          </div>
        )}
      </Dropdown>
      <Dropdown label="정렬" compact buttonClass={btn} icon={<AlignIcon size={15} />}>
        {(close) => (
          <div className="flex gap-0.5 p-0.5">
            {ALIGNS.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                className={`rounded-md p-2 hover:bg-[#EEF1FB] ${align === id ? 'bg-[#E6EAFB] text-[#0000A5]' : 'text-[#333A4D]'}`}
                onClick={() => {
                  onPatch({ align: id })
                  close()
                }}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        )}
      </Dropdown>
    </div>
  )
}
