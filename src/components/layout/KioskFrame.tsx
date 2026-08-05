import { useEffect, useState, type ReactNode } from 'react'
import { buildingName } from '../../data/facilities'

interface KioskFrameProps {
  children: ReactNode
  onInteraction: () => void
}

export default function KioskFrame({ children, onInteraction }: KioskFrameProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(timer)
  }, [])

  const dateLabel = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  const timeLabel = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#cfd4e6] py-8">
      <div
        onClick={onInteraction}
        onPointerDown={onInteraction}
        className="flex h-[960px] w-[540px] flex-col overflow-hidden rounded-[2rem] border-[10px] border-primary-navy bg-bg-white shadow-2xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between bg-primary-navy px-7 py-5 text-white">
          <div>
            <img src="/alchera-logo.png" alt="ALCHERA" className="w-[140px]" />
            <p className="mt-1 text-caption text-white/60">{buildingName}</p>
          </div>
          <div className="text-right">
            <p className="text-label font-bold">{timeLabel}</p>
            <p className="text-caption text-white/60">{dateLabel}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-bg-white">{children}</div>

        <div className="flex-shrink-0 border-t border-border-gray bg-bg-panel px-7 py-3 text-center">
          <p className="text-caption text-text-light">이 건물은 알체라 밀폐공간 안전 예측 AI로 관리되고 있어요</p>
        </div>
      </div>
    </div>
  )
}
