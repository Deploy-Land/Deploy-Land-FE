import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getLatestExecution, getPipelineStatus } from "@/lib/api/cicd";
import { usePipelineStore } from "@/store/pipelineStore";
import { storePipelineId, clearStoredPipelineId } from "@/lib/storage";
import type { PipelineStatus } from "@/types/cicd";

/**
 * 파이프라인 상태를 조회하고 zustand store에 저장하는 훅
 */
export function usePipelineStatus() {
  const queryClient = useQueryClient();
  // fetchNewPipelineId 실행 중인지 추적 (중복 호출 방지)
  const isFetchingNewIdRef = useRef(false);
  
  // Zustand store에서 상태와 액션 가져오기
  const pipelineId = usePipelineStore((state) => state.pipelineId);
  const setPipelineId = usePipelineStore((state) => state.setPipelineId);
  const setPipelineStatus = usePipelineStore((state) => state.setPipelineStatus);
  const setLoading = usePipelineStore((state) => state.setLoading);
  const setError = usePipelineStore((state) => state.setError);

  // 잘못된 pipelineId 감지 및 정리 ("LATEST_EXECUTION" 문자열은 실제 ID가 아님)
  const isValidPipelineId = pipelineId && pipelineId !== "LATEST_EXECUTION";
  
  // 잘못된 pipelineId가 있으면 초기화
  useEffect(() => {
    if (pipelineId === "LATEST_EXECUTION") {
      console.warn("잘못된 pipelineId 감지: 'LATEST_EXECUTION'. 초기화합니다.");
      setPipelineId(null);
      // localStorage도 정리
      clearStoredPipelineId();
    }
  }, [pipelineId, setPipelineId]);

  // 1. 저장된 pipelineId가 없거나 유효하지 않으면 LATEST_EXECUTION을 호출해서 pipelineId 얻기
  // 주의: LATEST_EXECUTION은 폴링하지 않음 (refetchInterval 없음)
  const {
    data: latestExecution,
    isLoading: isLoadingLatest,
    error: latestError,
    refetch: refetchLatest,
  } = useQuery({
    queryKey: ["latestExecution"],
    queryFn: async () => {
      try {
        const result = await getLatestExecution();
        // latestExecutionId를 pipelineId로 사용
        if (result?.latestExecutionId) {
          console.log("LATEST_EXECUTION 응답 받음:", result);
          console.log("latestExecutionId:", result.latestExecutionId);
          setPipelineId(result.latestExecutionId);
          storePipelineId(result.latestExecutionId);
        }
        return result;
      } catch (error) {
        console.error("LATEST_EXECUTION 호출 실패:", error);
        throw error;
      }
    },
    enabled: !isValidPipelineId, // 유효한 pipelineId가 없을 때만 실행
    staleTime: Infinity, // 폴링하지 않으므로 무한대로 설정
    retry: 2,
    retryDelay: 1000,
    refetchInterval: false, // 폴링 비활성화
  });

  // 2. 사용할 pipelineId 결정 (latestExecutionId 사용)
  // 유효한 pipelineId 우선, 없으면 latestExecutionId 사용
  const currentPipelineId = isValidPipelineId ? pipelineId : latestExecution?.latestExecutionId;

  // 3. pipelineId로 실제 상태 조회
  // pipelineId가 있을 때만 폴링 시작 (2초마다)
  const {
    data: pipelineStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery<PipelineStatus>({
    queryKey: ["pipelineStatus", currentPipelineId],
    queryFn: async () => {
      if (!currentPipelineId) {
        throw new Error("Pipeline ID not found");
      }
      try {
        const status = await getPipelineStatus(currentPipelineId);
        setPipelineId(currentPipelineId);
        storePipelineId(currentPipelineId);
        return status;
      } catch (error) {
        console.error("Pipeline Status 호출 실패:", error);
        // 404 등으로 pipelineId가 유효하지 않으면 초기화
        if (error instanceof Error && error.message.includes("not found")) {
          if (pipelineId === currentPipelineId) {
            setPipelineId(null);
          }
        }
        throw error;
      }
    },
    enabled: !!currentPipelineId, // pipelineId가 있을 때만 실행
    staleTime: 0, // 항상 최신 데이터 가져오기
    refetchInterval: currentPipelineId ? 2000 : false, // pipelineId가 있을 때만 2초마다 폴링
    retry: 2,
    retryDelay: 1000,
  });

  // 파이프라인 상태를 zustand store에 동기화
  useEffect(() => {
    if (pipelineStatus) {
      setPipelineStatus(pipelineStatus);
    }
  }, [pipelineStatus, setPipelineStatus]);

  // 로딩 상태 동기화
  useEffect(() => {
    setLoading(isLoadingLatest || isLoadingStatus);
  }, [isLoadingLatest, isLoadingStatus, setLoading]);

  // 에러 상태 동기화
  useEffect(() => {
    const error = latestError || statusError;
    setError(error instanceof Error ? error : error ? new Error(String(error)) : null);
  }, [latestError, statusError, setError]);

  /**
   * 새로운 pipelineId를 가져오기 위해 LATEST_EXECUTION을 다시 호출
   */
  const fetchNewPipelineId = async () => {
    // 이미 실행 중이면 중복 호출 방지
    if (isFetchingNewIdRef.current) {
      console.log("이미 새로운 pipelineId 가져오는 중...");
      return null;
    }
    
    try {
      isFetchingNewIdRef.current = true;
      console.log("LATEST_EXECUTION 호출하여 새로운 pipelineId 가져오기");
      
      // LATEST_EXECUTION 직접 호출 (쿼리 캐시 무효화 없이)
      const result = await getLatestExecution();
      
      // latestExecutionId를 pipelineId로 사용
      if (result?.latestExecutionId) {
        console.log("새로운 pipelineId 받음:", result.latestExecutionId);
        console.log("lastStartTime:", result.lastStartTime);
        
        // 새로운 pipelineId 설정 (이전 pipelineId 덮어쓰기)
        setPipelineId(result.latestExecutionId);
        
        // localStorage도 업데이트
        storePipelineId(result.latestExecutionId);
        
        // 새로운 pipelineId로 pipelineStatus 조회하기 위해 캐시 무효화
        // (이전 pipelineId의 캐시는 무효화하되, latestExecution 쿼리는 무효화하지 않음)
        queryClient.invalidateQueries({ 
          queryKey: ["pipelineStatus"],
          exact: false 
        });
        
        return result;
      } else {
        console.warn("LATEST_EXECUTION에서 pipelineId를 받지 못함");
        return null;
      }
    } catch (error) {
      console.error("LATEST_EXECUTION 호출 실패:", error);
      throw error;
    } finally {
      isFetchingNewIdRef.current = false;
    }
  };

  return {
    pipelineStatus,
    isLoading: isLoadingLatest || isLoadingStatus,
    error: latestError || statusError,
    pipelineId: currentPipelineId,
    refetch: () => {
      if (!pipelineId) {
        refetchLatest();
      }
      if (currentPipelineId) {
        refetchStatus();
      }
    },
    fetchNewPipelineId,
  };
}

