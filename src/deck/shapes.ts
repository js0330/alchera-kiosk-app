import type { Geom } from './types'

// 구글 슬라이드 · PowerPoint 기본 도형. 이름(geom)은 PowerPoint 도형 이름(prst)과 같아서
// PPTX 로 내보내면 같은 도형이 됩니다. 화면 그림은 PowerPoint 기본 비율(adj 기본값)을 그대로 따릅니다.

export interface ShapeDef {
  geom: Geom
  label: string
  group: '기본 도형' | '화살표'
}

export const SHAPES: ShapeDef[] = [
  { geom: 'rect', label: '사각형', group: '기본 도형' },
  { geom: 'roundRect', label: '둥근 사각형', group: '기본 도형' },
  { geom: 'round2SameRect', label: '위가 둥근 사각형', group: '기본 도형' },
  { geom: 'ellipse', label: '원', group: '기본 도형' },
  { geom: 'triangle', label: '삼각형', group: '기본 도형' },
  { geom: 'rtTriangle', label: '직각 삼각형', group: '기본 도형' },
  { geom: 'diamond', label: '마름모', group: '기본 도형' },
  { geom: 'parallelogram', label: '평행 사변형', group: '기본 도형' },
  { geom: 'trapezoid', label: '사다리꼴', group: '기본 도형' },
  { geom: 'hexagon', label: '육각형', group: '기본 도형' },
  { geom: 'octagon', label: '팔각형', group: '기본 도형' },
  { geom: 'plus', label: '십자', group: '기본 도형' },
  { geom: 'star5', label: '별', group: '기본 도형' },
  { geom: 'wedgeRectCallout', label: '말풍선', group: '기본 도형' },
  { geom: 'rightArrow', label: '오른쪽 화살표', group: '화살표' },
  { geom: 'leftArrow', label: '왼쪽 화살표', group: '화살표' },
  { geom: 'upArrow', label: '위쪽 화살표', group: '화살표' },
  { geom: 'downArrow', label: '아래쪽 화살표', group: '화살표' },
  { geom: 'leftRightArrow', label: '양쪽 화살표', group: '화살표' },
  { geom: 'upDownArrow', label: '위아래 화살표', group: '화살표' },
  { geom: 'homePlate', label: '오각형 화살표', group: '화살표' },
  { geom: 'chevron', label: '갈매기형', group: '화살표' },
]

// 사각형 계열(CSS 테두리·모서리로 그림)은 null, 나머지는 w×h 안의 꼭짓점 목록
export function shapePoints(geom: Geom | undefined, w: number, h: number): [number, number][] | null {
  const ss = Math.min(w, h)
  const hc = w / 2
  const vc = h / 2
  switch (geom) {
    case 'triangle':
      return [[hc, 0], [w, h], [0, h]]
    case 'rtTriangle':
      return [[0, 0], [w, h], [0, h]]
    case 'diamond':
      return [[hc, 0], [w, vc], [hc, h], [0, vc]]
    case 'parallelogram': {
      const x = ss * 0.25
      return [[x, 0], [w, 0], [w - x, h], [0, h]]
    }
    case 'trapezoid': {
      const x = ss * 0.25
      return [[x, 0], [w - x, 0], [w, h], [0, h]]
    }
    case 'hexagon': {
      const x = ss * 0.25
      return [[0, vc], [x, 0], [w - x, 0], [w, vc], [w - x, h], [x, h]]
    }
    case 'octagon': {
      const x = ss * 0.29289
      return [[x, 0], [w - x, 0], [w, x], [w, h - x], [w - x, h], [x, h], [0, h - x], [0, x]]
    }
    case 'plus': {
      const x = ss * 0.25
      return [[x, 0], [w - x, 0], [w - x, x], [w, x], [w, h - x], [w - x, h - x], [w - x, h], [x, h], [x, h - x], [0, h - x], [0, x], [x, x]]
    }
    case 'star5': {
      // PowerPoint star5 기본값 (adj 19098, hf 105146, vf 110557)
      const swd2 = (w / 2) * 1.05146
      const shd2 = (h / 2) * 1.10557
      const svc = vc * 1.10557
      const c18 = Math.cos(Math.PI / 10)
      const c54 = Math.cos((3 * Math.PI) / 10)
      const s18 = Math.sin(Math.PI / 10)
      const s54 = Math.sin((3 * Math.PI) / 10)
      const iw = (swd2 * 19098) / 50000
      const ih = (shd2 * 19098) / 50000
      return [
        [hc - swd2 * c18, svc - shd2 * s18],
        [hc - iw * c54, svc - ih * s54],
        [hc, 0],
        [hc + iw * c54, svc - ih * s54],
        [hc + swd2 * c18, svc - shd2 * s18],
        [hc + iw * c18, svc + ih * s18],
        [hc + swd2 * c54, svc + shd2 * s54],
        [hc, svc + ih],
        [hc - swd2 * c54, svc + shd2 * s54],
        [hc - iw * c18, svc + ih * s18],
      ]
    }
    case 'wedgeRectCallout': {
      // 꼬리: 아래쪽, 왼쪽에서 약 30% 지점 (PowerPoint 기본값)
      const tx = hc - w * 0.20833
      const ty = vc + h * 0.625
      return [[0, 0], [w, 0], [w, h], [(w * 5) / 12, h], [tx, ty], [w / 6, h], [0, h]]
    }
    case 'rightArrow': {
      const x = w - ss * 0.5
      return [[0, h * 0.25], [x, h * 0.25], [x, 0], [w, vc], [x, h], [x, h * 0.75], [0, h * 0.75]]
    }
    case 'leftArrow': {
      const x = ss * 0.5
      return [[0, vc], [x, 0], [x, h * 0.25], [w, h * 0.25], [w, h * 0.75], [x, h * 0.75], [x, h]]
    }
    case 'upArrow': {
      const y = ss * 0.5
      return [[hc, 0], [w, y], [w * 0.75, y], [w * 0.75, h], [w * 0.25, h], [w * 0.25, y], [0, y]]
    }
    case 'downArrow': {
      const y = h - ss * 0.5
      return [[w * 0.25, 0], [w * 0.75, 0], [w * 0.75, y], [w, y], [hc, h], [0, y], [w * 0.25, y]]
    }
    case 'leftRightArrow': {
      const x = ss * 0.5
      return [[0, vc], [x, 0], [x, h * 0.25], [w - x, h * 0.25], [w - x, 0], [w, vc], [w - x, h], [w - x, h * 0.75], [x, h * 0.75], [x, h]]
    }
    case 'upDownArrow': {
      const y = ss * 0.5
      return [[hc, 0], [w, y], [w * 0.75, y], [w * 0.75, h - y], [w, h - y], [hc, h], [0, h - y], [w * 0.25, h - y], [w * 0.25, y], [0, y]]
    }
    case 'homePlate': {
      const x = w - ss * 0.5
      return [[0, 0], [x, 0], [w, vc], [x, h], [0, h]]
    }
    case 'chevron': {
      const x = ss * 0.5
      return [[0, 0], [w - x, 0], [w, vc], [w - x, h], [0, h], [x, vc]]
    }
    default:
      return null
  }
}

