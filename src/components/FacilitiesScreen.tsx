import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import FacilityIcon from './FacilityIcon'
import FacilityDetailOverlay from './FacilityDetailOverlay'
import StatusBadge from './common/StatusBadge'
import { facilities } from '../data/facilities'
import type { Facility } from '../types'

interface FacilitiesScreenProps {
  onBack: () => void
}

export default function FacilitiesScreen({ onBack }: FacilitiesScreenProps) {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex flex-col gap-5 p-7">
        <button
          onClick={onBack}
          className="flex items-center gap-2 self-start rounded-full border border-border-gray bg-bg-white px-5 py-3 text-base font-semibold text-primary-navy"
        >
          <ArrowLeft size={22} />
          처음으로
        </button>

        <h1 className="text-card-title text-primary-navy">공용공간 공기질 상세</h1>

        <div className="flex flex-col gap-3">
          {facilities.map((facility) => (
            <button
              key={facility.id}
              onClick={() => setSelectedFacility(facility)}
              className="flex items-center gap-4 rounded-2xl border border-border-gray bg-bg-white p-5 text-left shadow-card"
            >
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary-blue/10">
                <FacilityIcon icon={facility.icon} className="text-primary-blue" size={30} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label text-primary-navy">{facility.name}</p>
                <p className="mt-0.5 text-base text-text-gray">{facility.plainMessage}</p>
              </div>
              <StatusBadge status={facility.status} />
            </button>
          ))}
        </div>
      </div>

      <FacilityDetailOverlay facility={selectedFacility} onClose={() => setSelectedFacility(null)} />
    </div>
  )
}
