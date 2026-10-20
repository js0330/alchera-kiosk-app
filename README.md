# ALCHERA Kiosk App

## Deck Studio (`/deck`)

알체라 PPT 가이드(ALCHERA_PPT_Template_ver.260507)를 그대로 따르는 사내용 슬라이드 편집기입니다.
글꼴·색·위치를 직접 맞추는 대신 가이드의 레이아웃을 고르고 칸에 글만 채우면, 가이드와 같은 크기(10 × 5.625in)·글꼴(Noto Sans KR)의 PPTX가 만들어집니다.

- `/deck#templates` — 불러오기(PPTX·텍스트 → 가이드 레이아웃), 알체라 샘플 덱 3종, 시작 키트, 레이아웃 라이브러리(표지·목차·간지·라인형 6종·타이틀형 3종·마무리)
- `/deck#studio/<id>` — 편집기: 썸네일 · 캔버스 · 가이드 체크/발표자 노트, 발표 모드, PPTX 다운로드
- `/deck#guide` — 가이드 컬러·글자 체계·규칙

**불러오기**: PPTX(Google Slides·Keynote는 .pptx로 저장 후)나 텍스트·마크다운을 넣으면 가이드에 맞춰 가져옵니다. 표지·목차·간지·마무리는 가이드 레이아웃으로 바꾸고, 본문 슬라이드는 두 가지 중 고릅니다.
- **원본 배치 유지**(기본): 도형·텍스트 상자·이미지(자르기 포함)·선·표를 위치·모양 그대로 가이드 상단(타이틀·서브·로고) 아래 본문 영역에 옮깁니다. 테마색·그룹·회전을 반영하고, 차트·SmartArt는 자리만 표시합니다. 에디터에서 끌어서 옮기기·크기 조절·더블클릭 글 수정·삭제가 되고, ‘가이드 서식 맞추기’로 글자 크기·색·배경을 가이드 값으로 한 번에 바꿉니다. (`src/deck/importKeep.ts`, `src/deck/components/FreeLayer.tsx`)
- **가이드 레이아웃으로 재구성**: 글과 대표 이미지만 읽어 라인형 레이아웃 칸에 채웁니다.

**구글 슬라이드 링크**: ‘링크가 있는 모든 사용자’로 공유된 슬라이드는 주소만 붙여넣으면 PPTX로 받아 같은 방식으로 가져옵니다(Google이 허용하는 브라우저 직접 다운로드, 서버 없음). 회사 내부로 제한된 파일은 PPTX로 받아 파일로 불러옵니다.

브라우저 안에서만 처리하며 서버로 보내지 않습니다. 문서는 IndexedDB 에 저장되어 이미지가 많은 문서도 담을 수 있습니다. (`src/deck/importers.ts`)
마크다운 규칙: `#` 표지(첫 번째)·간지, `##` 본문 슬라이드, `>` 슬라이드 서브, `###` 칸 나누기(1~4칸), `-` 본문 줄, `---` 슬라이드 나누기.

**샘플 덱**: Face Trust 출입통제 · 공기질 AI · Physical AI 소개서를 가이드 레이아웃으로 옮긴 것입니다 (`src/deck/samples.ts`, 이미지는 `public/deck/samples`).

본문 칸에서 Enter 를 누르면 다음 줄에 `• ` 가 텍스트로 들어가고(가이드: 글머리 기호는 텍스트로), Ctrl+B 로 강조합니다.
간지 제목은 이후 슬라이드의 상단 목차(예: `2. 제품 소개`)에 자동으로 들어갑니다.

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
