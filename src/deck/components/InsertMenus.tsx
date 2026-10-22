import { ChevronDown, Minus, Shapes } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LINE_KINDS, type LineKind } from '../freeObjects'
import { SHAPES, pointsAttr, shapePoints } from '../shapes'
import { dragProps } from '../insert'
import type { Geom } from '../types'

export function ShapeIcon({ geom, size = 28 }: { geom: Geom; size?: number }) {
  const w = size
  const h = /Arrow|homePlate|chevron|parallelogram|trapezoid|round2SameRect|wedgeRectCallout/.test(geom) && !/^(up|down|upDown)Arrow$/.test(geom) ? size * 0.62 : size
  const pts = shapePoints(geom, w, h)
  const common = { fill: '#E5E9F7', stroke: '#0000A5', strokeWidth: 1.4 }
  return (
    <svg width={size} height={size} viewBox={`-2 -2 ${size + 4} ${size + 4}`} style={{ overflow: 'visible' }}>
      <g transform={`translate(0 ${(size - h) / 2})`}>
        {pts ? (
          <polygon points={pointsAttr(pts)} {...common} strokeLinejoin="round" />
        ) : geom === 'ellipse' ? (
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} {...common} />
        ) : geom === 'round2SameRect' ? (
          <path d={`M0,${h} V6 Q0,0 6,0 H${w - 6} Q${w},0 ${w},6 V${h} Z`} {...common} />
        ) : (
          <rect width={w} height={h} rx={geom === 'roundRect' ? 6 : 0} {...common} />
        )}
      </g>
    </svg>
  )
}

export function LineIcon({ kind, width = 40 }: { kind: LineKind; width?: number }) {
  const dash = kind.dash === 'dash' ? '5 3' : kind.dash === 'dot' ? '1.5 1.5' : undefined
  const end = (e: LineKind['arrowEnd'], x: number, dir: 1 | -1) =>
    e === 'triangle' ? (
      <path d={`M${x},6 L${x - 8 * dir},1.5 L${x - 8 * dir},10.5 z`} fill="#0000A5" />
    ) : e === 'oval' ? (
      <circle cx={x - 3 * dir} cy={6} r={3} fill="#0000A5" />
    ) : null
  return (
    <svg width={width} height="12" viewBox={`0 0 ${width} 12`}>
      <line x1={kind.arrowStart ? 6 : 1} y1="6" x2={kind.arrowEnd ? width - 6 : width - 1} y2="6" stroke="#0000A5" strokeWidth="1.6" strokeDasharray={dash} />
      {end(kind.arrowStart, 1, -1)}
      {end(kind.arrowEnd, width - 1, 1)}
    </svg>
  )
}

// 툴바 버튼 + 아래로 펼쳐지는 메뉴 (툴바가 가로 스크롤이라 화면 기준 위치에 띄웁니다)
//  compact: 아이콘만 보이는 버튼 (이름은 마우스를 올리면) · align right: 버튼 오른쪽 끝에 맞춰 펼침
//  trigger: 버튼 모양을 직접 정할 때 (예: 다운로드 버튼)
export function Dropdown({
  label,
  icon,
  compact = false,
  align = 'left',
  buttonClass = 'deck-btn deck-btn-ghost',
  caret = true,
  keepFocus = false,
  children,
}: {
  label: string
  icon?: ReactNode
  compact?: boolean
  align?: 'left' | 'right'
  buttonClass?: string
  caret?: boolean
  // 글을 고치는 중에 눌러도 글 선택이 풀리지 않게 (글자 일부 서식)
  keepFocus?: boolean
  children: (close: () => void) => ReactNode
}) {
  const [pos, setPos] = useState<{ left?: number; right?: number; top: number } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!pos) return
    const close = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setPos(null)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setPos(null)
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', esc)
    }
  }, [pos])
  return (
    <>
      <button
        ref={btn}
        type="button"
        title={compact ? label : undefined}
        aria-label={label}
        className={`${buttonClass} ${pos ? 'bg-[#EEF1FB]' : ''}`}
        onMouseDown={(e) => keepFocus && e.preventDefault()}
        onClick={() => {
          const r = btn.current!.getBoundingClientRect()
          setPos(pos ? null : align === 'right' ? { right: window.innerWidth - r.right, top: r.bottom + 6 } : { left: Math.min(r.left, window.innerWidth - 340), top: r.bottom + 6 })
        }}
      >
        {icon} {compact ? null : label} {caret && <ChevronDown size={13} className="-ml-0.5 opacity-60" />}
      </button>
      {pos && (
        <div
          ref={menu}
          className="fixed z-50 rounded-xl border border-[#E0E5F0] bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,56,0.16)]"
          style={pos}
          onMouseDown={(e) => keepFocus && e.preventDefault()}
        >
          {children(() => setPos(null))}
        </div>
      )}
    </>
  )
}

