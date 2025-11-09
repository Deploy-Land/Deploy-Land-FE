import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { PipelineStatus, Job } from "@/types/cicd";

// 파이프라인 단계 타입
export type PipelineStage = "Source" | "Build" | "Deploy";

// 각 단계의 상태
export interface StageStatus {
  stage: PipelineStage;
  status: "STARTED" | "SUCCEEDED" | "FAILED" | "CANCELED";
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
    jobName.includes("Source") ||
    jobName.includes("clone") ||
    jobName.includes("checkout") ||
    jobName.includes("fetch") ||
    jobName.includes("pull")
  ) {
    return "Source";
  }
  
  // 빌드 단계: build, compile, test, lint 등
  if (
    jobName.includes("Build") ||
    jobName.includes("compile") ||
    jobName.includes("test") ||
    jobName.includes("lint") ||
    jobName.includes("unit") ||
    jobName.includes("integration")
  ) {
    return "Build";
  }
  
  // 디플로이 단계: deploy, release, publish, push 등
  if (
    jobName.includes("Deploy") ||
    jobName.includes("release") ||
    jobName.includes("publish") ||
    jobName.includes("push") ||
    jobName.includes("production")
  ) {
    return "Deploy";
  }
  
  // 기본값: order를 기반으로 판단
  // order가 낮을수록 앞 단계
  if (job.order <= 2) return "Source";
  if (job.order <= 5) return "Build";
  return "Deploy";
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
    if (stage === "Source") source.push(job);
    else if (stage === "Build") build.push(job);
    else if (stage === "Deploy") deploy.push(job);
  });
  
  return { source, build, deploy };
}

