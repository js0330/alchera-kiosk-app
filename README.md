# ALCHERA Kiosk App

## Deck Studio (`/deck`)

알체라 PPT 가이드(ALCHERA_PPT_Template_ver.260507)를 그대로 따르는 사내용 슬라이드 편집기입니다.
글꼴·색·위치를 직접 맞추는 대신 가이드의 레이아웃을 고르고 칸에 글만 채우면, 가이드와 같은 크기(10 × 5.625in)·글꼴(Noto Sans KR)의 PPTX가 만들어집니다.

- `/deck#templates` — 불러오기(PPTX·텍스트 → 가이드 레이아웃), 시작 키트(솔루션 소개서 제목 1줄·2줄 / 빈 문서), 알체라 샘플 덱 2종, 레이아웃 라이브러리(표지 1줄·2줄 · 목차 · 간지 · 라인형 1단 · 자유 배치 · 마무리)
  - 라인형 1단은 가이드 박스 하나 + 사방 여백 24px. 안에 넣은 요소는 박스 밖으로 나가지 않습니다(`objectArea`). 칸이 고정된 예전 레이아웃(라인형 2·3단·4분할, 타이틀형)은 화면에서 숨기고 기존 문서·샘플 덱에서만 그대로 열립니다(`hidden`).
- `/deck#sales` — 세일즈덱 모아보기: 덱마다 표지·이름만 보여 주고, 누르면 구글 슬라이드 원본을 엽니다 (`src/deck/pages/SalesDeckPage.tsx`, `src/deck/components/SampleCard.tsx`).
- `/deck#studio/<id>` — 편집기: 썸네일 · 캔버스 · 가이드 체크/발표자 노트, 발표 모드, PPTX 다운로드
- `/deck#guide` — 가이드 컬러·글자 체계·규칙

**불러오기**: PPTX(Google Slides·Keynote는 .pptx로 저장 후)나 텍스트·마크다운을 넣으면 가이드에 맞춰 가져옵니다. 표지·목차·간지·마무리는 가이드 레이아웃으로 바꾸고, 본문 슬라이드는 두 가지 중 고릅니다.
- **원본 배치 유지**(기본): 도형·텍스트 상자·이미지(자르기 포함)·선·표를 위치·모양 그대로 가이드 상단(타이틀·서브·로고) 아래 본문 영역에 옮깁니다. 테마색·그룹·회전을 반영하고, 차트·SmartArt는 자리만 표시합니다. 에디터에서 끌어서 옮기기·크기 조절·더블클릭 글 수정·삭제가 되고, ‘가이드 서식 맞추기’로 글자 크기·색·배경을 가이드 값으로 한 번에 바꿉니다. (`src/deck/importKeep.ts`, `src/deck/components/FreeLayer.tsx`)
- **가이드 레이아웃으로 재구성**: 글과 대표 이미지만 읽어 라인형 레이아웃 칸에 채웁니다.

**구글 슬라이드 링크**: ‘링크가 있는 모든 사용자’로 공유된 슬라이드는 주소만 붙여넣으면 PPTX로 받아 같은 방식으로 가져옵니다(Google이 허용하는 브라우저 직접 다운로드, 서버 없음). 회사 내부로 제한된 파일은 PPTX로 받아 파일로 불러옵니다.

브라우저 안에서만 처리하며 서버로 보내지 않습니다. 문서는 IndexedDB 에 저장되어 이미지가 많은 문서도 담을 수 있습니다. (`src/deck/importers.ts`)
마크다운 규칙: `#` 표지(첫 번째)·간지, `##` 본문 슬라이드, `>` 슬라이드 서브, `###` 칸 나누기(1~4칸), `-` 본문 줄, `---` 슬라이드 나누기.

**샘플 덱**: 알체라 세일즈덱(공기질 AI · Physical AI)의 표지(`public/deck/samples/covers`, 구글 슬라이드 첫 장 미리보기)와 원본 주소입니다. 덱을 더하려면 표지 그림을 넣고 `src/deck/samples.ts` 의 `SAMPLES` 에 한 줄 추가합니다. 예전에 원본을 편집 요소로 옮긴 데이터(`public/deck/samples/originals`, `scripts/convert-google-slides.py`)는 이미 복사한 문서가 쓰므로 남겨 둡니다.

본문 칸에서 Enter 를 누르면 다음 줄에 `• ` 가 텍스트로 들어가고(가이드: 글머리 기호는 텍스트로), Ctrl+B 로 강조합니다.
본문 슬라이드 맨 위 키 네임(상단 목차)은 직접 쓸 수 있고, 비워 두면 간지 제목(예: `2. 제품 소개`)이 들어갑니다.

**요소 넣기** (모든 슬라이드): 텍스트 · 도형 22종(구글 슬라이드·PowerPoint 기본 도형과 화살표, `src/deck/shapes.ts`) · 선 6종(화살표·점선·끝점 원) · 이미지,
그리고 **요소 라이브러리** — 라인형·타이틀형 레이아웃의 틀만 같은 크기·위치로 넣는 **가이드 박스** 7종(자유 배치 본문의 기본 사용법, 다른 요소 뒤에 깔림, 더블클릭으로 바로 글쓰기), 샘플덱 3종의 아이콘 23개(색을 가이드 색으로 바꿔 칠함, `public/deck/library/icons`)와 자주 쓰는 구성 블록 12개(번호 단계·아이콘 프로세스·숫자 카드·타임라인 등, `src/deck/library.ts`).
클릭하면 들어가고, 슬라이드로 끌어다 놓으면 그 자리에 들어갑니다. 도형 이름이 PowerPoint 도형 이름과 같아서 PPTX에서도 같은 도형으로 나옵니다.
둥근 사각형·이미지는 모서리 둥글기를 숫자·슬라이더·노란 손잡이로 바꿉니다(이미지는 PPTX에 모서리를 깎은 그림으로 들어감).

**복사해서 붙여넣기** (`src/deck/pasteImport.ts`): 구글 슬라이드에서 요소를 복사해 Ctrl+V 하면 클립보드에 함께 오는 도형 정보(위치·크기·회전·그룹·채우기·선·화살촉·글 서식·이미지)를 읽어 같은 자리에 편집 가능한 요소로 넣습니다. 직접 그린 자유형 도형과 원호·파이 등 지원하지 않는 도형은 건너뛰고 개수를 알려 줍니다.
PowerPoint 데스크톱은 브라우저에 도형 정보를 주지 않아서 그림으로 붙여넣고 ‘글로 바꾸기’를 제공합니다. 웹·문서의 서식 있는 글은 글 상자(굵게·크기·색·글머리)와 표로 들어갑니다.

단축키: Ctrl+Z 되돌리기 · Ctrl+Shift+Z / Ctrl+Y 다시 실행 · Ctrl+A 전체 선택 · Shift+클릭·빈 곳 끌기로 여러 개 선택 · Ctrl+C / X / V · Ctrl+D 복제 · Delete · 방향키(Shift 10px).

가이드 값(색·글꼴·로고·표지 배경)은 `src/deck/guide.ts`, 레이아웃 좌표는 `src/deck/layouts.ts` 한 곳에서 관리합니다.
화면과 PPTX 내보내기가 같은 레이아웃 정의를 쓰므로 둘의 결과가 일치합니다.
문서는 각자의 브라우저(localStorage)에 저장되고, 팀원과는 ‘편집 파일(.deck.json)’로 주고받습니다.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
