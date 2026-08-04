import { Car, Archive, Cog, Users, DoorOpen } from 'lucide-react'
import type { FacilityIcon as FacilityIconType } from '../types'

const ICONS: Record<FacilityIconType, typeof Car> = {
  parking: Car,
  storage: Archive,
  mechanical: Cog,
  community: Users,
  corridor: DoorOpen,
}

interface FacilityIconProps {
  icon: FacilityIconType
  className?: string
  size?: number
}

export default function FacilityIcon({ icon, className, size = 28 }: FacilityIconProps) {
  const Icon = ICONS[icon]
  return <Icon size={size} className={className} />
}
