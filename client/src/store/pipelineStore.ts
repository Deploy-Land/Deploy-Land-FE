import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { PipelineStatus, Job } from "@/types/cicd";

// 파이프라인 단계 타입
export type PipelineStage = "source" | "build" | "deploy";

// 각 단계의 상태
export interface StageStatus {
  stage: PipelineStage;
  status: "pending" | "running" | "success" | "failed";
  jobs: Job[];
  completedJobs: number;
  totalJobs: number;
}

// 파이프라인 스토어 상태
interface PipelineState {
  // 기본 파이프라인 정보
  pipelineId: string | null;
  pipelineStatus: PipelineStatus | null;
  
  // 3단계 상태
  sourceStage: StageStatus;
  buildStage: StageStatus;
  deployStage: StageStatus;
  
  // 로딩 및 에러 상태
  isLoading: boolean;
  error: Error | null;
  
  // 액션
  setPipelineId: (pipelineId: string | null) => void;
  setPipelineStatus: (status: PipelineStatus | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

// Job을 단계로 분류하는 함수
function classifyJobToStage(job: Job): PipelineStage {
  const jobName = job.name.toLowerCase();
  
  // 소스 단계: source, clone, checkout, fetch 등
  if (
    jobName.includes("source") ||
    jobName.includes("clone") ||
    jobName.includes("checkout") ||
    jobName.includes("fetch") ||
    jobName.includes("pull")
  ) {
    return "source";
  }
  
  // 빌드 단계: build, compile, test, lint 등
  if (
    jobName.includes("build") ||
    jobName.includes("compile") ||
    jobName.includes("test") ||
    jobName.includes("lint") ||
    jobName.includes("unit") ||
    jobName.includes("integration")
  ) {
    return "build";
  }
  
  // 디플로이 단계: deploy, release, publish, push 등
  if (
    jobName.includes("deploy") ||
    jobName.includes("release") ||
    jobName.includes("publish") ||
    jobName.includes("push") ||
    jobName.includes("production")
  ) {
    return "deploy";
  }
  
  // 기본값: order를 기반으로 판단
  // order가 낮을수록 앞 단계
  if (job.order <= 2) return "source";
  if (job.order <= 5) return "build";
  return "deploy";
}

// Job 배열을 3단계로 분류하는 함수
function classifyJobsToStages(jobs: Job[] | undefined): {
  source: Job[];
  build: Job[];
  deploy: Job[];
} {
  const source: Job[] = [];
  const build: Job[] = [];
  const deploy: Job[] = [];
  
  // jobs가 없거나 배열이 아니면 빈 배열로 처리
  const jobsArray = jobs || [];
  
  jobsArray.forEach((job) => {
    const stage = classifyJobToStage(job);
    if (stage === "source") source.push(job);
    else if (stage === "build") build.push(job);
    else deploy.push(job);
  });
  
  return { source, build, deploy };
}

// 단계별 상태 계산
function calculateStageStatus(
  stage: PipelineStage,
  jobs: Job[] | undefined
): StageStatus {
  // jobs가 없거나 배열이 아니면 빈 배열로 처리
  const jobsArray = jobs || [];
  const stageJobs = jobsArray.filter((job) => classifyJobToStage(job) === stage);
  
  if (stageJobs.length === 0) {
    return {
      stage,
      status: "pending",
      jobs: [],
      completedJobs: 0,
      totalJobs: 0,
    };
  }
  
  const completedJobs = stageJobs.filter(
    (job) => job.status === "success" || job.status === "failed"
  ).length;
  
  const totalJobs = stageJobs.length;
  
  // 단계 상태 결정
  let status: "pending" | "running" | "success" | "failed" = "pending";
  
  // 모든 job이 완료되었는지 확인
  const allCompleted = completedJobs === totalJobs;
  
  if (allCompleted) {
    // 모든 job이 성공하면 success
    const allSuccess = stageJobs.every((job) => job.status === "success");
    status = allSuccess ? "success" : "failed";
  } else {
    // 진행 중인 job이 있으면 running
    const hasRunning = stageJobs.some((job) => job.status === "running");
    status = hasRunning ? "running" : "pending";
  }
  
  return {
    stage,
    status,
    jobs: stageJobs,
    completedJobs,
    totalJobs,
  };
}

// 초기 상태
const initialState = {
  pipelineId: null,
  pipelineStatus: null,
  sourceStage: {
    stage: "source" as PipelineStage,
    status: "pending" as const,
    jobs: [],
    completedJobs: 0,
    totalJobs: 0,
  },
  buildStage: {
    stage: "build" as PipelineStage,
    status: "pending" as const,
    jobs: [],
    completedJobs: 0,
    totalJobs: 0,
  },
  deployStage: {
    stage: "deploy" as PipelineStage,
    status: "pending" as const,
    jobs: [],
    completedJobs: 0,
    totalJobs: 0,
  },
  isLoading: false,
  error: null,
};

export const usePipelineStore = create<PipelineState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        setPipelineId: (pipelineId) =>
          set({ pipelineId }, false, "setPipelineId"),
        
        setPipelineStatus: (status) => {
          if (!status) {
            set({ pipelineStatus: null }, false, "setPipelineStatus");
            return;
          }
          
          // Job들을 3단계로 분류하여 상태 계산 (jobs가 없으면 빈 배열 사용)
          const jobs = status.jobs || [];
          const sourceStage = calculateStageStatus("source", jobs);
          const buildStage = calculateStageStatus("build", jobs);
          const deployStage = calculateStageStatus("deploy", jobs);
          
          set(
            {
              pipelineStatus: status,
              sourceStage,
              buildStage,
              deployStage,
            },
            false,
            "setPipelineStatus"
          );
        },
        
        setLoading: (isLoading) =>
          set({ isLoading }, false, "setLoading"),
        
        setError: (error) => set({ error }, false, "setError"),
        
        reset: () => set(initialState, false, "reset"),
      }),
      {
        name: "pipeline-storage",
        // pipelineId만 저장 (나머지는 실시간 상태)
        partialize: (state) => ({
          pipelineId: state.pipelineId,
        }),
      }
    ),
    { name: "PipelineStore" }
  )
);

// 선택자 함수들 (성능 최적화)
export const usePipelineId = () => usePipelineStore((state) => state.pipelineId);
export const usePipelineStatus = () => usePipelineStore((state) => state.pipelineStatus);
export const useSourceStage = () => usePipelineStore((state) => state.sourceStage);
export const useBuildStage = () => usePipelineStore((state) => state.buildStage);
export const useDeployStage = () => usePipelineStore((state) => state.deployStage);
export const usePipelineLoading = () => usePipelineStore((state) => state.isLoading);
export const usePipelineError = () => usePipelineStore((state) => state.error);

