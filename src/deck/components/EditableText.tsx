import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { ptToPx } from '../guide'
import { listClass, textStyle } from '../textStyle'
import type { TextEl } from '../types'

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function toHtml(value: string, multiline: boolean) {
  if (!multiline) return escapeHtml(value)
  return value
    .split('\n')
    .map((line) => `<div>${escapeHtml(line) || '<br>'}</div>`)
    .join('')
}

function readValue(node: HTMLElement, multiline: boolean) {
  const text = node.innerText.replace(/ /g, ' ')
  return multiline ? text.replace(/\n$/, '') : text.replace(/\n/g, ' ')
}

interface EditableTextProps {
  el: TextEl
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
}

// 레이아웃 칸 안에서 바로 입력하는 편집기. 글꼴·크기·색은 레이아웃이 정하고 사용자는 글만 씁니다.
// 커서가 튀지 않도록 입력 중에는 DOM 을 다시 그리지 않고(uncontrolled), 포커스가 없을 때만 값을 반영합니다.
export default function EditableText({ el, value, onChange, onFocus }: EditableTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const multiline = !!el.multiline
  const [empty, setEmpty] = useState(!value)
  const [overflow, setOverflow] = useState(false)

  const measure = useCallback(() => {
    const node = ref.current
    if (node) setOverflow(node.offsetHeight > el.h + 2)
  }, [el.h])

  useLayoutEffect(() => {
    const node = ref.current
    if (!node || document.activeElement === node) return
    node.innerHTML = toHtml(value, multiline)
    setEmpty(!value)
    measure()
  }, [value, multiline, measure])

  const handleInput = () => {
    const node = ref.current
    if (!node) return
    const next = readValue(node, multiline)
    setEmpty(!next.trim())
    measure()
    onChange(next)
  }

  const paraSpace = el.paraSpace ? ptToPx(el.paraSpace) : 0

  return (
    <div
      className={`deck-field${overflow ? ' is-overflow' : ''}`}
      style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, minHeight: el.h }}
    >
      {empty && (
        <div className="deck-placeholder" style={{ ...textStyle(el), color: el.color }} aria-hidden>
          {el.placeholder}
        </div>
      )}
      <div
        ref={ref}
        role="textbox"
        aria-label={el.placeholder}
        aria-multiline={multiline}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className={`deck-editable ${listClass(el)}`}
        style={{ ...textStyle(el), minHeight: el.h, ['--para-space' as string]: `${paraSpace}px` }}
        onInput={handleInput}
        onFocus={onFocus}
        onBlur={() => {
          const node = ref.current
          if (node) node.innerHTML = toHtml(readValue(node, multiline), multiline)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline) e.preventDefault()
          if (e.key === 'Escape') (e.target as HTMLElement).blur()
        }}
        onPaste={(e) => {
          e.preventDefault()
          let text = e.clipboardData.getData('text/plain')
          if (!multiline) text = text.replace(/\s*\n\s*/g, ' ')
          document.execCommand('insertText', false, text)
        }}
      />
      {overflow && <span className="deck-overflow-badge">영역 초과 · 줄여주세요</span>}
    </div>
  )
}
