const PIPELINE_ID_KEY = "deploy-land-latest-pipeline-id";

/**
 * localStorage에서 저장된 pipelineId를 가져옵니다.
 */
export function getStoredPipelineId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PIPELINE_ID_KEY);
  } catch (error) {
    console.error("Pipeline ID 읽기 실패:", error);
    return null;
  }
}

/**
 * pipelineId를 localStorage에 저장합니다.
 */
export function storePipelineId(pipelineId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PIPELINE_ID_KEY, pipelineId);
    if (import.meta.env.DEV) {
      console.log(`Pipeline ID 저장: ${pipelineId}`);
    }
  } catch (error) {
    console.error("Pipeline ID 저장 실패:", error);
  }
}

/**
 * 저장된 pipelineId를 삭제합니다.
 */
export function clearStoredPipelineId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PIPELINE_ID_KEY);
  } catch (error) {
    console.error("Pipeline ID 삭제 실패:", error);
  }
}

