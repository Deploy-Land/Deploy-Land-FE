# 백엔드 데이터 처리 흐름

## 개요
백엔드 API에서 파이프라인 상태를 받아와서 게임 UI와 연동하는 전체 흐름을 설명합니다.

## 1. API 호출 레이어 (`client/src/lib/api/cicd.ts`)

### 환경 변수
- `VITE_API_BASE_URL`: API Gateway 기본 URL
- 개발 환경: Vite 프록시 사용 (CORS 문제 우회)
- 프로덕션: 직접 API Gateway 호출

### 주요 함수
```typescript
// 최신 실행 파이프라인 ID 가져오기
getLatestExecution(): Promise<LatestExecutionResponse>
// 응답: { latestExecutionId: string, lastStartTime: string }

// 파이프라인 상태 조회
getPipelineStatus(pipelineId: string): Promise<PipelineStatus>
// 응답: { pipelineId, status, jobs: Job[], ... }
```

### 처리 내용
- 환경 변수에서 API URL 로드
- 개발 환경에서는 Vite 프록시 사용 (`/api/status/...`)
- 프로덕션에서는 직접 API Gateway 호출
- 에러 처리 및 로깅

## 2. TanStack Query 레이어 (`client/src/hooks/usePipelineStatus.ts`)

### 폴링 전략

#### Phase 1: 초기 pipelineId 획득
- **쿼리 키**: `["latestExecution"]`
- **조건**: `pipelineId`가 없거나 유효하지 않을 때만 실행
- **폴링**: ❌ 없음 (`refetchInterval: false`)
- **목적**: 최신 파이프라인 ID 가져오기

#### Phase 2: 파이프라인 상태 조회
- **쿼리 키**: `["pipelineStatus", currentPipelineId]`
- **조건**: `pipelineId`가 있을 때만 실행
- **폴링**: ✅ **500ms마다** (`refetchInterval: 500`)
- **목적**: 실시간 파이프라인 상태 모니터링

### 데이터 흐름
```
1. 컴포넌트 마운트
   ↓
2. pipelineId 확인 (localStorage + Zustand)
   ↓
3-a. pipelineId 없음
   → LATEST_EXECUTION 호출
   → latestExecutionId 획득
   → pipelineId로 저장
   ↓
3-b. pipelineId 있음
   → 바로 상태 조회 시작
   ↓
4. /api/status/{pipelineId} 호출 (500ms마다)
   ↓
5. 응답 데이터를 Zustand Store에 저장
```

### 새로운 pipelineId 가져오기
- **시점**: 파이프라인이 `SUCCESS` 또는 `FAILED` 상태일 때
- **함수**: `fetchNewPipelineId()`
- **동작**:
  1. `LATEST_EXECUTION` 호출
  2. 새로운 `latestExecutionId` 획득
  3. Zustand Store 업데이트
  4. localStorage 동기화
  5. TanStack Query 캐시 무효화하여 새 상태 조회 시작

## 3. Zustand Store 레이어 (`client/src/store/pipelineStore.ts`)

### 저장되는 데이터

#### 기본 정보
- `pipelineId`: 현재 추적 중인 파이프라인 ID
- `pipelineStatus`: 전체 파이프라인 상태 (원본 API 응답)
- `isLoading`: 로딩 상태
- `error`: 에러 정보

#### 3단계 상태 (자동 계산)
- `sourceStage`: Source 단계 상태
- `buildStage`: Build 단계 상태
- `deployStage`: Deploy 단계 상태

각 단계는 다음 정보를 포함:
```typescript
{
  stage: "source" | "build" | "deploy",
  status: "pending" | "running" | "success" | "failed",
  jobs: Job[],
  completedJobs: number,
  totalJobs: number
}
```

### Job 분류 로직

#### Source Stage
- `source`, `clone`, `checkout`, `fetch`, `pull` 포함된 Job

#### Build Stage
- `build`, `compile`, `test`, `lint`, `unit`, `integration` 포함된 Job

#### Deploy Stage
- `deploy`, `release`, `publish`, `push`, `production` 포함된 Job

#### Fallback
- Job 이름으로 분류 불가능한 경우 `order` 필드 사용
  - `order <= 2`: Source
  - `order <= 5`: Build
  - 그 외: Deploy

### 상태 계산 로직
```typescript
// 각 단계의 상태 결정
if (모든 job 완료) {
  if (모든 job 성공) → status = "success"
  else → status = "failed"
} else {
  if (진행 중인 job 있음) → status = "running"
  else → status = "pending"
}
```

### Persistence
- `pipelineId`만 localStorage에 저장 (나머지는 실시간 상태)
- 페이지 새로고침 시에도 마지막 pipelineId 유지

## 4. UI 컴포넌트 레이어

### PipelineProgressBar
- **데이터 소스**: `useSourceStage()`, `useBuildStage()`, `useDeployStage()`, `usePipelineStatus()`
- **표시 내용**:
  - 진행률 퍼센트 (0-100%)
  - 현재 단계 상태 텍스트
  - 단계별 마일스톤 (시작, Source, Build, Deploy, Validation, Finish)

### Game.tsx
- **데이터 소스**: `usePipelineStatus()` hook
- **처리 로직**:
  1. `pipelineStatus.status` 모니터링
  2. `FAILED` 상태 감지 → 실패 애니메이션 + 모달 표시
  3. `SUCCESS` 상태 감지 → 성공 애니메이션 + 성공 이미지
  4. 상태 변경 후 새로운 pipelineId 가져오기

### ParallaxBackground
- **데이터 소스**: `useSourceStage()`, `useBuildStage()`, `useDeployStage()`
- **처리 로직**:
  - 현재 실행 중인 단계 확인
  - Source → 언어별 기본 배경 (mountain/forest/cyberpunk)
  - Build → `dusk` 배경
  - Deploy → `canyon` 배경

