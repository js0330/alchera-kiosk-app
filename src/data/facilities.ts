import type { Facility } from '../types'

export const buildingName = '알체라 실버타운'
export const kioskLocation = '1F 로비'

// 관리자 웹 대시보드의 구역명과 매칭됩니다 (알체라 실버타운 = 대시보드의 동일 건물).
export const facilities: Facility[] = [
  {
    id: 'b1-parking-a',
    name: 'B1 주차구역A',
    icon: 'parking',
    status: 'caution',
    plainMessage: '공기질이 다소 나빠졌어요. 환기가 필요한 상태이니 잠시 후 다시 확인해주세요.',
    co2: 742,
    pm25: 24,
    temp: 25,
    humidity: 51,
    ventilationOn: true,
    lastUpdated: '14:22',
  },
  {
    id: 'b2-storage',
    name: 'B2 저장구역',
    icon: 'storage',
    status: 'caution',
    plainMessage: '공기질이 다소 나빠졌어요. 환기가 필요한 상태이니 잠시 후 다시 확인해주세요.',
    co2: 715,
    pm25: 22,
    temp: 25,
    humidity: 52,
    ventilationOn: true,
    lastUpdated: '14:18',
  },
  {
    id: 'mechanical-room',
    name: '기계실',
    icon: 'mechanical',
    status: 'danger',
    plainMessage: '지금은 이용을 자제하고 관리사무소에 문의해주세요.',
    co2: 1180,
    pm25: 52,
    temp: 28,
    humidity: 58,
    ventilationOn: true,
    lastUpdated: '14:23',
  },
  {
    id: '2f-meeting',
    name: '2F 회의실',
    icon: 'community',
    status: 'normal',
    plainMessage: '지금 이용하기 안전해요.',
    co2: 601,
    pm25: 16,
    temp: 24,
    humidity: 47,
    ventilationOn: false,
    lastUpdated: '14:19',
  },
  {
    id: 'b1-entrance',
    name: 'B1 출입구역',
    icon: 'corridor',
    status: 'caution',
    plainMessage: '공기질이 다소 나빠졌어요. 환기가 필요한 상태이니 잠시 후 다시 확인해주세요.',
    co2: 512,
    pm25: 14,
    temp: 23,
    humidity: 45,
    ventilationOn: true,
    lastUpdated: '14:20',
  },
]

export const findFacilityById = (id: string) => facilities.find((facility) => facility.id === id)
