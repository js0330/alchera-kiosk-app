export type FacilityStatus = 'normal' | 'caution' | 'danger'

export type FacilityIcon = 'parking' | 'storage' | 'mechanical' | 'community' | 'corridor'

export interface Facility {
  id: string
  name: string
  icon: FacilityIcon
  status: FacilityStatus
  plainMessage: string
  co2: number
  pm25: number
  temp: number
  humidity: number
  ventilationOn: boolean
  lastUpdated: string
}