// 단계별 상태 계산
// Job 상태("pending" | "running" | "success" | "failed")를 
// StageStatus 상태("STARTED" | "SUCCEEDED" | "FAILED" | "CANCELED")로 변환
function calculateStageStatus(
  stage: PipelineStage,
  jobs: Job[] | undefined,
  pipelineStatus?: PipelineStatus | null
): StageStatus {
  // 전체 파이프라인 상태 확인
  const pipelineStatusUpper = (pipelineStatus?.status || "").toUpperCase().trim();
  const currentStage = pipelineStatus?.currentStage || "";
  
  // jobs가 없거나 배열이 아니면 파이프라인 상태와 currentStage를 기반으로 추론
  const jobsArray = jobs || [];
  const stageJobs = jobsArray.filter((job) => classifyJobToStage(job) === stage);
  
  // jobs가 없는 경우: 파이프라인 상태와 currentStage를 기반으로 상태 추론
  if (jobsArray.length === 0) {
    let status: "STARTED" | "SUCCEEDED" | "FAILED" | "CANCELED" = "STARTED";
    let completedJobs = 0;
    let totalJobs = 0;
    
    // 단계 순서 정의
    const stageOrder: Record<PipelineStage, number> = { Source: 1, Build: 2, Deploy: 3 };
    const currentStageLower = currentStage.toLowerCase();
    
    // currentStage에서 단계 추출 (대소문자 무시)
    const getCurrentStageOrder = (): number => {
      if (!currentStage) return 0;
      const lower = currentStageLower;
      if (lower.includes("source")) return 1;
      if (lower.includes("build")) return 2;
      if (lower.includes("deploy")) return 3;
      return 0;
    };
    
    const currentStageOrder = getCurrentStageOrder();
    const thisStageOrder = stageOrder[stage];
    
    // 파이프라인 상태에 따라 단계별 상태 결정
    if (pipelineStatusUpper === "CANCELED") {
      status = "CANCELED";
      totalJobs = pipelineStatus?.totalJobs || 0;
      completedJobs = pipelineStatus?.completedJobs || 0;
    } else if (pipelineStatusUpper === "SUCCEEDED" || pipelineStatusUpper === "SUCCESS") {
      // 성공한 경우: 모든 단계가 SUCCEEDED
      status = "SUCCEEDED";
      // totalJobs와 completedJobs가 있으면 단계별로 분배 (간단하게 1/3씩)
      if (pipelineStatus?.totalJobs && pipelineStatus?.completedJobs) {
        totalJobs = Math.max(1, Math.floor(pipelineStatus.totalJobs / 3));
        completedJobs = totalJobs;
      } else {
        totalJobs = 1;
        completedJobs = 1;
      }
    } else if (pipelineStatusUpper === "FAILED" || pipelineStatusUpper === "FAILURE") {
      // 실패한 경우: currentStage와 비교하여 실패한 단계는 FAILED, 이전 단계는 SUCCEEDED
      if (currentStageOrder > 0 && thisStageOrder === currentStageOrder) {
        // 현재 단계가 실패한 단계
        status = "FAILED";
        totalJobs = pipelineStatus?.totalJobs || 1;
        completedJobs = pipelineStatus?.completedJobs || 1;
      } else if (currentStageOrder > 0 && thisStageOrder < currentStageOrder) {
        // 이전 단계는 성공한 것으로 간주
        status = "SUCCEEDED";
        totalJobs = pipelineStatus?.totalJobs || 1;
        completedJobs = totalJobs;
      } else {
        // 이후 단계는 시작되지 않음
        status = "STARTED";
        totalJobs = 0;
        completedJobs = 0;
      }
    } else if (pipelineStatusUpper === "STARTED" || pipelineStatusUpper === "IN_PROGRESS") {
      // 진행 중인 경우: currentStage에 따라 진행 중인 단계는 STARTED
      if (currentStageOrder > 0 && thisStageOrder === currentStageOrder) {
        // 현재 진행 중인 단계
        status = "STARTED";
        totalJobs = pipelineStatus?.totalJobs || 1;
        completedJobs = pipelineStatus?.completedJobs || 0;
      } else if (currentStageOrder > 0 && thisStageOrder < currentStageOrder) {
        // 이전 단계는 성공한 것으로 간주
        status = "SUCCEEDED";
        totalJobs = pipelineStatus?.totalJobs || 1;
        completedJobs = totalJobs;
      } else {
        // 이후 단계는 아직 시작되지 않음
        status = "STARTED";
        totalJobs = 0;
        completedJobs = 0;
      }
    } else {
      // 상태가 명확하지 않은 경우: 기본값
      status = "STARTED";
      totalJobs = pipelineStatus?.totalJobs || 0;
      completedJobs = pipelineStatus?.completedJobs || 0;
    }
    
    return {
      stage,
      status,
      jobs: [],
      completedJobs,
      totalJobs,
    };
  }
  
  // jobs가 있는 경우: 기존 로직 사용
  const completedJobs = stageJobs.filter(
    (job) => job.status === "success" || job.status === "failed"
  ).length;
  
  const totalJobs = stageJobs.length;
  
  // 단계 상태 결정 (타입: "STARTED" | "SUCCEEDED" | "FAILED" | "CANCELED")
  let status: "STARTED" | "SUCCEEDED" | "FAILED" | "CANCELED" = "STARTED";
  
  // 파이프라인이 취소된 경우
  if (pipelineStatusUpper === "CANCELED") {
    status = "CANCELED";
  }
  // 모든 job이 완료되었는지 확인
  else if (completedJobs === totalJobs) {
    // 모든 job이 성공하면 SUCCEEDED
    const allSuccess = stageJobs.every((job) => job.status === "success");
    status = allSuccess ? "SUCCEEDED" : "FAILED";
  } else {
    // 진행 중인 job이 있으면 STARTED (running 상태)
    const hasRunning = stageJobs.some((job) => job.status === "running");
    status = hasRunning ? "STARTED" : "STARTED"; // pending도 STARTED로 처리
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
    stage: "Source" as PipelineStage,
    status: "STARTED" as const,
    jobs: [],
    completedJobs: 0,
    totalJobs: 0,
  },
  buildStage: {
    stage: "Build" as PipelineStage,
    status: "STARTED" as const,
    jobs: [],
    completedJobs: 0,
    totalJobs: 0,
  },
  deployStage: {
    stage: "Deploy" as PipelineStage,
    status: "STARTED" as const,
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
          const sourceStage = calculateStageStatus("Source", jobs, status);
          const buildStage = calculateStageStatus("Build", jobs, status);
          const deployStage = calculateStageStatus("Deploy", jobs, status);
          
          // 디버깅: 상태 업데이트 로그
          if (import.meta.env.DEV) {
            console.log("📊 Pipeline Status 업데이트:", {
              pipelineId: status.pipelineId || status.pipelineID,
              status: status.status,
              totalJobs: jobs.length,
              sourceStage: { status: sourceStage.status, jobs: sourceStage.totalJobs },
              buildStage: { status: buildStage.status, jobs: buildStage.totalJobs },
              deployStage: { status: deployStage.status, jobs: deployStage.totalJobs },
            });
          }
          
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

