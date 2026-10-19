# ALCHERA Kiosk App

## Deck Studio (`/deck`)

알체라 PPT 가이드(ALCHERA_PPT_Template_ver.260507)를 그대로 따르는 사내용 슬라이드 편집기입니다.
글꼴·색·위치를 직접 맞추는 대신 가이드의 레이아웃을 고르고 칸에 글만 채우면, 가이드와 같은 크기(10 × 5.625in)·글꼴(Noto Sans KR)의 PPTX가 만들어집니다.

- `/deck#templates` — 시작 키트(솔루션 소개서·회사 소개서·프로젝트 보고)와 레이아웃 라이브러리(표지·목차·간지·라인형 4종·타이틀형 3종·마무리)
- `/deck#studio/<id>` — 편집기: 썸네일 · 캔버스 · 가이드 체크/발표자 노트, 발표 모드, PPTX 다운로드
- `/deck#guide` — 가이드 컬러·글자 체계·규칙

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
