# 테스트 가이드

이 프로젝트는 Vitest를 사용하여 테스트를 실행합니다.

## 테스트 실행

```bash
# 모든 테스트 실행
npm test

# Watch 모드로 테스트 실행 (파일 변경 시 자동 실행)
npm test -- --watch

# UI 모드로 테스트 실행 (인터랙티브)
npm run test:ui

# 커버리지 보고서 생성
npm run test:coverage
```

## 테스트 구조

### 1. Store 테스트 (`client/src/store/__tests__/`)
- `pipelineStore.test.ts`: PipelineStore의 상태 관리 로직 테스트
  - 초기 상태 테스트
  - pipelineId 설정 테스트
  - pipelineStatus 설정 및 단계별 상태 계산 테스트
  - 성공/실패/취소 상태 테스트

### 2. API 테스트 (`client/src/lib/api/__tests__/`)
- `cicd.test.ts`: CICD API 호출 테스트
  - `getLatestExecution` 테스트
  - `getLastUpdated` 테스트
  - `getPipelineStatus` 테스트
  - 에러 처리 테스트

### 3. Hook 테스트 (`client/src/hooks/__tests__/`)
- `usePipelineStatus.test.tsx`: usePipelineStatus 훅 테스트
  - 초기 로드 테스트
  - 파이프라인 상태 조회 테스트
  - 에러 처리 테스트

### 4. Mock 데이터 (`client/src/test/mocks/`)
- `pipelineStatusMocks.ts`: 다양한 파이프라인 상태의 mock 데이터
  - STARTED 상태
  - SUCCEEDED 상태
  - FAILED 상태
  - CANCELED 상태
  - 진행 중인 상태들

## Mock 사용 예시

```typescript
import { mockPipelineStatusStarted } from "@/test/mocks/pipelineStatusMocks";

// 테스트에서 사용
const status = mockPipelineStatusStarted;
expect(status.status).toBe("STARTED");
```

## 테스트 작성 가이드

1. **테스트 파일 위치**: 각 모듈과 같은 레벨에 `__tests__` 디렉토리 생성
2. **테스트 명명**: `*.test.ts` 또는 `*.test.tsx` 형식 사용
3. **Mock 사용**: 외부 의존성은 항상 mock 처리
4. **독립성**: 각 테스트는 독립적으로 실행되어야 함

## 주의사항

- 테스트는 독립적으로 실행되어야 합니다 (각 테스트 전에 상태 초기화)
- Mock 데이터는 실제 API 응답 형식과 일치해야 합니다
- 비동기 테스트는 `waitFor`를 사용하여 처리합니다
- 환경 변수는 `vi.stubEnv`를 사용하여 설정합니다

