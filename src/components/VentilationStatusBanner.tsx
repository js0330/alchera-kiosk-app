import { Fan, PowerOff } from 'lucide-react'
import { facilities } from '../data/facilities'

export default function VentilationStatusBanner() {
  const activeCount = facilities.filter((f) => f.ventilationOn).length
  const isRunning = activeCount > 0

  return (
    <div>
      <p className="text-label font-bold text-primary-navy">환기 가동 상태</p>
      <div
        className={`mt-2 flex items-center gap-4 rounded-2xl px-6 py-4 ${
          isRunning ? 'bg-primary-blue/10' : 'bg-bg-panel'
        }`}
      >
        {isRunning ? (
          <Fan size={32} className="flex-shrink-0 text-primary-blue" />
        ) : (
          <PowerOff size={32} className="flex-shrink-0 text-text-light" />
        )}
        <div>
          <p className={`text-headline ${isRunning ? 'text-primary-blue' : 'text-text-light'}`}>
            {isRunning ? '가동 중' : '정지'}
          </p>
          <p className="text-base text-text-gray">
            {isRunning ? `${activeCount}개 공간에서 정상 운전 중이에요` : '현재 가동 중인 환기 설비가 없어요'}
          </p>
        </div>
      </div>
    </div>
  )
}
