import type { PipelineStatus, LatestExecutionResponse } from "@/types/cicd";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// 디버깅: 환경 변수 로드 확인
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

async function fetchAPI<T>(endpoint: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL이 설정되지 않았습니다. 환경 변수를 확인해주세요.");
  }

  // 개발 환경에서는 Vite 프록시를 통해 호출 (CORS 문제 우회)
  // 프로덕션에서는 직접 API Gateway 호출
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = import.meta.env.DEV 
    ? path  // 개발 환경: Vite 프록시 사용 (상대 경로)
    : `${API_BASE_URL.replace(/\/+$/, "")}${path}`;  // 프로덕션: 직접 호출
  
  if (import.meta.env.DEV) {
    console.log(`API 호출 (${import.meta.env.DEV ? "프록시" : "직접"}): ${url}`);
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // CORS 문제 해결을 위한 옵션
      mode: "cors",
      credentials: "omit",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage = error.message || `HTTP error! status: ${response.status}`;
      
      if (import.meta.env.DEV) {
        console.error(`API 오류 [${response.status}]:`, errorMessage);
        console.error(`URL: ${url}`);
        console.error(`응답 헤더:`, Object.fromEntries(response.headers.entries()));
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (import.meta.env.DEV) {
      console.log(`API 응답:`, data);
    }

    return data;
  } catch (error) {
    // fetch 자체가 실패한 경우 (CORS, 네트워크 에러 등)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      const detailedError = new Error(
        `API 요청 실패: ${error.message}\n` +
        `URL: ${url}\n` +
        `가능한 원인:\n` +
        `1. CORS 설정 문제 - API Gateway에서 ${window.location.origin}을 허용해야 합니다\n` +
        `2. 네트워크 연결 문제 - API Gateway URL을 확인해주세요\n` +
        `3. API Gateway가 실행 중이 아닐 수 있습니다`
      );
      
      if (import.meta.env.DEV) {
        console.error("Fetch 실패 상세 정보:", {
          error,
          url,
          origin: window.location.origin,
          userAgent: navigator.userAgent,
        });
      }
      
      throw detailedError;
    }
    
    // 다른 에러는 그대로 throw
    throw error;
  }
}

export async function getLatestExecution(): Promise<LatestExecutionResponse> {
  return fetchAPI<LatestExecutionResponse>("/api/status/LATEST_EXECUTION");
}

export async function getPipelineStatus(pipelineId: string): Promise<PipelineStatus> {
  return fetchAPI<PipelineStatus>(`/api/status/${pipelineId}`);
}

