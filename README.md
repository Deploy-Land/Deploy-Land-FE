## Deploy-Land-FE

Vite(React) 기반의 Deploy Land 프런트엔드입니다. 모든 CI/CD 시나리오 테스트는 Mock JSON 데이터로 동작하며, 별도의 Express 서버 없이 정적 자원만 배포합니다.

### Tech Stack
- Vite + React + TailwindCSS
- Zustand, TanStack Query, Radix UI 등

### Scripts
- 개발 실행: `npm run dev`
- 정적 빌드: `npm run build`
- 빌드 미리보기: `npm run preview`

### 실행 방법
개발 모드
```bash
npm install
npm run dev
# http://localhost:5173
```

프로덕션(정적) 미리보기
```bash
npm run build
npm run preview
# http://localhost:4173
```

### Mock Data
- `client/src/mock/movement-paths.ts`: 캐릭터 이동 경로를 무작위로 선택하는 Mock JSON 목록입니다.
- `client/src/components/CICDStatusModal.tsx`: CI/CD 상태 조회 API 명세와 오류 케이스를 정적 JSON으로 제공합니다.

### 프로젝트 구조
```text
Deploy-Land-FE/
  client/
    index.html
    public/
      fonts/
      geometries/
      sounds/
      textures/
    src/
      App.tsx
      components/
      game/
      hooks/
      lib/
      mock/
        movement-paths.ts
      pages/
      types/
        movement.ts
      index.css
      main.tsx
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
- 개발 모드에서는 Vite Dev Server의 HMR이 활성화됩니다.
- `vite build` 산출물은 `dist/public`에 생성되며, Amplify 등 정적 호스팅 환경에 그대로 업로드할 수 있습니다.

## Spec-Driven Development (SDD)
- 스펙 작성 위치: `docs/spec.md`
- 권장 흐름:
  1) 스펙 초안 작성(요약/범위/수용 기준/계약)
  2) 타입/계약 확정: `client/src/types/*`에 타입 선언
  3) Mock 데이터 정의: `client/src/mock/*`에 JSON/헬퍼 추가
  4) 클라이언트 연동: `client/src/lib/*` 훅/어댑터, `client/src/App.tsx` UI
  5) 체크리스트로 검증 및 스펙 업데이트(Change Log)

빠른 시작: `docs/spec.md` 템플릿을 복사해 기능별로 섹션을 채우고, 계약(Zod)부터 확정하세요.

