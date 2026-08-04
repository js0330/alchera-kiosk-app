import type { Facility } from '../types'

export const buildingName = '알체라 실버타운'
export const kioskLocation = '1F 로비'

export const facilities: Facility[] = [
  {
    id: 'underground-parking',
    name: '지하주차장',
    icon: 'parking',
    status: 'caution',
    plainMessage: '환기를 가동 중이에요. 잠시 후 다시 확인해주세요.',
    co2: 742,
    pm25: 24,
    temp: 25,
    humidity: 51,
    lastUpdated: '14:22',
  },
  {
    id: 'underground-storage',
    name: '지하 창고',
    icon: 'storage',
    status: 'normal',
    plainMessage: '지금 이용하기 안전해요.',
    co2: 520,
    pm25: 15,
    temp: 23,
    humidity: 46,
    lastUpdated: '14:18',
  },
  {
    id: 'mechanical-room',
    name: '기계실 인근 통로',
    icon: 'mechanical',
    status: 'danger',
    plainMessage: '지금은 이용을 자제하고 관리사무소에 문의해주세요.',
    co2: 1180,
    pm25: 52,
    temp: 28,
    humidity: 58,
    lastUpdated: '14:23',
  },
  {
    id: 'community-hall',
    name: '경로당·커뮤니티실',
    icon: 'community',
    status: 'normal',
    plainMessage: '지금 이용하기 안전해요.',
    co2: 560,
    pm25: 13,
    temp: 24,
    humidity: 45,
    lastUpdated: '14:15',
  },
  {
    id: 'basement-corridor',
    name: '지하 연결통로',
    icon: 'corridor',
    status: 'normal',
    plainMessage: '지금 이용하기 안전해요.',
    co2: 505,
    pm25: 12,
    temp: 22,
    humidity: 44,
    lastUpdated: '14:10',
  },
]

export const findFacilityById = (id: string) => facilities.find((facility) => facility.id === id)
