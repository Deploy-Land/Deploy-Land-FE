import type { PipelineStatus, LatestExecutionResponse, LastUpdatedResponse, ValidationWebhookResponse } from "@/types/cicd";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

if (import.meta.env.DEV) {
  console.log("환경 변수 체크:", {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    API_BASE_URL: API_BASE_URL,
    mode: import.meta.env.MODE,
  });
}

if (!API_BASE_URL && import.meta.env.DEV) {
  console.warn(
    "VITE_API_BASE_URL이 설정되지 않았습니다. API 호출이 실패할 수 있습니다."
  );
}

// ETag 캐시: endpoint → { etag, data }
const etagCache = new Map<string, { etag: string; data: unknown }>();

// 마지막 폴링 메타데이터 (AIMD 주기 조절에 사용)
export const pollMeta = {
  status: 200,
  dataChanged: true,
  serverHintMs: undefined as number | undefined,
};

async function fetchAPI<T>(
  endpoint: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  }
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL이 설정되지 않았습니다. 환경 변수를 확인해주세요.");
  }

  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = import.meta.env.DEV
    ? path
    : `${API_BASE_URL.replace(/\/+$/, "")}${path}`;

  const method = options?.method || "GET";
  const body = options?.body ? JSON.stringify(options.body) : undefined;

  const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
  const cached = etagCache.get(endpoint);
  if (method === "GET" && cached?.etag) {
    reqHeaders["If-None-Match"] = cached.etag;
  }

  if (import.meta.env.DEV) {
    console.log(`API 호출: ${method} ${url}`, cached?.etag ? `[ETag: ${cached.etag}]` : "");
  }

  try {
    const response = await fetch(url, {
      method,
      headers: reqHeaders,
      body,
      mode: "cors",
      credentials: "omit",
    });

    // 304 Not Modified → 캐시된 데이터 반환, 페이로드 전송 0
    if (response.status === 304 && cached) {
      pollMeta.status = 304;
      pollMeta.dataChanged = false;
      pollMeta.serverHintMs = undefined;
      const hint = response.headers.get("X-Next-Poll-Ms");
      if (hint) pollMeta.serverHintMs = parseInt(hint, 10);
      return cached.data as T;
    }

    if (!response.ok) {
      // 429 스로틀링 메타 기록
      pollMeta.status = response.status;
      pollMeta.dataChanged = false;

      const error = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage = error.message || error.error || `HTTP error! status: ${response.status}`;

      if (response.status === 404 && endpoint.includes("LAST_UPDATED")) {
        throw new Error(`LAST_UPDATED_NOT_SUPPORTED: ${errorMessage}`);
      }

      if (import.meta.env.DEV) {
        console.error(`API 오류 [${response.status}]:`, errorMessage);
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    // ETag 캐싱
    const etag = response.headers.get("ETag");
    if (etag) {
      const prevData = cached?.data;
      pollMeta.dataChanged = JSON.stringify(prevData) !== JSON.stringify(data);
      etagCache.set(endpoint, { etag, data });
    } else {
      pollMeta.dataChanged = true;
    }

    pollMeta.status = 200;
    const hint = response.headers.get("X-Next-Poll-Ms");
    pollMeta.serverHintMs = hint ? parseInt(hint, 10) : undefined;

    if (import.meta.env.DEV) {
      console.log(`API 응답:`, { etag, hint, dataChanged: pollMeta.dataChanged });
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      const detailedError = new Error(
        `API 요청 실패: ${error.message}\n` +
        `URL: ${url}\n` +
        `가능한 원인:\n` +
        `1. CORS 설정 문제 - API Gateway에서 ${window.location.origin}을 허용해야 합니다\n` +
        `2. 네트워크 연결 문제 - API Gateway URL을 확인해주세요\n` +
        `3. API Gateway가 실행 중이 아닐 수 있습니다`
      );
      throw detailedError;
    }
    throw error;
  }
}

export async function getLatestExecution(): Promise<LatestExecutionResponse> {
  return fetchAPI<LatestExecutionResponse>("/api/status/LATEST_EXECUTION");
}

export async function getLastUpdated(): Promise<LastUpdatedResponse> {
  return fetchAPI<LastUpdatedResponse>("/api/status/LAST_UPDATED");
}

export async function getPipelineStatus(pipelineId: string): Promise<PipelineStatus> {
  return fetchAPI<PipelineStatus>(`/api/status/${pipelineId}`);
}

/**
 * 벨리데이션 웹훅 호출
 * POST /webhook 엔드포인트를 호출하여 Beanstalk 환경 URL을 가져옵니다.
 * @param body 요청 본문 (선택적, 빈 {}도 가능)
 * @returns 벨리데이션 웹훅 응답
 */
export async function callValidationWebhook(
  body: Record<string, unknown> = {}
): Promise<ValidationWebhookResponse> {
  return fetchAPI<ValidationWebhookResponse>("/webhook", {
    method: "POST",
    body,
  });
}

