import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

// 부모 너비를 재서 자식에게 넘겨줍니다. 카드 크기에 맞춰 슬라이드 썸네일을 그릴 때 사용합니다.
export default function FitWidth({ children }: { children: (width: number) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full">
      {width > 0 && children(width)}
    </div>
  )
}
