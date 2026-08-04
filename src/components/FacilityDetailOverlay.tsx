import { X } from 'lucide-react'
import type { Facility } from '../types'
import FacilityIcon from './FacilityIcon'
import StatusBadge from './common/StatusBadge'

interface FacilityDetailOverlayProps {
  facility: Facility | null
  onClose: () => void
}

export default function FacilityDetailOverlay({ facility, onClose }: FacilityDetailOverlayProps) {
  const open = !!facility

  return (
    <div
      className={`absolute inset-0 z-30 transition-opacity duration-300 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-primary-navy/40" />
      <div
        className={`absolute bottom-0 left-0 right-0 max-h-[80%] overflow-y-auto rounded-t-[2rem] bg-bg-white p-7 transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {facility && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FacilityIcon icon={facility.icon} className="text-primary-blue" size={36} />
                <h2 className="text-card-title text-primary-navy">{facility.name}</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-bg-panel text-text-gray"
              >
                <X size={24} />
              </button>
            </div>

            <StatusBadge status={facility.status} size="lg" />

            <p className="text-label leading-relaxed text-text-gray">{facility.plainMessage}</p>

            <div className="rounded-2xl border border-border-gray bg-bg-panel p-6">
              <p className="text-label font-bold text-primary-navy">자세히 보기</p>
              <div className="mt-3 grid grid-cols-2 gap-y-3 text-base text-text-gray">
                <span>온도 {facility.temp}℃</span>
                <span>습도 {facility.humidity}%</span>
                <span>이산화탄소 {facility.co2}ppm</span>
                <span>미세먼지 {facility.pm25}㎍/㎥</span>
              </div>
            </div>

            <p className="text-caption text-text-light">최근 갱신 {facility.lastUpdated}</p>
          </div>
        )}
      </div>
    </div>
  )
}
