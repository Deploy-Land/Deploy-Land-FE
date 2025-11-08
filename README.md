## Deploy-Land-FE

Vite(React) 기반의 Deploy Land 프런트엔드입니다. 모든 CI/CD 시나리오 테스트는 Mock JSON 데이터로 동작하며, 별도의 Express 서버 없이 정적 자원만 배포합니다.

### Tech Stack
- Vite + React + TailwindCSS
- Zustand, TanStack Query, Radix UI 등

### Scripts
- 개발 실행: `npm run dev`
- 정적 빌드: `npm run build`
- 빌드 미리보기: `npm run preview`

### 환경 변수 설정

#### 로컬 개발
`.env` 파일을 생성하여 API Gateway URL을 설정합니다:
```bash
VITE_API_BASE_URL=https://your-api-gateway-id.execute-api.region.amazonaws.com/stage
```

#### Amplify 배포
Amplify는 `.env` 파일을 직접 읽지 않습니다. 다음 방법으로 환경 변수를 설정하세요:

**방법 1: Amplify 콘솔에서 설정 (권장)**
1. AWS Amplify 콘솔 → 앱 선택
2. **App settings** → **Environment variables** 클릭
3. **Manage variables** 클릭
4. 다음 변수 추가:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-api-gateway-id.execute-api.region.amazonaws.com/stage`
5. **Save** 클릭
6. 앱 재배포 (변경사항 적용을 위해)

**방법 2: amplify.yml에서 설정 (비권장 - 보안상 좋지 않음)**
```yaml
frontend:
  phases:
    preBuild:
      commands:
        - export VITE_API_BASE_URL="https://your-api-gateway-url.execute-api.region.amazonaws.com/stage"
```

> ⚠️ **주의**: 
> - Vite는 빌드 타임에 환경 변수를 주입하므로, 환경 변수 변경 후 반드시 **재빌드**가 필요합니다.
> - API Gateway에서 **CORS** 설정이 필요합니다. Amplify 도메인을 허용 목록에 추가하세요.
>   - `Access-Control-Allow-Origin`: `https://your-amplify-domain.amplifyapp.com`
>   - `Access-Control-Allow-Methods`: `GET, OPTIONS`
>   - `Access-Control-Allow-Headers`: `Content-Type`

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

### API 연동
- **CI/CD 상태 조회**: `GET /api/status/LATEST_EXECUTION` → `GET /api/status/{pipelineId}`
  - `client/src/hooks/usePipelineStatus.ts`: TanStack Query를 사용한 파이프라인 상태 조회 훅
  - `client/src/lib/api/cicd.ts`: API 호출 함수
  - `client/src/types/cicd.ts`: 타입 정의

### Mock Data
- `client/src/mock/movement-paths.ts`: 캐릭터 이동 경로를 무작위로 선택하는 Mock JSON 목록입니다.

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

