## KaboomSetting

간단한 Express + Vite(React) 통합 프로젝트입니다. 서버가 개발 모드에서는 Vite 미들웨어로 클라이언트를 함께 서빙하고, 프로덕션에서는 빌드 산출물을 정적으로 서빙합니다.

### Tech Stack
- Express (TypeScript)
- Vite + React + TailwindCSS
- Zustand, TanStack Query, Radix UI 등

### Scripts
- 개발 실행: `npm run dev`
- 클라이언트+서버 빌드: `npm run build`
- 프로덕션 실행: `npm start`

환경변수
- `PORT`: 서버 포트 지정 (기본값 5000)

### 실행 방법
개발 모드
```bash
npm install
PORT=5050 npm run dev   # 포트 충돌 시 예시
# http://localhost:5050
```

프로덕션 모드
```bash
npm run build
npm start                # 기본 5000, 필요 시 PORT 설정
# http://localhost:5000
```

### API
- `GET /api/movement-path`: 임의의 캐릭터 이동 경로를 반환합니다.

### 프로젝트 구조
```text
KaboomSetting/
  client/
    index.html
    public/
      fonts/
        inter.json
      geometries/
        heart.gltf
      sounds/
        background.mp3
        hit.mp3
        success.mp3
      textures/
        asphalt.png
        grass.png
        sand.jpg
        sky.png
        wood.jpg
    src/
      App.tsx
      components/
        ui/
          accordion.tsx
          alert-dialog.tsx
          alert.tsx
          aspect-ratio.tsx
          avatar.tsx
          badge.tsx
          breadcrumb.tsx
          button.tsx
          calendar.tsx
          card.tsx
          carousel.tsx
          chart.tsx
          checkbox.tsx
          collapsible.tsx
          command.tsx
          context-menu.tsx
          dialog.tsx
          drawer.tsx
          dropdown-menu.tsx
          form.tsx
          hover-card.tsx
          input-otp.tsx
          input.tsx
          interface.tsx
          label.tsx
          menubar.tsx
          navigation-menu.tsx
          pagination.tsx
          popover.tsx
          progress.tsx
          radio-group.tsx
          resizable.tsx
          scroll-area.tsx
          select.tsx
          separator.tsx
          sheet.tsx
          sidebar.tsx
          skeleton.tsx
          slider.tsx
          sonner.tsx
          switch.tsx
          table.tsx
          tabs.tsx
          textarea.tsx
          toggle-group.tsx
          toggle.tsx
          tooltip.tsx
      hooks/
        use-is-mobile.tsx
      index.css
      lib/
        queryClient.ts
        stores/
          useAudio.tsx
          useGame.tsx
        utils.ts
      main.tsx
      pages/
        not-found.tsx
  server/
    index.ts
    routes.ts
    storage.ts
    vite.ts
  shared/
    schema.ts
  drizzle.config.ts
  package.json
  postcss.config.js
  tailwind.config.ts
  tsconfig.json
  vite.config.ts
```

### 참고
- 개발 모드에서는 Vite 미들웨어가 동작하여 HMR이 활성화됩니다.
- 프로덕션 모드에서는 `vite build` 산출물이 `dist/public`에 생성되며, Express가 이를 정적으로 서빙합니다.

## Spec-Driven Development (SDD)
- 스펙 작성 위치: `docs/spec.md`
- 권장 흐름:
  1) 스펙 초안 작성(요약/범위/수용 기준/API 계약)
  2) 타입/계약 확정: `shared/schema.ts`에 Zod/타입 선언
  3) 서버 반영: `server/routes.ts`에 엔드포인트/응답 구현
  4) 클라이언트 연동: `client/src/lib/*` 훅/어댑터, `client/src/App.tsx` UI
  5) 체크리스트로 검증 및 스펙 업데이트(Change Log)

빠른 시작: `docs/spec.md` 템플릿을 복사해 기능별로 섹션을 채우고, 계약(Zod)부터 확정하세요.

