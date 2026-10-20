import { memo, useEffect, useState } from 'react'
import { BRAND } from '../guide'
import { resolveIcons } from '../library'
import type { FreeObj } from '../types'
import FreeLayer from './FreeLayer'

// 요소 묶음 미리보기: 실제 요소를 작게 그립니다 (아이콘은 칠한 뒤 표시)
export default memo(function ObjectsPreview({ objects, width, maxHeight = 96 }: { objects: FreeObj[]; width: number; maxHeight?: number }) {
  const [objs, setObjs] = useState<FreeObj[]>(objects)
  useEffect(() => {
    let alive = true
    setObjs(objects)
    resolveIcons(objects).then((r) => alive && setObjs(r))
    return () => {
      alive = false
    }
  }, [objects])
  if (!objs.length) return null
  const minX = Math.min(...objs.map((o) => o.x))
  const minY = Math.min(...objs.map((o) => o.y))
  const w = Math.max(...objs.map((o) => o.x + o.w)) - minX
  const h = Math.max(...objs.map((o) => o.y + o.h)) - minY
  const pad = 12
  const scale = Math.min((width - pad * 2) / w, maxHeight / h)
  return (
    <div className="relative overflow-hidden rounded-md bg-white" style={{ width: width - 2, height: h * scale + pad * 2, fontFamily: BRAND.font.web }}>
      <div style={{ position: 'absolute', left: (width - w * scale) / 2 - minX * scale, top: pad - minY * scale, width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        <FreeLayer objects={objs} scale={scale} />
      </div>
    </div>
  )
})
