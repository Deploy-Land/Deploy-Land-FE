import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLatestExecution, getLastUpdated, getPipelineStatus } from "../cicd";
import type { PipelineStatus, LatestExecutionResponse, LastUpdatedResponse } from "@/types/cicd";

// fetch를 mock
global.fetch = vi.fn();

describe("cicd API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 환경 변수 설정
    import.meta.env.VITE_API_BASE_URL = "https://test-api.example.com";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getLatestExecution", () => {
    it("LATEST_EXECUTION API를 호출하고 데이터를 반환해야 함", async () => {
      const mockResponse: LatestExecutionResponse = {
        lastStartTime: "2024-01-01T00:00:00.000Z",
        latestExecutionId: "test-pipeline-id",
        pipelineID: "test-pipeline-id",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getLatestExecution();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/status/LATEST_EXECUTION"),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it("API 호출이 실패하면 에러를 throw해야 함", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      });

      await expect(getLatestExecution()).rejects.toThrow();
    });
  });

  describe("getLastUpdated", () => {
    it("LAST_UPDATED API를 호출하고 데이터를 반환해야 함", async () => {
      const mockResponse: LastUpdatedResponse = {
        lastUpdatedTime: "2024-01-01T00:00:00.000Z",
        latestExecutionId: "test-pipeline-id",
        pipelineID: "test-pipeline-id",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getLastUpdated();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/status/LAST_UPDATED"),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getPipelineStatus", () => {
    it("파이프라인 상태 API를 호출하고 데이터를 반환해야 함", async () => {
      const pipelineId = "test-pipeline-id";
      const mockResponse: PipelineStatus = {
        pipelineId,
        pipelineID: pipelineId,
        status: "STARTED",
        currentStage: "Source",
        jobs: [
          {
            jobId: "job-1",
            name: "Source Job",
            status: "running",
            order: 1,
          },
        ],
        totalJobs: 1,
        completedJobs: 0,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getPipelineStatus(pipelineId);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/status/${pipelineId}`),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it("파이프라인을 찾을 수 없으면 에러를 throw해야 함", async () => {
      const pipelineId = "not-found-id";

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Pipeline not found" }),
      });

      await expect(getPipelineStatus(pipelineId)).rejects.toThrow();
    });

    it("네트워크 에러가 발생하면 에러를 throw해야 함", async () => {
      const pipelineId = "test-pipeline-id";

      (global.fetch as any).mockRejectedValueOnce(
        new TypeError("Failed to fetch")
      );

      await expect(getPipelineStatus(pipelineId)).rejects.toThrow();
    });
  });
});

