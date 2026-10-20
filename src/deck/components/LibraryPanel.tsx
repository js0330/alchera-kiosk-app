import { X } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { BRAND } from '../guide'
import { dragProps } from '../insert'
import { BLOCKS, GUIDE_BOXES, ICONS, iconUrl, placeObjects, type BlockDef } from '../library'
import { LINE_KINDS, type LineKind } from '../freeObjects'
import { SHAPES } from '../shapes'
import type { Geom } from '../types'
import { makeSlide } from '../kits'
import ObjectsPreview from './ObjectsPreview'
import SlideCanvas from './SlideCanvas'
import { LineIcon, ShapeIcon } from './InsertMenus'

interface LibraryPanelProps {
  onClose: () => void
  onShape: (geom: Geom) => void
  onLine: (kind: LineKind) => void
  onIcon: (id: string) => void
  onBlock: (block: BlockDef) => void
  onBox: (box: BlockDef, lock: boolean) => void
}

type Tab = 'boxes' | 'blocks' | 'icons' | 'shapes'

const PREVIEW_W = 244

// 블록 미리보기
const BlockPreview = memo(function BlockPreview({ block }: { block: BlockDef }) {
  const objs = useMemo(() => placeObjects(block.build()), [block])
  return <ObjectsPreview objects={objs} width={PREVIEW_W} />
})

// 가이드 박스 미리보기: 슬라이드 전체에 그려서 '레이아웃과 같은 자리'에 들어가는 것을 보여 줍니다
const BoxPreview = memo(function BoxPreview({ block }: { block: BlockDef }) {
  const slide = useMemo(() => ({ ...makeSlide('free', { title: '슬라이드 타이틀', sub: '슬라이드 서브' }), objects: block.build() }), [block])
  return (
    <div className="overflow-hidden rounded-t-lg">
      <SlideCanvas slide={slide} index={0} width={PREVIEW_W - 2} showPlaceholders={false} />
    </div>
  )
})

// 웹플로우의 "추가" 패널처럼: 샘플덱에서 가져온 구성 블록 · 아이콘 · 도형을 클릭하거나 슬라이드로 끌어다 놓습니다.
export default function LibraryPanel({ onClose, onShape, onLine, onIcon, onBlock, onBox }: LibraryPanelProps) {
  const [tab, setTab] = useState<Tab>('boxes')
  const [lockBoxes, setLockBoxes] = useState(false)
  const tabs: [Tab, string][] = [
    ['boxes', '가이드 박스'],
    ['blocks', '블록'],
    ['icons', '아이콘'],
    ['shapes', '도형·선'],
  ]
  return (
    <div className="flex w-[288px] flex-shrink-0 flex-col border-r border-[#E0E5F0] bg-white">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <div>
          <h3 className="text-[14px] font-bold text-[#000038]">요소 라이브러리</h3>
          <p className="text-[11px] text-[#7A8099]">클릭하거나 슬라이드로 끌어다 놓으세요</p>
        </div>
        <button type="button" className="deck-btn deck-btn-ghost px-1.5" onClick={onClose} aria-label="닫기">
          <X size={16} />
        </button>
      </div>
      <div className="mx-4 flex rounded-lg bg-[#F2F4FB] p-0.5">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-md py-1.5 text-[12px] font-semibold ${tab === id ? 'bg-white text-[#000038] shadow-sm' : 'text-[#7A8099]'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 pt-3">
        {tab === 'boxes' && (
          <>
            <p className="mb-2 text-[11px] leading-relaxed text-[#7A8099]">레이아웃의 틀만 같은 크기·위치로 들어가요. 안의 글·이미지는 자유롭게 배치하고, 박스를 더블클릭하면 바로 글을 쓸 수 있어요.</p>
            <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-lg bg-[#F5F7FC] px-3 py-2 text-[12px] text-[#333A4D]">
              <input type="checkbox" checked={lockBoxes} onChange={(e) => setLockBoxes(e.target.checked)} className="accent-[#0000A5]" />
              넣으면서 바로 잠그기 <span className="text-[11px] text-[#9CA3AF]">(실수로 안 움직이게)</span>
            </label>
            <ul className="space-y-3">
              {GUIDE_BOXES.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-[#E0E5F0] text-left transition hover:border-[#4D6BFF] hover:shadow-[0_4px_14px_rgba(0,0,165,0.08)]"
                    onClick={() => onBox(b, lockBoxes)}
                    {...dragProps({ type: 'box', id: b.id })}
                  >
                    <BoxPreview block={b} />
                    <div className="border-t border-[#EEF1F7] px-3 py-2">
                      <p className="text-[12px] font-bold text-[#000038]">{b.label}</p>
                      <p className="text-[11px] leading-snug text-[#7A8099]">{b.description}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {tab === 'blocks' && (
          <ul className="space-y-3">
            {BLOCKS.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-[#E0E5F0] text-left transition hover:border-[#4D6BFF] hover:shadow-[0_4px_14px_rgba(0,0,165,0.08)]"
                  onClick={() => onBlock(b)}
                  {...dragProps({ type: 'block', id: b.id })}
                >
                  <BlockPreview block={b} />
                  <div className="border-t border-[#EEF1F7] px-3 py-2">
                    <p className="text-[12px] font-bold text-[#000038]">{b.label}</p>
                    <p className="text-[11px] leading-snug text-[#7A8099]">{b.description}</p>
                    <p className="mt-0.5 text-[10px] text-[#9CA3AF]">샘플: {b.source}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {tab === 'icons' && (
          <>
            {(['Face Trust', 'Physical AI'] as const).map((src) => (
              <div key={src} className="mb-4">
                <p className="deck-label mb-2">{src} 샘플</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {ICONS.filter((i) => i.source === src).map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      title={i.label}
                      className="flex flex-col items-center gap-1 rounded-lg px-1 py-2 hover:bg-[#EEF1FB]"
                      onClick={() => onIcon(i.id)}
                      {...dragProps({ type: 'icon', id: i.id })}
                    >
                      <span
                        className="block h-8 w-8"
                        style={{ background: BRAND.colors.blue, WebkitMask: `url(${iconUrl(i.id)}) center / contain no-repeat`, mask: `url(${iconUrl(i.id)}) center / contain no-repeat` }}
                      />
                      <span className="w-full truncate text-center text-[10px] text-[#7A8099]">{i.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[11px] leading-relaxed text-[#9CA3AF]">넣은 뒤 오른쪽 패널에서 아이콘 색(블루·네이비·그레이·흰색)을 바꿀 수 있어요.</p>
          </>
        )}
        {tab === 'shapes' && (
          <>
            {(['기본 도형', '화살표'] as const).map((g) => (
              <div key={g} className="mb-4">
                <p className="deck-label mb-2">{g}</p>
                <div className="grid grid-cols-5 gap-1">
                  {SHAPES.filter((s) => s.group === g).map((s) => (
                    <button
                      key={s.geom}
                      type="button"
                      title={s.label}
                      className="flex h-12 items-center justify-center rounded-lg hover:bg-[#EEF1FB]"
                      onClick={() => onShape(s.geom)}
                      {...dragProps({ type: 'shape', geom: s.geom })}
                    >
                      <ShapeIcon geom={s.geom} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="deck-label mb-2">선</p>
            <div className="space-y-0.5">
              {LINE_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-[13px] text-[#333A4D] hover:bg-[#EEF1FB]"
                  onClick={() => onLine(k)}
                  {...dragProps({ type: 'line', id: k.id })}
                >
                  <LineIcon kind={k} width={56} />
                  {k.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
