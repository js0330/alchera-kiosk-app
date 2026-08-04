import type { Facility, FacilityStatus } from '../types'

const SEVERITY: Record<FacilityStatus, number> = { normal: 0, caution: 1, danger: 2 }

export function worstStatus(facilities: Facility[]): FacilityStatus {
  return facilities.reduce<FacilityStatus>(
    (worst, facility) => (SEVERITY[facility.status] > SEVERITY[worst] ? facility.status : worst),
    'normal',
  )
}
