# 테스트 가이드

이 디렉토리에는 프로젝트의 테스트 파일과 mock 데이터가 포함되어 있습니다.

## 테스트 실행

```bash
# 모든 테스트 실행
npm test

# UI 모드로 테스트 실행 (인터랙티브)
npm run test:ui

# 커버리지 보고서 생성
npm run test:coverage
```

## 테스트 구조

### Mock 데이터
- `mocks/pipelineStatusMocks.ts`: 파이프라인 상태 mock 데이터
  - `mockPipelineStatusStarted`: STARTED 상태
  - `mockPipelineStatusSucceeded`: SUCCEEDED 상태
  - `mockPipelineStatusFailed`: FAILED 상태
  - `mockPipelineStatusCanceled`: CANCELED 상태
  - 기타 진행 중인 상태들

### 테스트 파일
- `store/__tests__/pipelineStore.test.ts`: PipelineStore 테스트
- `lib/api/__tests__/cicd.test.ts`: CICD API 테스트
- `hooks/__tests__/usePipelineStatus.test.tsx`: usePipelineStatus 훅 테스트

## Mock 사용 예시

```typescript
import { mockPipelineStatusStarted } from "@/test/mocks/pipelineStatusMocks";

// 테스트에서 사용
const status = mockPipelineStatusStarted;
expect(status.status).toBe("STARTED");
```

## 테스트 작성 가이드

1. **API 테스트**: `lib/api/__tests__/` 디렉토리에 작성
2. **Store 테스트**: `store/__tests__/` 디렉토리에 작성
3. **Hook 테스트**: `hooks/__tests__/` 디렉토리에 작성
4. **Component 테스트**: `components/__tests__/` 디렉토리에 작성 (추가 예정)

## 주의사항

- 테스트는 독립적으로 실행되어야 합니다 (각 테스트 전에 상태 초기화)
- Mock 데이터는 실제 API 응답 형식과 일치해야 합니다
- 비동기 테스트는 `waitFor`를 사용하여 처리합니다

