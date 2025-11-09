import type { PipelineStatus, LatestExecutionResponse, LastUpdatedResponse } from "@/types/cicd";

// Mock 데이터
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

export const mockPipelineStatusStarted: PipelineStatus = {
  pipelineId: "mock-pipeline-id-123",
  pipelineID: "mock-pipeline-id-123",
  status: "STARTED",
  currentStage: "Source",
  jobs: [
    {
      jobId: "job-1",
      name: "Source Job",
      status: "running",
      order: 1,
    },
    {
      jobId: "job-2",
      name: "Build Job",
      status: "pending",
      order: 2,
    },
    {
      jobId: "job-3",
      name: "Deploy Job",
      status: "pending",
      order: 3,
    },
  ],
  totalJobs: 3,
  completedJobs: 0,
};

export const mockPipelineStatusSucceeded: PipelineStatus = {
  pipelineId: "mock-pipeline-id-123",
  pipelineID: "mock-pipeline-id-123",
  status: "SUCCEEDED",
  currentStage: "Deploy",
  jobs: [
    {
      jobId: "job-1",
      name: "Source Job",
      status: "success",
      order: 1,
    },
    {
      jobId: "job-2",
      name: "Build Job",
      status: "success",
      order: 2,
    },
    {
      jobId: "job-3",
      name: "Deploy Job",
      status: "success",
      order: 3,
    },
  ],
  totalJobs: 3,
  completedJobs: 3,
};

export const mockPipelineStatusFailed: PipelineStatus = {
  pipelineId: "mock-pipeline-id-123",
  pipelineID: "mock-pipeline-id-123",
  status: "FAILED",
  currentStage: "Build",
  errorMessage: "Build failed: Test error",
  aiSolution: "Check the build logs and fix the compilation errors",
  logUrl: "https://ap-northeast-2.console.aws.amazon.com/cloudwatch/test",
  jobs: [
    {
      jobId: "job-1",
      name: "Source Job",
      status: "success",
      order: 1,
    },
    {
      jobId: "job-2",
      name: "Build Job",
      status: "failed",
      order: 2,
    },
    {
      jobId: "job-3",
      name: "Deploy Job",
      status: "pending",
      order: 3,
    },
  ],
  totalJobs: 3,
  completedJobs: 1,
};

// Mock 함수들
export const getLatestExecution = vi.fn(async (): Promise<LatestExecutionResponse> => {
  return mockLatestExecution;
});

export const getLastUpdated = vi.fn(async (): Promise<LastUpdatedResponse> => {
  return mockLastUpdated;
});

export const getPipelineStatus = vi.fn(async (pipelineId: string): Promise<PipelineStatus> => {
  if (pipelineId === "mock-pipeline-id-123") {
    return mockPipelineStatusStarted;
  }
  throw new Error(`Pipeline not found: ${pipelineId}`);
});

