import { storePipelineId } from "./storage";
import { usePipelineStore } from "@/store/pipelineStore";

/**
 * 초기 pipelineId 설정 (개발/테스트용)
 * 브라우저 콘솔에서도 사용 가능: window.initPipelineId("pipeline-id")
 */
export function initPipelineId(pipelineId: string) {
  if (typeof window === "undefined") return;
  
  // localStorage에 저장
  storePipelineId(pipelineId);
  
  // zustand store에도 설정
  usePipelineStore.getState().setPipelineId(pipelineId);
  
  console.log(`Pipeline ID 초기화: ${pipelineId}`);
  console.log(`API 호출: /api/status/${pipelineId}`);
  
  // 페이지 리로드하여 적용
  if (import.meta.env.DEV) {
    console.log("💡 페이지를 새로고침하면 새 pipelineId로 API가 호출됩니다.");
  }
}

// 브라우저 콘솔에서 사용할 수 있도록 전역에 등록
if (typeof window !== "undefined") {
  (window as any).initPipelineId = initPipelineId;
}

