import type { DragEvent } from 'react'
import type { Geom } from './types'

export type NumberStyle = 'fill' | 'line' | 'soft'

// 도형 메뉴·요소 라이브러리 항목을 슬라이드로 끌어다 놓을 때 주고받는 값
export const INSERT_MIME = 'application/x-alchera-insert'
export type InsertPayload = { type: 'shape'; geom: Geom } | { type: 'line'; id: string } | { type: 'icon'; id: string } | { type: 'block'; id: string } | { type: 'box'; id: string } | { type: 'number'; n: number; style: NumberStyle }

export const dragProps = (payload: InsertPayload) => ({
  draggable: true,
  onDragStart: (e: DragEvent) => {
    e.dataTransfer.setData(INSERT_MIME, JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  },
})
