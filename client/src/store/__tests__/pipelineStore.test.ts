import { describe, it, expect, beforeEach } from "vitest";
import { usePipelineStore } from "../pipelineStore";
import type { PipelineStatus } from "@/types/cicd";

describe("pipelineStore", () => {
  beforeEach(() => {
    // 각 테스트 전에 store 초기화
    usePipelineStore.getState().reset();
  });

  it("초기 상태가 올바르게 설정되어야 함", () => {
    const state = usePipelineStore.getState();
    
    expect(state.pipelineId).toBeNull();
    expect(state.pipelineStatus).toBeNull();
    expect(state.sourceStage.status).toBe("STARTED");
    expect(state.buildStage.status).toBe("STARTED");
    expect(state.deployStage.status).toBe("STARTED");
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("pipelineId를 설정할 수 있어야 함", () => {
    const setPipelineId = usePipelineStore.getState().setPipelineId;
    
    setPipelineId("test-pipeline-id");
    
    const state = usePipelineStore.getState();
    expect(state.pipelineId).toBe("test-pipeline-id");
  });

  it("pipelineStatus를 설정하면 단계별 상태가 계산되어야 함", () => {
    const setPipelineStatus = usePipelineStore.getState().setPipelineStatus;
    
    const mockStatus: PipelineStatus = {
      pipelineId: "test-id",
      status: "STARTED",
      jobs: [
        {
          jobId: "job-1",
          name: "Source Clone",
          status: "running",
          order: 1,
        },
        {
          jobId: "job-2",
          name: "Build Compile",
          status: "pending",
          order: 2,
        },
        {
          jobId: "job-3",
          name: "Deploy Release",
          status: "pending",
          order: 3,
        },
      ],
      totalJobs: 3,
      completedJobs: 0,
    };
    
    setPipelineStatus(mockStatus);
    
    const state = usePipelineStore.getState();
    expect(state.pipelineStatus).toEqual(mockStatus);
    expect(state.sourceStage.totalJobs).toBe(1);
    expect(state.sourceStage.status).toBe("STARTED");
    expect(state.buildStage.totalJobs).toBe(1);
    expect(state.buildStage.status).toBe("STARTED");
    expect(state.deployStage.totalJobs).toBe(1);
    expect(state.deployStage.status).toBe("STARTED");
  });

  it("모든 job이 성공하면 단계 상태가 SUCCEEDED가 되어야 함", () => {
    const setPipelineStatus = usePipelineStore.getState().setPipelineStatus;
    
    const mockStatus: PipelineStatus = {
      pipelineId: "test-id",
      status: "SUCCEEDED",
      jobs: [
        {
          jobId: "job-1",
          name: "Source Clone",
          status: "success",
          order: 1,
        },
        {
          jobId: "job-2",
          name: "Build Compile",
          status: "success",
          order: 2,
        },
        {
          jobId: "job-3",
          name: "Deploy Release",
          status: "success",
          order: 3,
        },
      ],
      totalJobs: 3,
      completedJobs: 3,
    };
    
    setPipelineStatus(mockStatus);
    
    const state = usePipelineStore.getState();
    expect(state.sourceStage.status).toBe("SUCCEEDED");
    expect(state.buildStage.status).toBe("SUCCEEDED");
    expect(state.deployStage.status).toBe("SUCCEEDED");
  });

  it("job이 실패하면 단계 상태가 FAILED가 되어야 함", () => {
    const setPipelineStatus = usePipelineStore.getState().setPipelineStatus;
    
    const mockStatus: PipelineStatus = {
      pipelineId: "test-id",
      status: "FAILED",
      jobs: [
        {
          jobId: "job-1",
          name: "Source Clone",
          status: "success",
          order: 1,
        },
        {
          jobId: "job-2",
          name: "Build Compile",
          status: "failed",
          order: 2,
        },
        {
          jobId: "job-3",
          name: "Deploy Release",
          status: "pending",
          order: 3,
        },
      ],
      totalJobs: 3,
      completedJobs: 1,
    };
    
    setPipelineStatus(mockStatus);
    
    const state = usePipelineStore.getState();
    expect(state.sourceStage.status).toBe("SUCCEEDED");
    expect(state.buildStage.status).toBe("FAILED");
    expect(state.deployStage.status).toBe("STARTED");
  });

  it("파이프라인이 취소되면 단계 상태가 CANCELED가 되어야 함", () => {
    const setPipelineStatus = usePipelineStore.getState().setPipelineStatus;
    
    const mockStatus: PipelineStatus = {
      pipelineId: "test-id",
      status: "CANCELED",
      jobs: [
        {
          jobId: "job-1",
          name: "Source Clone",
          status: "running",
          order: 1,
        },
      ],
      totalJobs: 1,
      completedJobs: 0,
    };
    
    setPipelineStatus(mockStatus);
    
    const state = usePipelineStore.getState();
    expect(state.sourceStage.status).toBe("CANCELED");
  });

  it("loading 상태를 설정할 수 있어야 함", () => {
    const setLoading = usePipelineStore.getState().setLoading;
    
    setLoading(true);
    expect(usePipelineStore.getState().isLoading).toBe(true);
    
    setLoading(false);
    expect(usePipelineStore.getState().isLoading).toBe(false);
  });

  it("error 상태를 설정할 수 있어야 함", () => {
    const setError = usePipelineStore.getState().setError;
    
    const testError = new Error("Test error");
    setError(testError);
    expect(usePipelineStore.getState().error).toBe(testError);
    
    setError(null);
    expect(usePipelineStore.getState().error).toBeNull();
  });

  it("reset을 호출하면 초기 상태로 돌아가야 함", () => {
    const setPipelineId = usePipelineStore.getState().setPipelineId;
    const setPipelineStatus = usePipelineStore.getState().setPipelineStatus;
    const reset = usePipelineStore.getState().reset;
    
    setPipelineId("test-id");
    setPipelineStatus({
      pipelineId: "test-id",
      status: "STARTED",
      jobs: [],
    });
    
    reset();
    
    const state = usePipelineStore.getState();
    expect(state.pipelineId).toBeNull();
    expect(state.pipelineStatus).toBeNull();
    expect(state.sourceStage.status).toBe("STARTED");
  });
});

