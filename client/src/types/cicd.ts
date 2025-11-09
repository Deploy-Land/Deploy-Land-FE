export type PipelineStatusType = "STARTED" | "SUCCEEDED" | "FAILED" | "CANCELED" | "IN_PROGRESS";

export interface LastUpdatedResponse {
  lastUpdatedTime: string;
  latestExecutionId?: string;
  pipelineID?: string;
}

export interface PipelineStatus {
  pipelineId?: string;
  pipelineID?: string; // API 응답에서 대문자로 오는 경우 (예: "b71a11b6-a4ee-4fba-882b-7e8543dfad0e")
  status: string; // "STARTED" | "SUCCEEDED" | "FAILED" | "CANCELED" (모두 대문자)
  jobs?: Job[];
  totalJobs?: number;
  completedJobs?: number;
  // 실제 API 응답에 포함될 수 있는 필드들
  currentStage?: string; // "Build" | "Source" | "Deploy" (PascalCase - 처음만 대문자)
  errorMessage?: string;
  aiSolution?: string;
  logUrl?: string; // CloudWatch 로그 URL (예: "https://ap-northeast-2.console.aws.amazon.com/...")
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

/**
 * 벨리데이션 웹훅 응답
 */
export interface ValidationWebhookResponse {
  message: string;
  beanstalkUrl?: string;
  error?: string;
}

