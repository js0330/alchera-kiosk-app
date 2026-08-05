import { Fan, Hand } from 'lucide-react'
import StatusLegendBlocks from './StatusLegendBlocks'
import VentilationStatusBanner from './VentilationStatusBanner'
import FacilityIcon from './FacilityIcon'
import StatusBadge from './common/StatusBadge'
import { facilities, kioskLocation } from '../data/facilities'
import { worstStatus } from '../lib/status'

interface IdleScreenProps {
  onEnter: () => void
}

export default function IdleScreen({ onEnter }: IdleScreenProps) {
  const overallStatus = worstStatus(facilities)

  return (
    <div className="flex flex-col gap-6 pb-7">
      <div className="bg-primary-blue px-7 py-5 text-center">
        <h1 className="text-card-title text-white">실내 공기질 안전 안내</h1>
        <p className="mt-1 text-caption font-semibold uppercase tracking-wide text-white/70">{kioskLocation}</p>
      </div>

      <div className="flex flex-col gap-6 px-7">
        <StatusLegendBlocks activeStatus={overallStatus} />

        <VentilationStatusBanner />

        <div className="flex flex-col gap-2.5">
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className="flex items-center gap-3 rounded-xl border border-border-gray bg-bg-panel px-5 py-4"
            >
              <FacilityIcon icon={facility.icon} className="flex-shrink-0 text-primary-blue" size={30} />
              <p className="flex-1 text-label text-primary-navy">{facility.name}</p>
              {facility.ventilationOn && <Fan size={20} className="flex-shrink-0 text-primary-blue" />}
              <StatusBadge status={facility.status} />
            </div>
          ))}
        </div>

        <button
          onClick={onEnter}
          className="mt-1 flex animate-pulse items-center justify-center gap-3 rounded-2xl bg-primary-blue py-6 text-label font-bold text-white"
        >
          <Hand size={28} />
          화면을 터치해서 자세히 보기
        </button>
      </div>
    </div>
  )
}