export interface MenuItem {
  label: string
  icon?: ReactNode
  hint?: string
  disabled?: boolean
  onClick: () => void
}

// 메뉴 항목 목록 (null 은 구분선)
export function MenuList({ items, close }: { items: (MenuItem | null)[]; close: () => void }) {
  return (
    <div className="min-w-[220px]">
      {items.map((it, i) =>
        it ? (
          <button
            key={it.label}
            type="button"
            disabled={it.disabled}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-[#1A1D3D] hover:bg-[#EEF1FB] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
            onClick={() => {
              it.onClick()
              close()
            }}
          >
            <span className="flex w-4 justify-center text-[#5A6080]">{it.icon}</span>
            <span className="flex-1">{it.label}</span>
            {it.hint && <span className="text-[11px] text-[#9CA3AF]">{it.hint}</span>}
          </button>
        ) : (
          <div key={`sep-${i}`} className="my-1 h-px bg-[#EEF1F7]" />
        ),
      )}
    </div>
  )
}

export function ShapeMenu({ onPick, compact }: { onPick: (geom: Geom) => void; compact?: boolean }) {
  return (
    <Dropdown label="도형" icon={<Shapes size={16} />} compact={compact}>
      {(close) => (
        <div className="w-[300px] space-y-3 p-1.5">
          {(['기본 도형', '화살표'] as const).map((g) => (
            <div key={g}>
              <p className="deck-label mb-1.5">{g}</p>
              <div className="grid grid-cols-7 gap-1">
                {SHAPES.filter((s) => s.group === g).map((s) => (
                  <button
                    key={s.geom}
                    type="button"
                    title={s.label}
                    aria-label={s.label}
                    className="flex h-10 items-center justify-center rounded-md hover:bg-[#EEF1FB]"
                    {...dragProps({ type: 'shape', geom: s.geom })}
                    onClick={() => {
                      onPick(s.geom)
                      close()
                    }}
                  >
                    <ShapeIcon geom={s.geom} size={24} />
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-[#9CA3AF]">클릭하면 가운데에, 끌어다 놓으면 그 자리에 들어가요</p>
        </div>
      )}
    </Dropdown>
  )
}

export function LineMenu({ onPick, compact }: { onPick: (kind: LineKind) => void; compact?: boolean }) {
  return (
    <Dropdown label="선" icon={<Minus size={16} />} compact={compact}>
      {(close) => (
        <div className="w-[200px] space-y-0.5 p-1">
          {LINE_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-[13px] text-[#333A4D] hover:bg-[#EEF1FB]"
              {...dragProps({ type: 'line', id: k.id })}
              onClick={() => {
                onPick(k)
                close()
              }}
            >
              <LineIcon kind={k} />
              {k.label}
            </button>
          ))}
          <p className="px-2 pt-1 text-[11px] text-[#9CA3AF]">양 끝 동그라미를 끌어 방향을 바꿔요 (Shift: 수평·수직)</p>
        </div>
      )}
    </Dropdown>
  )
}
