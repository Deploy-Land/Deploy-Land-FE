import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getLatestExecution, getPipelineStatus } from "@/lib/api/cicd";
import { usePipelineStore } from "@/store/pipelineStore";
import { storePipelineId, clearStoredPipelineId } from "@/lib/storage";
import type { PipelineStatus } from "@/types/cicd";

/**
 * 파이프라인 상태를 조회하고 zustand store에 저장하는 훅
 * @param shouldStopPolling - polling을 중지할지 여부 (예: Validation 모달이 열렸을 때, Validation 완료 후)
 */
export function usePipelineStatus(shouldStopPolling: boolean = false) {
  const queryClient = useQueryClient();
  // fetchNewPipelineId 실행 중인지 추적 (중복 호출 방지)
  const isFetchingNewIdRef = useRef(false);
  // 이전 파이프라인 상태를 저장하여 변경 감지 (컴포넌트 레벨에서 관리)
  const previousStatusRef = useRef<PipelineStatus | null>(null);
  // 새로고침 실행 여부 추적 (중복 새로고침 방지)
  const isReloadingRef = useRef(false);
  
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

  // 1. LATEST_EXECUTION 호출 (1분마다 주기적으로 호출하여 새로운 파이프라인 ID 감지)
  // 초기 로드 시 또는 주기적으로 호출하여 최신 파이프라인 ID 확인
  // 주의: shouldStopPolling이 true이면 polling 완전히 중지 (Validation 모달이 열렸거나 Validation 완료 후)
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
          return result;
        }
        return result;
      } catch (error) {
        console.error("LATEST_EXECUTION 호출 실패:", error);
        throw error;
      }
    },
    enabled: !shouldStopPolling, // shouldStopPolling이 true이면 비활성화
    staleTime: 30 * 1000, // 30초간 캐시 사용 (중복 요청 방지)
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지 (구 cacheTime)
    refetchInterval: shouldStopPolling ? false : 60 * 1000, // shouldStopPolling이 true이면 polling 중지, 아니면 1분(60000ms)마다 호출
    retry: 2,
    retryDelay: 1000,
  });

  // LATEST_EXECUTION 응답에서 pipelineId 업데이트
  useEffect(() => {
    if (latestExecution?.latestExecutionId) {
      const newPipelineId = latestExecution.latestExecutionId;
      const currentId = pipelineId;
      
      // 유효한 pipelineId가 없거나, 새로운 pipelineId가 현재 pipelineId와 다르면 업데이트
      if (!isValidPipelineId || newPipelineId !== currentId) {
        console.log("LATEST_EXECUTION에서 pipelineId 업데이트:", newPipelineId);
        console.log("현재 pipelineId:", currentId);
        
        // 새로운 pipelineId 설정
        setPipelineId(newPipelineId);
        storePipelineId(newPipelineId);
        
        // 새로운 pipelineId로 pipelineStatus 조회하기 위해 캐시 무효화
        queryClient.invalidateQueries({ 
          queryKey: ["pipelineStatus"],
          exact: false 
        });
      }
    }
  }, [latestExecution, pipelineId, isValidPipelineId, setPipelineId, queryClient]);

  // 2. 사용할 pipelineId 결정 (latestExecutionId 사용)
  // 유효한 pipelineId 우선, 없으면 latestExecutionId 사용
  const currentPipelineId = isValidPipelineId ? pipelineId : latestExecution?.latestExecutionId;

  // 3. pipelineId로 실제 상태 조회
  // pipelineId가 있을 때만 폴링 시작 (3초마다)
  // 주의: shouldStopPolling이 true이면 polling 완전히 중지 (Validation 모달이 열렸거나 Validation 완료 후)
  const {
    data: pipelineStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
    dataUpdatedAt,
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
    enabled: !!currentPipelineId && !shouldStopPolling, // pipelineId가 있고 shouldStopPolling이 false일 때만 실행
    staleTime: 2 * 1000, // 2초간 캐시 사용 (중복 요청 방지, 폴링 간격보다 짧게)
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지 (구 cacheTime)
    refetchInterval: shouldStopPolling || !currentPipelineId ? false : 3000, // shouldStopPolling이 true이면 polling 중지, 아니면 3초(3000ms)마다 폴링
    retry: 2,
    retryDelay: 1000,
    // 폴링 시 브라우저 새로고침
    refetchIntervalInBackground: !shouldStopPolling, // shouldStopPolling이 true이면 백그라운드 폴링도 중지
  });

  // 파이프라인 상태를 zustand store에 동기화
  useEffect(() => {
    if (pipelineStatus) {
      setPipelineStatus(pipelineStatus);
    }
  }, [pipelineStatus, setPipelineStatus]);

  // 폴링 시 데이터 업데이트 감지 및 새로고침 처리
  // dataUpdatedAt을 사용하여 폴링이 실제로 실행되었는지 확인
  // 주의: shouldStopPolling이 true이면 새로고침 처리도 완전히 중지 (Validation 완료 후)
  useEffect(() => {
    // shouldStopPolling이 true이면 스킵 (Validation 모달이 열렸거나 Validation 완료 후)
    if (shouldStopPolling) {
      console.log("🛑 Polling 중지됨 - 데이터 업데이트 감지 및 새로고침 처리 중지");
      return;
    }
    
    // pipelineStatus가 없거나 dataUpdatedAt이 없으면 스킵
    if (!pipelineStatus || !dataUpdatedAt) {
      return;
    }
    
    // 이전 상태와 비교하여 실제로 변경되었는지 확인
    const previousStatus = previousStatusRef.current;
    const currentStatus = (pipelineStatus.status || "").toUpperCase().trim();
    const previousStatusUpper = previousStatus ? (previousStatus.status || "").toUpperCase().trim() : "";
    const currentPipelineId = (pipelineStatus.pipelineId || pipelineStatus.pipelineID || "").trim();
    const previousPipelineId = previousStatus ? ((previousStatus.pipelineId || previousStatus.pipelineID || "")).trim() : "";
    
    // 실제로 상태가 변경되었는지 확인 (초기 로드 시에는 새로고침하지 않음)
    const isInitialLoad = !previousStatus;
    const statusChanged = !isInitialLoad && (
      previousStatusUpper !== currentStatus ||
      previousPipelineId !== currentPipelineId
    );
    
    console.log("📊 폴링 업데이트 체크:", {
      dataUpdatedAt: new Date(dataUpdatedAt).toISOString(),
      isInitialLoad,
      previous: { status: previousStatusUpper, id: previousPipelineId },
      current: { status: currentStatus, id: currentPipelineId },
      changed: statusChanged,
      isReloading: isReloadingRef.current,
    });
    
    // 상태가 변경되었고, 이미 새로고침 중이 아닐 때만 브라우저 새로고침
    if (statusChanged && !isReloadingRef.current && typeof window !== "undefined") {
      console.log("🔄 폴링 데이터 변경 감지 - 브라우저 새로고침 예정", {
        previous: previousStatusUpper,
        current: currentStatus,
        pipelineId: currentPipelineId,
        updatedAt: new Date(dataUpdatedAt).toISOString(),
      });
      
      // 새로고침 플래그 설정 (중복 실행 방지)
      isReloadingRef.current = true;
      
      // 이전 상태 업데이트 (깊은 복사로 객체 참조 문제 방지)
      previousStatusRef.current = JSON.parse(JSON.stringify(pipelineStatus));
      
      // 짧은 딜레이 후 새로고침 (상태 저장 및 로그 출력 완료 대기)
      const reloadTimeout = setTimeout(() => {
        console.log("🔄 브라우저 새로고침 실행");
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 300);
      
      // cleanup 함수에서 timeout 정리 (컴포넌트가 unmount되기 전에)
      return () => {
        clearTimeout(reloadTimeout);
      };
    } else if (!isInitialLoad) {
      // 상태가 변경되지 않았거나 초기 로드가 아닌 경우 이전 상태만 업데이트
      // 깊은 복사로 객체 참조 문제 방지
      previousStatusRef.current = JSON.parse(JSON.stringify(pipelineStatus));
    } else {
      // 초기 로드인 경우 이전 상태 저장
      previousStatusRef.current = JSON.parse(JSON.stringify(pipelineStatus));
    }
  }, [pipelineStatus, dataUpdatedAt, shouldStopPolling]);

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

