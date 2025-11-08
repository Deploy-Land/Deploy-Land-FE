export interface PipelineStatus {
  pipelineId?: string;
  pipelineID?: string; // API 응답에서 대문자로 오는 경우
  status: string;
  jobs?: Job[];
  totalJobs?: number;
  completedJobs?: number;
  // 실제 API 응답에 포함될 수 있는 필드들
  currentStage?: string;
  errorMessage?: string;
  aiSolution?: string;
  logUrl?: string;
}

export interface LatestExecutionResponse {
  lastStartTime: string;
  latestExecutionId: string; // 실제 API 응답 필드명 (소문자 'd')
  pipelineID?: string; // 응답에 포함될 수 있는 필드
}

export interface Job {
  jobId: string;
  name: string;
  status: "pending" | "running" | "success" | "failed";
  order: number;
  metadata?: Record<string, unknown>;
}

