import { ArrowDownToLine, ArrowUpToLine, Bold, Copy, Lock, TextAlignCenter, TextAlignEnd, TextAlignStart, Trash2, WandSparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { BRAND } from '../guide'
import { GUIDE_FILLS, GUIDE_ICON_COLORS, GUIDE_LINES, GUIDE_TEXT_COLORS, GUIDE_TEXT_SIZES, hasRadius, maxRadius } from '../freeObjects'
import { SHAPES } from '../shapes'
import type { FreeObj, Geom, LineDash, LineEnd } from '../types'

interface ObjectPanelProps {
  objs: FreeObj[]
  onPatch: (patch: Partial<FreeObj>) => void
  onRemove: () => void
  onDuplicate: () => void
  onOrder: (dir: 'front' | 'back') => void
  onSnap: () => void
  onLock: () => void
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

const LINE_WIDTHS = [0.75, 1, 1.5, 2.25, 3] as const
const RADII = [0, 4, 8, 12, 16, 24] as const

// 모서리 둥글기: 자주 쓰는 값 + 슬라이더(px, 1280 기준) · 최대는 짧은 변의 절반(알약 모양)
function RadiusRow({ objs, onPatch }: { objs: FreeObj[]; onPatch: (patch: Partial<FreeObj>) => void }) {
  const o = objs[0]
  const max = Math.floor(Math.min(...objs.map(maxRadius)))
  const cur = Math.min(o.radius ?? (o.kind === 'image' ? 0 : 12), max)
  return (
    <div className="space-y-1.5">
      <Row label="모서리 둥글기">
        {RADII.filter((r) => r <= max).map((r) => (
          <button key={r} type="button" className={chip(Math.round(cur) === r)} onClick={() => onPatch({ radius: r })}>
            {r}
          </button>
        ))}
        <button type="button" className={chip(Math.round(cur) === max)} onClick={() => onPatch({ radius: max })} title="짧은 변의 절반 — 알약·원 모양">
          최대
        </button>
      </Row>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={max}
          value={Math.round(cur)}
          onChange={(e) => onPatch({ radius: Number(e.target.value) })}
          className="flex-1 accent-[#0000A5]"
          aria-label="모서리 둥글기"
        />
        <input
          type="number"
          min={0}
          max={max}
          value={Math.round(cur)}
          onChange={(e) => onPatch({ radius: Math.max(0, Math.min(max, Number(e.target.value) || 0)) })}
          className="h-7 w-14 rounded-md border border-[#E0E5F0] px-1.5 text-right text-[12px] tabular-nums outline-none focus:border-[#4D6BFF]"
          aria-label="모서리 둥글기 값"
        />
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex-shrink-0 text-[12px] text-[#666]">{label}</span>
      <div className="flex flex-wrap justify-end gap-[3px]">{children}</div>
    </div>
  )
}

function Swatch({ color, active, onClick }: { color?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color ? (COLOR_NAMES[color] ?? color) : '없음'}
      className={`h-[22px] w-[22px] rounded-md border ${active ? 'ring-2 ring-[#4D6BFF] ring-offset-1' : ''} ${color ? 'border-black/10' : 'border-dashed border-[#B6BCD0]'}`}
      style={{ background: color ?? 'transparent' }}
    >
      {!color && <span className="block text-[10px] text-[#B6BCD0]">✕</span>}
    </button>
  )
}

const chip = (active: boolean) =>
  `h-7 min-w-[30px] rounded-md px-1.5 text-[12px] font-semibold tabular-nums ${active ? 'bg-[#0000A5] text-white' : 'bg-[#F2F4FB] text-[#333A4D] hover:bg-[#E5E9F7]'}`

// 선 끝 모양 미리보기
function EndIcon({ end, start }: { end: LineEnd; start?: boolean }) {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" style={{ transform: start ? 'scaleX(-1)' : undefined }}>
      <line x1="1" y1="6" x2={end === 'triangle' ? 14 : 17} y2="6" stroke="currentColor" strokeWidth="1.6" />
      {end === 'triangle' && <path d="M13,1.5 L21,6 L13,10.5 z" fill="currentColor" />}
      {end === 'oval' && <circle cx="17" cy="6" r="3.5" fill="currentColor" />}
    </svg>
  )
}

// 실선 · 점선 · 점 (선과 도형 테두리 공통)
function DashChips({ value, onPatch }: { value?: LineDash; onPatch: (patch: Partial<FreeObj>) => void }) {
  const dashes: [LineDash, string][] = [
    ['solid', '실선'],
    ['dash', '점선'],
    ['dot', '점'],
  ]
  return (
    <>
      {dashes.map(([d, label]) => (
        <button key={d} type="button" className={chip((value ?? 'solid') === d)} onClick={() => onPatch({ dash: d === 'solid' ? undefined : d })}>
          <span className="flex items-center gap-1">
            <svg width="16" height="6" viewBox="0 0 16 6">
              <line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth="1.6" strokeDasharray={d === 'dash' ? '4 2.5' : d === 'dot' ? '1.5 1.5' : undefined} />
            </svg>
            {label}
          </span>
        </button>
      ))}
    </>
  )
}

function kindName(o: FreeObj) {
  if (o.kind === 'image') return o.icon ? '아이콘' : '이미지'
  if (o.kind === 'line') return o.arrowEnd || o.arrowStart ? '화살표' : '선'
  if (o.geom && o.geom !== 'rect') return SHAPES.find((s) => s.geom === o.geom)?.label ?? '도형'
  return o.fill || o.line ? '도형' : '텍스트'
}

// 선택한 요소(하나 또는 여러 개)의 속성. 고를 수 있는 값은 가이드 값(크기·색)으로만 제한합니다.
// 여러 개를 고르면 바꾼 값이 모두에게 한꺼번에 적용됩니다.
export default function ObjectPanel({ objs, onPatch, onRemove, onDuplicate, onOrder, onSnap, onLock }: ObjectPanelProps) {
  const shapes = objs.filter((o) => o.kind === 'shape')
  const lines = objs.filter((o) => o.kind === 'line')
  const icons = objs.filter((o) => o.kind === 'image' && o.icon)
  const s0 = shapes[0]
  const l0 = lines[0]
  const offGuideSize = s0?.text && !GUIDE_TEXT_SIZES.includes((s0.size ?? 10) as (typeof GUIDE_TEXT_SIZES)[number])
  const title = objs.length === 1 ? kindName(objs[0]) : `${objs.length}개 선택`

  return (
    <section className="space-y-3 border-b border-[#E0E5F0] p-4">
      <div className="flex items-center justify-between">
        <h3 className="deck-label">선택한 요소 · {title}</h3>
        {objs.length === 1 && (
          <span className="text-[11px] tabular-nums text-[#9CA3AF]">
            {Math.round(objs[0].w)}×{Math.round(objs[0].h)}
          </span>
        )}
      </div>

      {s0 && (
        <>
          <Row label="모양">
            <select
              value={s0.geom ?? 'rect'}
              onChange={(e) => onPatch({ geom: e.target.value as Geom, radius: e.target.value === 'roundRect' ? (s0.radius ?? 12) : s0.radius })}
              className="h-7 rounded-md border border-[#E0E5F0] bg-white px-1.5 text-[12px] text-[#333A4D] outline-none focus:border-[#4D6BFF]"
              aria-label="도형 모양"
            >
              {(['기본 도형', '화살표'] as const).map((g) => (
                <optgroup key={g} label={g}>
                  {SHAPES.filter((x) => x.group === g).map((x) => (
                    <option key={x.geom} value={x.geom}>
                      {x.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Row>
          <Row label="글자 크기">
            {GUIDE_TEXT_SIZES.map((s) => (
              <button key={s} type="button" className={chip(s0.size === s)} onClick={() => onPatch({ size: s })}>
                {s}
              </button>
            ))}
          </Row>
          {offGuideSize && <p className="text-right text-[11px] text-[#F1A11D]">지금 {s0.size}pt — 가이드 크기가 아니에요</p>}
          <Row label="글자 색">
            {GUIDE_TEXT_COLORS.map((c) => (
              <Swatch key={c} color={c} active={s0.color === c} onClick={() => onPatch({ color: c })} />
            ))}
          </Row>
          <Row label="굵게 · 정렬">
            <button type="button" className={chip(!!s0.bold)} onClick={() => onPatch({ bold: !s0.bold })} aria-label="굵게">
              <Bold size={14} className="mx-auto" />
            </button>
            {(
              [
                ['left', TextAlignStart],
                ['center', TextAlignCenter],
                ['right', TextAlignEnd],
              ] as const
            ).map(([a, Icon]) => (
              <button key={a} type="button" className={chip((s0.align ?? 'left') === a)} onClick={() => onPatch({ align: a })} aria-label={a}>
                <Icon size={14} className="mx-auto" />
              </button>
            ))}
          </Row>
          <Row label="채우기">
            <Swatch active={!s0.fill} onClick={() => onPatch({ fill: undefined })} />
            {GUIDE_FILLS.map((c) => (
              <Swatch key={c} color={c} active={s0.fill === c} onClick={() => onPatch({ fill: c, ...(c === BRAND.colors.navy || c === BRAND.colors.blue ? { color: BRAND.colors.white } : {}) })} />
            ))}
          </Row>
          <Row label="테두리 색">
            <Swatch active={!s0.line} onClick={() => onPatch({ line: undefined })} />
            {GUIDE_LINES.map((c) => (
              <Swatch key={c} color={c} active={s0.line === c} onClick={() => onPatch({ line: c, lineWidth: s0.lineWidth ?? 0.75 })} />
            ))}
          </Row>
          {s0.line && (
            <>
              <Row label="테두리 두께">
                {LINE_WIDTHS.map((w) => (
                  <button key={w} type="button" className={chip((s0.lineWidth ?? 0.75) === w)} onClick={() => onPatch({ lineWidth: w })}>
                    {w}
                  </button>
                ))}
              </Row>
              <Row label="테두리 모양">
                <DashChips value={s0.dash} onPatch={onPatch} />
              </Row>
            </>
          )}
        </>
      )}

      {objs.some(hasRadius) && <RadiusRow objs={objs.filter(hasRadius)} onPatch={onPatch} />}

      {l0 && (
        <>
          <Row label="선 색">
            {GUIDE_LINES.map((c) => (
              <Swatch key={c} color={c} active={l0.line === c} onClick={() => onPatch({ line: c })} />
            ))}
          </Row>
          <Row label="선 두께">
            {LINE_WIDTHS.map((w) => (
              <button key={w} type="button" className={chip((l0.lineWidth ?? 1) === w)} onClick={() => onPatch({ lineWidth: w })}>
                {w}
              </button>
            ))}
          </Row>
          <Row label="선 모양">
            <DashChips value={l0.dash} onPatch={onPatch} />
          </Row>
          {(['arrowStart', 'arrowEnd'] as const).map((key) => (
            <Row key={key} label={key === 'arrowStart' ? '시작 모양' : '끝 모양'}>
              {(['none', 'triangle', 'oval'] as LineEnd[]).map((end) => (
                <button
                  key={end}
                  type="button"
                  className={chip((l0[key] ?? 'none') === end)}
                  onClick={() => onPatch({ [key]: end === 'none' ? undefined : end })}
                  aria-label={end}
                >
                  <span className="flex justify-center">
                    <EndIcon end={end} start={key === 'arrowStart'} />
                  </span>
                </button>
              ))}
            </Row>
          ))}
        </>
      )}

      {icons.length > 0 && (
        <Row label="아이콘 색">
          {GUIDE_ICON_COLORS.map((c) => (
            <Swatch key={c} color={c} active={icons[0].color === c} onClick={() => onPatch({ color: c })} />
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
        <button
          type="button"
          className="deck-btn col-span-2 h-8 justify-center px-2 text-[12px]"
          onClick={onLock}
          title="잠근 요소는 클릭·끌기·선택이 되지 않아요. 가이드 박스를 고정해 두고 안에서 작업할 때 쓰세요."
        >
          <Lock size={14} /> 잠그기 (위치 고정)
        </button>
        {(shapes.length > 0 || lines.length > 0) && (
          <button type="button" className="deck-btn col-span-2 h-8 justify-center px-2 text-[12px]" onClick={onSnap}>
            <WandSparkles size={14} /> 선택한 요소 가이드 서식 맞추기
          </button>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-[#9CA3AF]">
        더블클릭으로 글 수정 · Shift+클릭·빈 곳 끌기로 여러 개 선택 · Ctrl+A 전체 선택 · Ctrl+C / V 복사·붙여넣기 · Ctrl+Z 되돌리기 · 방향키 이동
      </p>
    </section>
  )
}
