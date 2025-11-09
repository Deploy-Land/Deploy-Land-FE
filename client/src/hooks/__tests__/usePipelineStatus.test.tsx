import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { usePipelineStatus } from "../usePipelineStatus";
import * as cicdApi from "@/lib/api/cicd";
import { usePipelineStore } from "@/store/pipelineStore";

// Mock API 함수들
vi.mock("@/lib/api/cicd", () => ({
  getLatestExecution: vi.fn(),
  getLastUpdated: vi.fn(),
  getPipelineStatus: vi.fn(),
}));

// Mock storage
vi.mock("@/lib/storage", () => ({
  storePipelineId: vi.fn(),
  clearStoredPipelineId: vi.fn(),
  getStoredPipelineId: vi.fn(() => null),
}));

describe("usePipelineStatus", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          refetchInterval: false, // 테스트 시 폴링 비활성화
        },
      },
    });
    vi.clearAllMocks();
    usePipelineStore.getState().reset();
  });

  it("초기 로드 시 LATEST_EXECUTION을 호출해야 함", async () => {
    const mockLatestExecution = {
      lastStartTime: "2024-01-01T00:00:00.000Z",
      latestExecutionId: "test-pipeline-id",
    };

    vi.mocked(cicdApi.getLatestExecution).mockResolvedValue(mockLatestExecution);
    vi.mocked(cicdApi.getPipelineStatus).mockResolvedValue({
      pipelineId: "test-pipeline-id",
      status: "STARTED",
      jobs: [],
    });

    const { result } = renderHook(() => usePipelineStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.pipelineId).toBe("test-pipeline-id");
    });

    expect(cicdApi.getLatestExecution).toHaveBeenCalled();
  });

  it("pipelineId가 있으면 파이프라인 상태를 조회해야 함", async () => {
    const mockPipelineStatus = {
      pipelineId: "test-pipeline-id",
      status: "STARTED",
      jobs: [],
    };

    usePipelineStore.getState().setPipelineId("test-pipeline-id");
    vi.mocked(cicdApi.getPipelineStatus).mockResolvedValue(mockPipelineStatus);

    const { result } = renderHook(() => usePipelineStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.pipelineStatus).toBeDefined();
    });

    expect(cicdApi.getPipelineStatus).toHaveBeenCalledWith("test-pipeline-id");
  });

  it("파이프라인 상태를 Zustand store에 저장해야 함", async () => {
    const mockPipelineStatus = {
      pipelineId: "test-pipeline-id",
      status: "STARTED",
      jobs: [],
    };

    usePipelineStore.getState().setPipelineId("test-pipeline-id");
    vi.mocked(cicdApi.getPipelineStatus).mockResolvedValue(mockPipelineStatus);

    const { result } = renderHook(() => usePipelineStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.pipelineStatus).toBeDefined();
    });

    // Zustand store에 상태가 저장되었는지 확인
    const storeState = usePipelineStore.getState();
    expect(storeState.pipelineStatus).toEqual(mockPipelineStatus);
  });

  it("에러가 발생하면 error 상태를 설정해야 함", async () => {
    const error = new Error("API Error");
    vi.mocked(cicdApi.getPipelineStatus).mockRejectedValue(error);
    usePipelineStore.getState().setPipelineId("test-pipeline-id");

    const { result } = renderHook(() => usePipelineStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});