### ApiResultModal
- **데이터 소스**: `usePipelineStatus()`
- **표시 내용**:
  - 파이프라인 상태 정보
  - 실패한 Job 목록
  - AI 솔루션 (`aiSolution`)
  - 로그 URL (`logUrl`)

## 5. 데이터 흐름 예시

### 시나리오: 파이프라인 실행 시작

```
1. 사용자가 Game 페이지 접속
   ↓
2. usePipelineStatus() hook 실행
   ↓
3. pipelineId 없음 → LATEST_EXECUTION 호출
   GET /api/status/LATEST_EXECUTION
   ↓
4. 응답: { latestExecutionId: "abc-123", lastStartTime: "2024-01-01T00:00:00Z" }
   ↓
5. pipelineId = "abc-123" 저장 (Zustand + localStorage)
   ↓
6. /api/status/abc-123 호출 시작 (500ms마다)
   ↓
7. 응답: {
     pipelineId: "abc-123",
     status: "RUNNING",
     jobs: [
       { name: "source-clone", status: "running", order: 1 },
       { name: "build-compile", status: "pending", order: 3 },
       ...
     ]
   }
   ↓
8. Zustand Store 업데이트
   - sourceStage: { status: "running", jobs: [...], completedJobs: 0, totalJobs: 2 }
   - buildStage: { status: "pending", jobs: [...], completedJobs: 0, totalJobs: 3 }
   - deployStage: { status: "pending", jobs: [...], completedJobs: 0, totalJobs: 2 }
   ↓
9. UI 업데이트
   - PipelineProgressBar: 진행률 10% 표시
   - ParallaxBackground: Source 단계 배경 표시
   - Game: 플레이어 이동 시작
```

### 시나리오: 파이프라인 실패

```
1. 500ms마다 폴링 중
   ↓
2. 응답: { status: "FAILED", jobs: [...] }
   ↓
3. Game.tsx의 useEffect에서 상태 변경 감지
   ↓
4. triggerFailureWithObstacle() 실행
   - 플레이어가 장애물에 부딪치는 애니메이션
   ↓
5. 애니메이션 완료 후 모달 오픈
   - ApiResultModal 표시
   - 실패한 Job 정보, AI 솔루션, 로그 URL 표시
   ↓
6. fetchNewPipelineId() 호출
   - LATEST_EXECUTION 호출
   - 새로운 pipelineId 획득
   ↓
7. 새로운 pipelineId로 폴링 재시작
```

### 시나리오: 파이프라인 성공

```
1. 500ms마다 폴링 중
   ↓
2. 응답: { status: "SUCCESS", jobs: [...] }
   ↓
3. Game.tsx의 useEffect에서 상태 변경 감지
   ↓
4. triggerSuccessWithGoalMove() 실행
   - 플레이어가 목표까지 이동
   - 뼈다귀 먹기 애니메이션
   - 플레이어 확대 애니메이션
   - 플레이어가 화면 오른쪽으로 이동하여 사라짐
   ↓
5. 성공 이미지 표시 (3초)
   - 언어별 성공 이미지 (ko_success.png, en_success.png, jp_success.png)
   ↓
6. 3초 후 fetchNewPipelineId() 호출
   - LATEST_EXECUTION 호출
   - 새로운 pipelineId 획득
   ↓
7. 새로운 pipelineId로 폴링 재시작
```

## 6. 주요 설정값

### 폴링 간격
- **파이프라인 상태 조회**: 500ms (0.5초)
- **LATEST_EXECUTION**: 폴링 없음 (필요 시에만 호출)

### 재시도 설정
- **최대 재시도**: 2회
- **재시도 지연**: 100ms (LATEST_EXECUTION), 1000ms (Pipeline Status)

### 캐싱
- **LATEST_EXECUTION**: `staleTime: Infinity` (폴링하지 않으므로)
- **Pipeline Status**: `staleTime: 0` (항상 최신 데이터)

## 7. 에러 처리

### API 호출 실패
- 네트워크 에러: 자동 재시도 (2회)
- 404 에러: pipelineId 초기화 후 LATEST_EXECUTION 호출
- CORS 에러: 개발 환경에서는 Vite 프록시로 우회

### 데이터 검증
- `jobs`가 없는 경우: 빈 배열로 처리
- `pipelineId`가 "LATEST_EXECUTION"인 경우: 자동 정리
- 잘못된 상태값: 기본값으로 처리 (pending)

## 8. 성능 최적화

### TanStack Query
- 자동 캐싱으로 불필요한 API 호출 방지
- 쿼리 키 기반 캐시 무효화
- 배경에서 자동 리페치

### Zustand
- 선택자 함수로 필요한 상태만 구독
- 불필요한 리렌더링 방지
- DevTools 지원 (개발 환경)

### localStorage
- pipelineId만 저장 (용량 최소화)
- 실시간 상태는 메모리에만 유지

## 9. 디버깅

### 개발 환경 로그
- API 호출 URL 및 응답
- pipelineId 저장/로드
- 상태 변경 감지
- 에러 상세 정보

### 브라우저 DevTools
- React Query DevTools: 쿼리 상태 확인
- Zustand DevTools: Store 상태 확인
- Network 탭: API 호출 확인

## 10. 향후 개선 사항

1. **WebSocket 지원**: 폴링 대신 실시간 업데이트
2. **에러 복구**: 네트워크 에러 시 자동 복구 로직
3. **오프라인 지원**: Service Worker로 오프라인 모드 지원
4. **배치 요청**: 여러 pipelineId를 한 번에 조회

