import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";
import { getLatestExecution, getPipelineStatus, pollMeta } from "@/lib/api/cicd";
import { usePipelineStore } from "@/store/pipelineStore";
import { storePipelineId, clearStoredPipelineId } from "@/lib/storage";
import type { PipelineStatus } from "@/types/cicd";

const POLL_MIN_MS = 1000;
const POLL_MAX_MS = 10000;
const POLL_INITIAL_MS = 3000;

export function usePipelineStatus(shouldStopPolling: boolean = false) {
  const queryClient = useQueryClient();
  const isFetchingNewIdRef = useRef(false);
  const previousStatusRef = useRef<PipelineStatus | null>(null);
  const isReloadingRef = useRef(false);

  // AIMD 적응형 폴링 주기
  const pollIntervalRef = useRef(POLL_INITIAL_MS);
  const backoffCountRef = useRef(0);
  
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
    staleTime: 60 * 1000, // refetchInterval과 동일하게 설정 (1분간 캐시 사용, refetchInterval 실행 시 새로 가져옴)
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지 (구 cacheTime)
    refetchInterval: shouldStopPolling ? false : 60 * 1000, // shouldStopPolling이 true이면 polling 중지, 아니면 1분(60000ms)마다 호출
    retry: 2,
    retryDelay: 1000,
  });

  // LATEST_EXECUTION 응답에서 pipelineId 업데이트 및 동기화
  useEffect(() => {
    if (latestExecution?.latestExecutionId) {
      const newPipelineId = latestExecution.latestExecutionId;
      const currentId = pipelineId;
      
      // 새로운 pipelineId가 현재 pipelineId와 다르면 업데이트
      if (newPipelineId !== currentId) {
        console.log("LATEST_EXECUTION에서 pipelineId 업데이트:", newPipelineId);
        console.log("현재 pipelineId:", currentId);
        
        // 이전 pipelineId의 쿼리 취소 (명시적으로 취소하여 일관성 보장)
        if (currentId) {
          queryClient.cancelQueries({ 
            queryKey: ["pipelineStatus", currentId],
            exact: true 
          });
        }
        
        // 새로운 pipelineId 설정
        setPipelineId(newPipelineId);
        storePipelineId(newPipelineId);
        
        // 새로운 pipelineId로 pipelineStatus 조회하기 위해 캐시 무효화
        queryClient.invalidateQueries({ 
          queryKey: ["pipelineStatus", newPipelineId],
          exact: true 
        });
      } else if (!currentId) {
        // pipelineId가 없을 때만 초기 설정 (중복 업데이트 방지)
        setPipelineId(newPipelineId);
        storePipelineId(newPipelineId);
      }
    }
  }, [latestExecution, pipelineId, setPipelineId, queryClient]);

  // 2. 사용할 pipelineId 결정 (latestExecutionId 우선 사용하여 항상 최신 ID 사용)
  // latestExecutionId를 우선 사용하여 LATEST_EXECUTION에서 새로운 ID를 받으면 즉시 반영
  // latestExecutionId가 없을 때만 pipelineId 사용 (초기 로드 시)
  const currentPipelineId = latestExecution?.latestExecutionId || pipelineId;

  // AIMD 주기 조절: TCP 혼잡제어에서 차용
  // 200(변화 있음) → 주기 절반 (Additive Increase 방향으로 빠르게)
  // 304/204(변화 없음) → 주기 1.5배 (Multiplicative Decrease 방향으로 느리게)
  // 429/503(스로틀링) → 지수 백오프 + ±20% 지터 (CSMA/CA 충돌 회피)
  const adjustPollInterval = useCallback(() => {
    const { status, dataChanged, serverHintMs } = pollMeta;

    // 서버 힌트가 있으면 우선 적용
    if (serverHintMs) {
      pollIntervalRef.current = Math.max(POLL_MIN_MS, Math.min(serverHintMs, POLL_MAX_MS));
      backoffCountRef.current = 0;
      return;
    }

    if (status === 429 || status === 503) {
      // 지수 백오프 + ±20% 지터
      backoffCountRef.current += 1;
      const base = POLL_INITIAL_MS * Math.pow(2, backoffCountRef.current);
      const jitter = base * 0.2 * (Math.random() * 2 - 1);
      pollIntervalRef.current = Math.min(base + jitter, 30000);
    } else if (status === 304 || !dataChanged) {
      // Multiplicative Decrease: 변화 없으면 주기 늘림
      backoffCountRef.current = 0;
      pollIntervalRef.current = Math.min(pollIntervalRef.current * 1.5, POLL_MAX_MS);
    } else {
      // Additive Increase: 변화 있으면 주기 줄임
      backoffCountRef.current = 0;
      pollIntervalRef.current = Math.max(pollIntervalRef.current / 2, POLL_MIN_MS);
    }
  }, []);

  // 3. pipelineId로 실제 상태 조회 (AIMD 적응형 폴링)
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
        adjustPollInterval();
        setPipelineId(currentPipelineId);
        storePipelineId(currentPipelineId);
        return status;
      } catch (error) {
        adjustPollInterval();
        console.error("Pipeline Status 호출 실패:", error);
        if (error instanceof Error && error.message.includes("not found")) {
          if (pipelineId === currentPipelineId) {
            setPipelineId(null);
          }
        }
        throw error;
      }
    },
    enabled: !!currentPipelineId && !shouldStopPolling,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: shouldStopPolling || !currentPipelineId
      ? false
      : () => pollIntervalRef.current,
    retry: 2,
    retryDelay: 1000,
    refetchIntervalInBackground: !shouldStopPolling,
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

