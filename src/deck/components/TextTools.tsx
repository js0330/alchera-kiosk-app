import { Bold, Italic, TextAlignCenter, TextAlignEnd, TextAlignStart, Underline } from 'lucide-react'
import { BRAND } from '../guide'
import { COLOR_NAMES, GUIDE_EMPHASIS_SIZE, GUIDE_LINE_HEIGHTS, GUIDE_TEXT_COLORS, GUIDE_TEXT_SIZES } from '../freeObjects'
import type { FreeObj } from '../types'
import { Dropdown } from './InsertMenus'

const ALIGNS = [
  ['left', '왼쪽', TextAlignStart],
  ['center', '가운데', TextAlignCenter],
  ['right', '오른쪽', TextAlignEnd],
] as const

// 글을 고치는 중이고 글자 일부를 끌어서 골랐으면, 굵게·기울임·밑줄·색은 그 부분에만 줍니다
function inlineSelection(): boolean {
  const active = document.activeElement as HTMLElement | null
  const sel = window.getSelection()
  return !!active?.isContentEditable && !!sel && !sel.isCollapsed && active.contains(sel.anchorNode)
}
const inline = (cmd: string, value?: string) => {
  document.execCommand('styleWithCSS', false, 'false')
  document.execCommand(cmd, false, value)
}
// 누를 때 글 선택이 풀리지 않게
const keep = (e: React.MouseEvent) => e.preventDefault()

// 도구줄의 글자 서식: 글꼴(가이드 글꼴 고정) · 크기 · 줄 간격 · 굵게 · 기울임 · 밑줄 · 색 · 정렬.
// 굵게·기울임·밑줄·색은 글을 고치면서 일부를 골랐으면 그 부분에만, 아니면 고른 글 상자 전체에 줍니다.
// 고를 수 있는 값은 가이드 값뿐입니다. 아무것도 고르지 않으면 흐리게 보입니다.
export default function TextTools({ objs, editing, onPatch }: { objs: FreeObj[]; editing: boolean; onPatch: (patch: Partial<FreeObj>) => void }) {
  const texts = objs.filter((o) => o.kind === 'shape')
  const on = texts.length > 0 || editing
  const s0 = texts[0]
  const size = s0?.size ?? 10
  const sizes = [...GUIDE_TEXT_SIZES, GUIDE_EMPHASIS_SIZE].sort((a, b) => b - a)
  const lineHeight = s0?.lineHeight ?? 1.3
  const color = s0?.color ?? BRAND.colors.navy
  const align = s0?.align ?? 'left'
  const AlignIcon = ALIGNS.find((a) => a[0] === align)?.[2] ?? TextAlignStart
  const btn = 'deck-btn deck-btn-ghost h-8 px-2'
  const select = 'h-7 rounded-md border border-[#D9DEEA] bg-white px-1.5 text-[12px] text-[#1A1D3D] outline-none focus:border-[#4D6BFF] disabled:opacity-50'

  return (
    <div className={`flex items-center gap-0.5 ${on ? '' : 'pointer-events-none opacity-40'}`} aria-disabled={!on} title={on ? undefined : '글 상자나 도형을 고르면 서식을 바꿀 수 있어요'}>
      <span className="px-2 text-[12px] text-[#333A4D]" title="가이드 글꼴 (바꿀 수 없음)">
        {BRAND.font.ppt}
      </span>
      <select
        value={sizes.includes(size) ? size : ''}
        disabled={!texts.length}
        onChange={(e) => onPatch({ size: Number(e.target.value) })}
        className={`${select} w-[56px]`}
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
      <select
        value={(GUIDE_LINE_HEIGHTS as readonly number[]).includes(lineHeight) ? lineHeight : ''}
        disabled={!texts.length}
        onChange={(e) => onPatch({ lineHeight: Number(e.target.value) })}
        className={`${select} ml-1 w-[64px]`}
        aria-label="줄 간격"
        title="줄 간격"
      >
        {!(GUIDE_LINE_HEIGHTS as readonly number[]).includes(lineHeight) && <option value="">{lineHeight}</option>}
        {GUIDE_LINE_HEIGHTS.map((h) => (
          <option key={h} value={h}>
            ↕ {h}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={`${btn} ${s0?.bold ? 'bg-[#E6EAFB] text-[#0000A5]' : ''}`}
        onMouseDown={keep}
        onClick={() => (inlineSelection() ? inline('bold') : onPatch({ bold: !s0?.bold }))}
        title="굵게 (Ctrl+B) · 글 일부를 고르면 그 부분만"
        aria-label="굵게"
      >
        <Bold size={15} />
      </button>
      <button
        type="button"
        className={`${btn} ${s0?.italic ? 'bg-[#E6EAFB] text-[#0000A5]' : ''}`}
        onMouseDown={keep}
        onClick={() => (inlineSelection() ? inline('italic') : onPatch({ italic: !s0?.italic }))}
        title="기울임 (Ctrl+I) · 글 일부를 고르면 그 부분만"
        aria-label="기울임"
      >
        <Italic size={15} />
      </button>
      <button
        type="button"
        className={`${btn} ${s0?.underline ? 'bg-[#E6EAFB] text-[#0000A5]' : ''}`}
        onMouseDown={keep}
        onClick={() => (inlineSelection() ? inline('underline') : onPatch({ underline: !s0?.underline }))}
        title="밑줄 (Ctrl+U) · 글 일부를 고르면 그 부분만"
        aria-label="밑줄"
      >
        <Underline size={15} />
      </button>
      <Dropdown
        label="글자 색"
        compact
        keepFocus
        buttonClass={btn}
        icon={
          <span className="flex flex-col items-center leading-none">
            <span className="text-[14px] font-bold text-[#1A1D3D]">A</span>
            <span className="mt-0.5 h-[3px] w-4 rounded-sm ring-1 ring-black/10" style={{ background: color }} />
          </span>
        }
      >
        {(close) => (
          <div className="p-1.5">
            <div className="flex gap-1.5">
              {GUIDE_TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={COLOR_NAMES[c] ?? c}
                  aria-label={COLOR_NAMES[c] ?? c}
                  className={`h-7 w-7 rounded-full ring-1 ring-black/10 ${color === c ? 'outline outline-2 outline-offset-2 outline-[#4D6BFF]' : ''}`}
                  style={{ background: c }}
                  onClick={() => {
                    if (inlineSelection()) inline('foreColor', c)
                    else onPatch({ color: c })
                    close()
                  }}
                />
              ))}
            </div>
            <p className="mt-2 px-0.5 text-[11px] text-[#9CA3AF]">글 일부를 끌어서 고르면 그 부분만 바뀌어요</p>
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
