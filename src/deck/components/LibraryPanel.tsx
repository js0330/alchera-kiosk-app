import { Info, X } from 'lucide-react'
import { memo, useEffect, useMemo, useState } from 'react'
import { BRAND } from '../guide'
import { dragProps, type NumberStyle } from '../insert'
import { BLOCKS, GUIDE_BOXES, ICONS, MATERIAL_PICKS, NUMBERS, NUMBER_STYLES, iconUrl, loadMaterialNames, placeObjects, type BlockDef } from '../library'
import { LINE_KINDS, type LineKind } from '../freeObjects'
import { SHAPES } from '../shapes'
import type { Geom } from '../types'
import { makeSlide } from '../kits'
import ObjectsPreview from './ObjectsPreview'
import SlideCanvas from './SlideCanvas'
import { LineIcon, ShapeIcon } from './InsertMenus'

// 아이콘 단추 하나 (눌러서 넣기 · 끌어다 놓기)
function IconButton({ id, label, onIcon }: { id: string; label: string; onIcon: (id: string) => void }) {
  const url = iconUrl(id)
  return (
    <button
      type="button"
      title={label}
      className="flex flex-col items-center gap-1 rounded-lg px-1 py-2 hover:bg-[#EEF1FB]"
      onClick={() => onIcon(id)}
      {...dragProps({ type: 'icon', id })}
    >
      <span className="block h-8 w-8" style={{ background: BRAND.colors.blue, WebkitMask: `url(${url}) center / contain no-repeat`, mask: `url(${url}) center / contain no-repeat` }} />
      <span className="w-full truncate text-center text-[10px] text-[#7A8099]">{label}</span>
    </button>
  )
}

