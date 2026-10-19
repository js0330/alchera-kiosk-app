import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { memo, type CSSProperties } from 'react'
import { BRAND, SLIDE_H, SLIDE_W, TONES, ptToPx } from '../guide'
import { buildSlide, slideTone } from '../layouts'
import type { ImageEl, Slide, SlideEl, TextEl } from '../types'
import { listClass, textStyle } from '../textStyle'
import EditableText from './EditableText'

interface SlideCanvasProps {
  slide: Slide
  index: number
  footer: string
  section?: string
  width: number
  editable?: boolean
  showPlaceholders?: boolean
  onFieldChange?: (key: string, value: string) => void
  onImagePick?: (key: string) => void
  onImageClear?: (key: string) => void
}

const box = (el: SlideEl): CSSProperties => ({ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h })

function StaticText({ el, value, placeholder }: { el: TextEl; value: string; placeholder: boolean }) {
  const showPh = !value.trim() && placeholder && el.placeholder
  if (!value.trim() && !showPh) return null
  const style: CSSProperties = { ...box(el), ...textStyle(el), ['--para-space' as string]: `${el.paraSpace ? ptToPx(el.paraSpace) : 0}px` }
  if (showPh) return <div style={{ ...style, opacity: 0.35 }}>{el.placeholder}</div>
  if (el.list) {
    return (
      <div className={listClass(el)} style={style}>
        {value
          .split('\n')
          .filter((l) => l.trim())
          .map((line, i) => (
            <div key={i}>{line}</div>
          ))}
      </div>
    )
  }
  return <div style={style}>{value}</div>
}

function ImageBox({
  el,
  src,
  editable,
  onPick,
  onClear,
}: {
  el: ImageEl
  src?: string
  editable?: boolean
  onPick?: () => void
  onClear?: () => void
}) {
  if (el.logo) {
    return <img src={BRAND.logo[el.logo]} alt="ALCHERA" style={box(el)} draggable={false} />
  }
  if (src) {
    return (
      <div style={box(el)} className="deck-image group">
        <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
        {editable && (
          <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
            <button type="button" className="deck-image-btn" onClick={onPick}>
              <RefreshCw size={22} /> 교체
            </button>
            <button type="button" className="deck-image-btn" onClick={onClear}>
              <Trash2 size={22} /> 삭제
            </button>
          </div>
        )}
      </div>
    )
  }
  const inner = (
    <>
      <ImagePlus size={56} strokeWidth={1.5} />
      <span style={{ fontSize: 22, marginTop: 12 }}>{editable ? '클릭해서 이미지 넣기' : '이미지'}</span>
    </>
  )
  const style: CSSProperties = {
    ...box(el),
    background: el.fill,
    color: el.muted,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }
  return editable ? (
    <button type="button" style={style} className="deck-image-empty" onClick={onPick}>
      {inner}
    </button>
  ) : (
    <div style={style}>{inner}</div>
  )
}

// 슬라이드 한 장을 1280×720 좌표로 그린 뒤 원하는 너비로 축소해 보여줍니다.
// 썸네일·편집 캔버스·발표 모드가 모두 이 컴포넌트를 씁니다.
function SlideCanvas({
  slide,
  index,
  footer,
  section = '',
  width,
  editable,
  showPlaceholders = true,
  onFieldChange,
  onImagePick,
  onImageClear,
}: SlideCanvasProps) {
  const els = buildSlide(slide, index, footer, section)
  const scale = width / SLIDE_W
  const palette = TONES[slideTone(slide)]

  return (
    <div style={{ width, height: SLIDE_H * scale, position: 'relative', overflow: 'hidden' }}>
      <div
        className="deck-slide"
        style={{
          position: 'absolute',
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
          background: palette.bg,
          fontFamily: BRAND.font.web,
        }}
      >
        {els.map((el, i) => {
          const key = `${el.type}-${'field' in el && el.field ? el.field : i}`
          switch (el.type) {
            case 'rect':
            case 'ellipse':
              return (
                <div
                  key={key}
                  style={{
                    ...box(el),
                    background: el.fill,
                    border: el.line ? `${ptToPx(el.lineWidth ?? 1)}px solid ${el.line}` : undefined,
                    borderRadius: el.type === 'ellipse' ? '50%' : el.radius,
                    opacity: el.opacity,
                  }}
                />
              )
            case 'line':
              return (
                <div
                  key={key}
                  style={{
                    ...box(el),
                    height: el.h || undefined,
                    width: el.w || undefined,
                    borderTop: el.h === 0 ? `${ptToPx(el.width)}px solid ${el.color}` : undefined,
                    borderLeft: el.w === 0 ? `${ptToPx(el.width)}px solid ${el.color}` : undefined,
                  }}
                />
              )
            case 'image':
              return (
                <ImageBox
                  key={key}
                  el={el}
                  src={el.field ? slide.content[el.field] : undefined}
                  editable={editable}
                  onPick={() => el.field && onImagePick?.(el.field)}
                  onClear={() => el.field && onImageClear?.(el.field)}
                />
              )
            case 'text': {
              const value = el.field ? (slide.content[el.field] ?? '') : (el.text ?? '')
              if (editable && el.field && onFieldChange) {
                const field = el.field
                return <EditableText key={`${slide.id}-${key}`} el={el} value={value} onChange={(v) => onFieldChange(field, v)} />
              }
              return <StaticText key={key} el={el} value={value} placeholder={showPlaceholders && !!el.field} />
            }
          }
        })}
      </div>
    </div>
  )
}

export default memo(SlideCanvas)
