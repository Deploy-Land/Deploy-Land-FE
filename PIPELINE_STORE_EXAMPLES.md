# Zustand Store 파이프라인 데이터 처리 예시

## 예시 1: Source 단계 진행 중

### 입력 데이터 (API 응답)
```json
{
  "pipelineId": "abc-123",
  "status": "RUNNING",
  "jobs": [
    { "name": "source-clone", "status": "running", "order": 1 },
    { "name": "source-checkout", "status": "pending", "order": 2 },
    { "name": "build-compile", "status": "pending", "order": 3 }
  ]
}
```

### 처리 과정

#### 1. Job 분류
```
source-clone → classifyJobToStage() → "source" (이름에 "source", "clone" 포함)
source-checkout → classifyJobToStage() → "source" (이름에 "source", "checkout" 포함)
build-compile → classifyJobToStage() → "build" (이름에 "build" 포함)
```

#### 2. Source Stage 상태 계산
```typescript
stageJobs = [
  { name: "source-clone", status: "running", order: 1 },
  { name: "source-checkout", status: "pending", order: 2 }
]

completedJobs = 0  // success 또는 failed인 job이 없음
totalJobs = 2

allCompleted = false  // 0 !== 2
hasRunning = true     // source-clone이 running

status = "running"  // hasRunning이 true이므로
```

#### 3. 결과
```typescript
sourceStage = {
  stage: "source",
  status: "running",
  jobs: [
    { name: "source-clone", status: "running", order: 1 },
    { name: "source-checkout", status: "pending", order: 2 }
  ],
  completedJobs: 0,
  totalJobs: 2
}
```

---

## 예시 2: Source 단계 완료, Build 단계 진행 중

### 입력 데이터 (API 응답)
```json
{
  "pipelineId": "abc-123",
  "status": "RUNNING",
  "jobs": [
    { "name": "source-clone", "status": "success", "order": 1 },
    { "name": "source-checkout", "status": "success", "order": 2 },
    { "name": "build-compile", "status": "running", "order": 3 },
    { "name": "build-test", "status": "pending", "order": 4 },
    { "name": "deploy-release", "status": "pending", "order": 5 }
  ]
}
```

### 처리 과정

#### 1. Source Stage 상태 계산
```typescript
stageJobs = [
  { name: "source-clone", status: "success", order: 1 },
  { name: "source-checkout", status: "success", order: 2 }
]

completedJobs = 2  // 둘 다 success
totalJobs = 2

allCompleted = true   // 2 === 2
allSuccess = true     // 모든 job이 success

status = "success"  // allCompleted && allSuccess
```

#### 2. Build Stage 상태 계산
```typescript
stageJobs = [
  { name: "build-compile", status: "running", order: 3 },
  { name: "build-test", status: "pending", order: 4 }
]

completedJobs = 0
totalJobs = 2

allCompleted = false  // 0 !== 2
hasRunning = true     // build-compile이 running

status = "running"  // hasRunning이 true이므로
```

#### 3. Deploy Stage 상태 계산
```typescript
stageJobs = [
  { name: "deploy-release", status: "pending", order: 5 }
]

completedJobs = 0
totalJobs = 1

allCompleted = false  // 0 !== 1
hasRunning = false    // running인 job이 없음

status = "pending"  // hasRunning이 false이므로
```

#### 4. 최종 결과
```typescript
{
  sourceStage: {
    stage: "source",
    status: "success",  // ✅ 모든 job 성공
    jobs: [clone, checkout],
    completedJobs: 2,
    totalJobs: 2
  },
  buildStage: {
    stage: "build",
    status: "running",  // 🔄 compile 진행 중
    jobs: [compile, test],
    completedJobs: 0,
    totalJobs: 2
  },
  deployStage: {
    stage: "deploy",
    status: "pending",  // ⏳ 아직 시작 안 함
    jobs: [release],
    completedJobs: 0,
    totalJobs: 1
  }
}
```

---

## 예시 3: Build 단계 실패

### 입력 데이터 (API 응답)
```json
{
  "pipelineId": "abc-123",
  "status": "FAILED",
  "jobs": [
    { "name": "source-clone", "status": "success", "order": 1 },
    { "name": "source-checkout", "status": "success", "order": 2 },
    { "name": "build-compile", "status": "success", "order": 3 },
    { "name": "build-test", "status": "failed", "order": 4 },
    { "name": "deploy-release", "status": "pending", "order": 5 }
  ]
}
```