// 구글 머티리얼 아이콘: 자주 쓰는 것(한글 이름)을 먼저 보여 주고, 검색하면 전체(영어 이름 약 3,900개)에서 찾습니다
function MaterialIcons({ onIcon }: { onIcon: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [names, setNames] = useState<string[]>([])
  const query = q.trim().toLowerCase()
  useEffect(() => {
    if (query) loadMaterialNames().then(setNames)
  }, [query])
  const list: [string, string][] = !query
    ? MATERIAL_PICKS
    : [
        ...MATERIAL_PICKS.filter(([n, l]) => l.includes(query) || n.includes(query.replace(/\s+/g, '_'))),
        ...names.filter((n) => n.includes(query.replace(/\s+/g, '_')) && !MATERIAL_PICKS.some(([p]) => p === n)).map((n) => [n, n.replace(/_/g, ' ')] as [string, string]),
      ].slice(0, 80)
  return (
    <div className="mb-4">
      <p className="deck-label mb-2">구글 머티리얼 아이콘</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="찾기 — 한글(보안, 얼굴…) 또는 영어(face, lock…)"
        className="mb-2 h-8 w-full rounded-md border border-[#D9DEEA] px-2 text-[12px] outline-none focus:border-[#4D6BFF]"
        aria-label="머티리얼 아이콘 찾기"
      />
      {list.length ? (
        <div className="grid grid-cols-4 gap-1.5">
          {list.map(([n, l]) => (
            <IconButton key={n} id={`ms:${n}`} label={l} onIcon={onIcon} />
          ))}
        </div>
      ) : (
        <p className="py-3 text-center text-[11px] text-[#9CA3AF]">{query && !names.length ? '불러오는 중…' : '찾는 아이콘이 없어요. 영어로도 찾아 보세요.'}</p>
      )}
    </div>
  )
}

interface LibraryPanelProps {
  onClose: () => void
  onShape: (geom: Geom) => void
  onLine: (kind: LineKind) => void
  onIcon: (id: string) => void
  onNumber: (n: number, style: NumberStyle) => void
  onBlock: (block: BlockDef) => void
  onBox: (box: BlockDef, lock: boolean) => void
  // 지금 슬라이드가 '본문 · 자유 배치'인지, 아니면 바꾸기
  layoutIsFree: boolean
  onUseFree: () => void
  // 오른쪽 패널 '샘플' 탭 안에 넣을 때: 머리줄·테두리 없이
  embedded?: boolean
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

// ⓘ: 마우스를 올렸을 때만 설명을 보여 줍니다. 말풍선은 가장 가까운 relative 상자 너비로 뜹니다.
function InfoTip({ tip, below = false }: { tip: string; below?: boolean }) {
  return (
    <span className="group/tip flex p-0.5" aria-label={tip} onClick={(e) => e.stopPropagation()}>
      <Info size={13} className="text-[#B4BAC9] transition group-hover/tip:text-[#0000A5]" />
      <span
        className={`pointer-events-none absolute left-2 right-2 z-20 whitespace-pre-line rounded-md bg-[#000038] px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white opacity-0 shadow-lg transition group-hover/tip:opacity-100 ${below ? 'top-full mt-1' : 'bottom-full mb-1'}`}
      >
        {tip}
      </span>
    </span>
  )
}

// 항목 이름 + ⓘ (설명은 ⓘ 에 올렸을 때만 — 목록을 단순하게)
function ItemTitle({ label, tip }: { label: string; tip: string }) {
  return (
    <div className="relative flex items-center gap-1 border-t border-[#EEF1F7] px-3 py-2">
      <p className="text-[12px] font-bold text-[#000038]">{label}</p>
      <InfoTip tip={tip} />
    </div>
  )
}

// 웹플로우의 "추가" 패널처럼: 샘플덱에서 가져온 구성 블록 · 아이콘 · 도형을 클릭하거나 슬라이드로 끌어다 놓습니다.
export default function LibraryPanel({ onClose, onShape, onLine, onIcon, onNumber, onBlock, onBox, layoutIsFree, onUseFree, embedded = false }: LibraryPanelProps) {
  const [tab, setTab] = useState<Tab>('boxes')
  const [lockBoxes, setLockBoxes] = useState(false)
  const tabs: [Tab, string][] = [
    ['boxes', '가이드 박스'],
    ['blocks', '블록'],
    ['icons', '아이콘'],
    ['shapes', '도형·선'],
  ]
  return (
    <div className={embedded ? 'flex min-h-0 flex-1 flex-col' : 'flex w-[288px] flex-shrink-0 flex-col border-r border-[#E0E5F0] bg-white'}>
      <div className={embedded ? 'hidden' : 'flex items-center justify-between px-4 pb-2 pt-3'}>
        <div>
          <h3 className="text-[14px] font-bold text-[#000038]">요소 라이브러리</h3>
          <p className="text-[11px] text-[#7A8099]">클릭하거나 슬라이드로 끌어다 놓으세요</p>
        </div>
        <button type="button" className="deck-btn deck-btn-ghost px-1.5" onClick={onClose} aria-label="닫기">
          <X size={16} />
        </button>
      </div>
      <div className={`mx-4 flex rounded-lg bg-[#F2F4FB] p-0.5 ${embedded ? 'mt-3' : ''}`}>
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
            <div className="relative mb-3 rounded-lg bg-[#F5F7FC] px-3 py-2.5">
              <div className="flex items-center gap-1 text-[12px] font-semibold text-[#000038]">
                레이아웃 ‘본문 · 자유 배치’에서 써요
                <InfoTip below tip={'레이아웃의 틀만 같은 크기·위치로 들어가요.\n안의 글·이미지는 자유롭게 배치하고, 박스를 더블클릭하면 바로 글을 쓸 수 있어요.'} />
              </div>
              {!layoutIsFree && (
                <button type="button" className="mt-1 text-[11px] font-semibold text-[#0000A5] hover:underline" onClick={onUseFree}>
                  이 슬라이드를 자유 배치로 바꾸기 →
                </button>
              )}
              <label className="mt-2 flex cursor-pointer items-center gap-2 border-t border-[#E6EAF3] pt-2 text-[12px] text-[#333A4D]">
                <input type="checkbox" checked={lockBoxes} onChange={(e) => setLockBoxes(e.target.checked)} className="accent-[#0000A5]" />
                넣으면서 바로 잠그기
              </label>
            </div>
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
                    <ItemTitle label={b.label} tip={b.description} />
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
                  <ItemTitle label={b.label} tip={`${b.description}\n샘플: ${b.source}`} />
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
                    <IconButton key={i.id} id={i.id} label={i.label} onIcon={onIcon} />
                  ))}
                </div>
              </div>
            ))}
            <MaterialIcons onIcon={onIcon} />
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
            <p className="deck-label mb-2">원 숫자</p>
            <div className="mb-4 space-y-1.5">
              {NUMBER_STYLES.map((st) => (
                <div key={st.id} className="grid grid-cols-6 gap-1">
                  {NUMBERS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      title={`${st.label} · ${n}`}
                      className="flex h-9 items-center justify-center rounded-md hover:bg-[#EEF1FB]"
                      onClick={() => onNumber(n, st.id)}
                      {...dragProps({ type: 'number', n, style: st.id })}
                    >
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{ background: st.fill, color: st.color, boxShadow: st.line ? `inset 0 0 0 1.5px ${st.line}` : undefined }}
                      >
                        {n}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
              <p className="text-[11px] leading-relaxed text-[#9CA3AF]">원과 숫자가 따로 들어가서 색을 각각 바꿀 수 있어요. 원 가장자리를 누르면 원, 가운데를 누르면 숫자가 선택돼요.</p>
            </div>
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
