import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import "./lib/i18n";
import { queryClient } from "./lib/queryClient";
import { getStoredPipelineId, clearStoredPipelineId } from "./lib/storage";
import { usePipelineStore } from "./store/pipelineStore";

// 잘못된 pipelineId 정리 (개발/프로덕션 모두)
if (typeof window !== "undefined") {
  // 저장된 pipelineId가 "LATEST_EXECUTION"이면 초기화 (잘못된 값)
  const storedId = getStoredPipelineId();
  if (storedId === "LATEST_EXECUTION") {
    console.warn("잘못된 pipelineId 감지: 'LATEST_EXECUTION'. 초기화합니다.");
    // 잘못된 값이면 초기화 (usePipelineStatus가 자동으로 LATEST_EXECUTION을 호출하여 올바른 ID를 가져옴)
    clearStoredPipelineId();
    // Zustand store도 초기화
    usePipelineStore.getState().setPipelineId(null);
  }
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