### 처리 과정

#### Build Stage 상태 계산
```typescript
stageJobs = [
  { name: "build-compile", status: "success", order: 3 },
  { name: "build-test", status: "failed", order: 4 }
]

completedJobs = 2  // 둘 다 완료됨 (success 또는 failed)
totalJobs = 2

allCompleted = true   // 2 === 2
allSuccess = false    // build-test가 failed

status = "failed"  // allCompleted && !allSuccess
```

#### 최종 결과
```typescript
{
  sourceStage: {
    stage: "source",
    status: "success",  // ✅ 성공
    jobs: [clone, checkout],
    completedJobs: 2,
    totalJobs: 2
  },
  buildStage: {
    stage: "build",
    status: "failed",  // ❌ test 실패
    jobs: [compile, test],
    completedJobs: 2,
    totalJobs: 2
  },
  deployStage: {
    stage: "deploy",
    status: "pending",  // ⏳ 시작 안 함 (빌드 실패로 인해)
    jobs: [release],
    completedJobs: 0,
    totalJobs: 1
  }
}
```

---

## 예시 4: 모든 단계 완료 (성공)

### 입력 데이터 (API 응답)
```json
{
  "pipelineId": "abc-123",
  "status": "SUCCESS",
  "jobs": [
    { "name": "source-clone", "status": "success", "order": 1 },
    { "name": "source-checkout", "status": "success", "order": 2 },
    { "name": "build-compile", "status": "success", "order": 3 },
    { "name": "build-test", "status": "success", "order": 4 },
    { "name": "deploy-release", "status": "success", "order": 5 }
  ]
}
```

### 최종 결과
```typescript
{
  sourceStage: {
    stage: "source",
    status: "success",  // ✅
    jobs: [clone, checkout],
    completedJobs: 2,
    totalJobs: 2
  },
  buildStage: {
    stage: "build",
    status: "success",  // ✅
    jobs: [compile, test],
    completedJobs: 2,
    totalJobs: 2
  },
  deployStage: {
    stage: "deploy",
    status: "success",  // ✅
    jobs: [release],
    completedJobs: 1,
    totalJobs: 1
  }
}
```

---

## Job 분류 규칙 상세

### Source Stage 키워드
- `source`, `clone`, `checkout`, `fetch`, `pull`

### Build Stage 키워드
- `build`, `compile`, `test`, `lint`, `unit`, `integration`

### Deploy Stage 키워드
- `deploy`, `release`, `publish`, `push`, `production`

### Fallback 규칙 (이름으로 분류 안 될 때)
- `order <= 2` → Source
- `order <= 5` → Build
- `order > 5` → Deploy

### 예시: Fallback 사용
```typescript
// 이름에 키워드가 없지만 order로 분류
{ name: "setup-env", status: "success", order: 1 } → Source (order <= 2)
{ name: "prepare-build", status: "success", order: 3 } → Build (order <= 5)
{ name: "finalize", status: "pending", order: 6 } → Deploy (order > 5)
```

---

## localStorage 동기화

### 저장되는 데이터
```typescript
// pipelineId만 저장 (나머지는 실시간 상태)
{
  pipelineId: "abc-123"
}
```

### 저장 시점
- `setPipelineId()` 호출 시
- `setPipelineStatus()` 호출 시 (내부적으로 pipelineId 저장)

### 복원 시점
- 페이지 로드 시 Zustand persist middleware가 자동 복원
- 복원된 pipelineId로 TanStack Query가 자동 조회 시작

---

## 성능 최적화

### 선택자 함수 사용
```typescript
// ❌ 나쁜 예: 전체 store 구독
const store = usePipelineStore();

// ✅ 좋은 예: 필요한 상태만 구독
const sourceStage = useSourceStage();
const buildStage = useBuildStage();
const deployStage = useDeployStage();
```

### 불필요한 리렌더링 방지
- 각 컴포넌트는 필요한 상태만 구독
- 상태 변경 시 해당 상태를 구독하는 컴포넌트만 리렌더링

---

## 디버깅

### React DevTools
- Zustand DevTools로 Store 상태 확인
- 상태 변경 히스토리 확인

### 콘솔 로그
```typescript
// Store 상태 확인
console.log(usePipelineStore.getState());

// 특정 단계 상태 확인
console.log(usePipelineStore.getState().sourceStage);
```

