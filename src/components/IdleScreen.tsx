import { Hand } from 'lucide-react'
import BuildingStatusHero from './BuildingStatusHero'
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
    <div className="flex flex-col gap-6 p-7">
      <div className="text-center">
        <p className="text-caption font-semibold uppercase tracking-wide text-text-light">{kioskLocation}</p>
        <h1 className="text-card-title text-primary-navy">우리 건물 공기질 현황</h1>
      </div>

      <BuildingStatusHero status={overallStatus} />

      <div className="flex flex-col gap-2.5">
        {facilities.map((facility) => (
          <div
            key={facility.id}
            className="flex items-center gap-3 rounded-xl border border-border-gray bg-bg-panel px-5 py-4"
          >
            <FacilityIcon icon={facility.icon} className="flex-shrink-0 text-primary-blue" size={30} />
            <p className="flex-1 text-label text-primary-navy">{facility.name}</p>
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
  )
}