export const pointsAttr = (pts: [number, number][]) => pts.map(([x, y]) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`).join(' ')

// PowerPoint 는 도형마다 글이 들어가는 안쪽 영역(textRect)이 따로 있어서, 화면도 같은 영역에 글을 넣어야
// 줄바꿈이 PPTX 와 같아집니다. [왼, 위, 오른, 아래] 안쪽 여백(px).
export function textInsets(geom: Geom | undefined, w: number, h: number): [number, number, number, number] {
  const ss = Math.min(w, h)
  switch (geom) {
    case 'ellipse':
      return [w * 0.1464, h * 0.1464, w * 0.1464, h * 0.1464]
    case 'triangle':
      return [w * 0.25, h * 0.5, w * 0.25, 0]
    case 'rtTriangle':
      return [w / 12, (h * 7) / 12, (w * 5) / 12, h / 12]
    case 'diamond':
      return [w * 0.25, h * 0.25, w * 0.25, h * 0.25]
    case 'parallelogram':
    case 'trapezoid':
      return [ss * 0.1667, ss * 0.1667, ss * 0.1667, 0]
    case 'hexagon':
      return [ss * 0.18, ss * 0.18, ss * 0.18, ss * 0.18]
    case 'octagon':
      return [ss * 0.1464, ss * 0.1464, ss * 0.1464, ss * 0.1464]
    case 'plus':
      return [0, ss * 0.25, 0, ss * 0.25]
    case 'star5':
      return [w * 0.31, h * 0.38, w * 0.31, h * 0.22]
    case 'rightArrow':
      return [0, h * 0.25, ss * 0.25, h * 0.25]
    case 'leftArrow':
      return [ss * 0.25, h * 0.25, 0, h * 0.25]
    case 'upArrow':
      return [w * 0.25, ss * 0.25, w * 0.25, 0]
    case 'downArrow':
      return [w * 0.25, 0, w * 0.25, ss * 0.25]
    case 'leftRightArrow':
      return [ss * 0.25, h * 0.25, ss * 0.25, h * 0.25]
    case 'upDownArrow':
      return [w * 0.25, ss * 0.25, w * 0.25, ss * 0.25]
    case 'homePlate':
      return [0, 0, ss * 0.25, 0]
    case 'chevron':
      return [ss * 0.5, 0, ss * 0.5, 0]
    default:
      return [0, 0, 0, 0]
  }
}
