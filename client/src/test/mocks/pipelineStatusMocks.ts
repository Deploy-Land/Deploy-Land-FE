import type { PipelineStatus, LatestExecutionResponse, LastUpdatedResponse } from "@/types/cicd";

/**
 * Mock 파이프라인 상태 데이터
 * 테스트에서 사용할 수 있는 다양한 상태의 파이프라인 데이터
 */

export const mockLatestExecution: LatestExecutionResponse = {
  lastStartTime: "2024-01-01T00:00:00.000Z",
  latestExecutionId: "mock-pipeline-id-123",
  pipelineID: "mock-pipeline-id-123",
};

export const mockLastUpdated: LastUpdatedResponse = {
  lastUpdatedTime: "2024-01-01T00:00:00.000Z",
  latestExecutionId: "mock-pipeline-id-123",
  pipelineID: "mock-pipeline-id-123",
};

// STARTED 상태의 파이프라인
export const mockPipelineStatusStarted: PipelineStatus = {
  pipelineId: "mock-pipeline-id-123",
  pipelineID: "mock-pipeline-id-123",
  status: "STARTED",
  currentStage: "Source",
  jobs: [
    {
      jobId: "job-source-1",
      name: "Source Clone",
      status: "running",
      order: 1,
    },
    {
      jobId: "job-build-1",
      name: "Build Compile",
      status: "pending",
      order: 2,
    },
    {
      jobId: "job-deploy-1",
      name: "Deploy Release",
      status: "pending",
      order: 3,
    },
  ],
  totalJobs: 3,
  completedJobs: 0,
};

// SUCCEEDED 상태의 파이프라인
export const mockPipelineStatusSucceeded: PipelineStatus = {
  pipelineId: "mock-pipeline-id-123",
  pipelineID: "mock-pipeline-id-123",
  status: "SUCCEEDED",
  currentStage: "Deploy",
  jobs: [
    {
      jobId: "job-source-1",
      name: "Source Clone",
      status: "success",
      order: 1,
    },
    {
      jobId: "job-build-1",
      name: "Build Compile",
      status: "success",
      order: 2,
    },
    {
      jobId: "job-deploy-1",
      name: "Deploy Release",
      status: "success",
      order: 3,
    },
  ],
  totalJobs: 3,
  completedJobs: 3,
};

// FAILED 상태의 파이프라인
export const mockPipelineStatusFailed: PipelineStatus = {
  pipelineId: "mock-pipeline-id-123",
  pipelineID: "mock-pipeline-id-123",
  status: "FAILED",
  currentStage: "Build",
  errorMessage: "Build failed: Compilation error in src/main.ts",
  aiSolution: "Check the build logs and fix the compilation errors. Make sure all imports are correct.",
  logUrl: "https://ap-northeast-2.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#logs:log-group:%2Faws%2Fcodebuild%2Fsample-app2-eb-build",
  jobs: [
    {
      jobId: "job-source-1",
      name: "Source Clone",
      status: "success",
      order: 1,
    },
    {
      jobId: "job-build-1",
      name: "Build Compile",
      status: "failed",
      order: 2,
    },
    {
      jobId: "job-deploy-1",
      name: "Deploy Release",
      status: "pending",
      order: 3,
    },
  ],
  totalJobs: 3,
  completedJobs: 1,
};

// CANCELED 상태의 파이프라인
export const mockPipelineStatusCanceled: PipelineStatus = {
  pipelineId: "mock-pipeline-id-123",
  pipelineID: "mock-pipeline-id-123",
  status: "CANCELED",
  currentStage: "Source",
  jobs: [
    {
      jobId: "job-source-1",
      name: "Source Clone",
      status: "running",
      order: 1,
    },
  ],
  totalJobs: 1,
  completedJobs: 0,
};

// Build 단계 진행 중인 파이프라인
export const mockPipelineStatusBuildRunning: PipelineStatus = {
  pipelineId: "mock-pipeline-id-123",
  pipelineID: "mock-pipeline-id-123",
  status: "STARTED",
  currentStage: "Build",
  jobs: [
    {
      jobId: "job-source-1",
      name: "Source Clone",
      status: "success",
      order: 1,
    },
    {
      jobId: "job-build-1",
      name: "Build Compile",
      status: "running",
      order: 2,
    },
    {
      jobId: "job-deploy-1",
      name: "Deploy Release",
      status: "pending",
      order: 3,
    },
  ],
  totalJobs: 3,
  completedJobs: 1,
};

// Deploy 단계 진행 중인 파이프라인
export const mockPipelineStatusDeployRunning: PipelineStatus = {
  pipelineId: "mock-pipeline-id-123",
  pipelineID: "mock-pipeline-id-123",
  status: "STARTED",
  currentStage: "Deploy",
  jobs: [
    {
      jobId: "job-source-1",
      name: "Source Clone",
      status: "success",
      order: 1,
    },
    {
      jobId: "job-build-1",
      name: "Build Compile",
      status: "success",
      order: 2,
    },
    {
      jobId: "job-deploy-1",
      name: "Deploy Release",
      status: "running",
      order: 3,
    },
  ],
  totalJobs: 3,
  completedJobs: 2,
};

/**
 * 파이프라인 상태를 순차적으로 변경하는 헬퍼 함수
 * 테스트에서 파이프라인 진행을 시뮬레이션할 때 사용
 */
export const getPipelineStatusSequence = (): PipelineStatus[] => {
  return [
    mockPipelineStatusStarted,
    mockPipelineStatusBuildRunning,
    mockPipelineStatusDeployRunning,
    mockPipelineStatusSucceeded,
  ];
};

/**
 * 실패 시나리오의 파이프라인 상태 시퀀스
 */
export const getPipelineStatusFailureSequence = (): PipelineStatus[] => {
  return [
    mockPipelineStatusStarted,
    mockPipelineStatusBuildRunning,
    mockPipelineStatusFailed,
  ];
};

