import type { FacilityStatus } from '../../types'

const STATUS_CONFIG: Record<FacilityStatus, { label: string; bg: string; text: string; dot: string }> = {
  normal: { label: '정상', bg: 'bg-status-normal/10', text: 'text-status-normal', dot: 'bg-status-normal' },
  caution: { label: '주의', bg: 'bg-status-caution/10', text: 'text-status-caution', dot: 'bg-status-caution' },
  danger: { label: '위험', bg: 'bg-status-danger/10', text: 'text-status-danger', dot: 'bg-status-danger' },
}

interface StatusBadgeProps {
  status: FacilityStatus
  size?: 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const sizeClasses = size === 'lg' ? 'text-label px-6 py-2.5 gap-2.5' : 'text-base px-4 py-2 gap-2'

  return (
    <span className={`inline-flex items-center rounded-full font-bold ${config.bg} ${config.text} ${sizeClasses}`}>
      <span className={`inline-block rounded-full ${config.dot} ${size === 'lg' ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'}`} />
      {config.label}
    </span>
  )
}
