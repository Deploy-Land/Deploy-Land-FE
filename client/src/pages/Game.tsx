import "@fontsource/inter";
import { useEffect, useRef, useState } from "react";
import { ParallaxBackground } from "../components/ParallaxBackground";
import { ApiResultModal } from "../components/ApiResultModal";
import { SuccessImage } from "../components/SuccessImage";
import { ValidationModal } from "../components/ValidationModal";
import { PipelineProgressBar } from "../components/PipelineProgressBar";
import { useGameManager } from "../hooks/useGameManager";
import { usePipelineStatus } from "../hooks/usePipelineStatus";
import { useAudio } from "../lib/stores/useAudio";
import { usePipelineStore, useDeployStage } from "../store/pipelineStore";
import { clearStoredPipelineId } from "../lib/storage";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import bgMusic from "../../public/sounds/background.mp3";

export function Game() {
  const { containerRef, isGameReady, gameCoreRef } = useGameManager();
  const deployStage = useDeployStage();
  const [modalOpen, setModalOpen] = useState(false);
  const [showSuccessImage, setShowSuccessImage] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isValidationComplete, setIsValidationComplete] = useState(false);
  
  // Validation 모달이 열리거나 Validation이 완료되면 polling 완전히 중지
  const { pipelineStatus, pipelineId, fetchNewPipelineId, isLoading, error } = usePipelineStatus(showValidationModal || isValidationComplete);
  const { setHitSound, setSuccessSound } = useAudio();
  const resetPipelineStore = usePipelineStore((state) => state.reset);
  const failureHandledRef = useRef<string | null>(null);
  const validationHandledRef = useRef<string | null>(null);
  const fetchingNewIdRef = useRef(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  
  // Zustand store 3분마다 초기화 (localStorage 포함)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Zustand store 초기화 (3분 주기)");
      // localStorage의 pipelineId도 초기화
      clearStoredPipelineId();
      // Zustand store 초기화
      resetPipelineStore();
      // 새로운 pipelineId 가져오기 (자동으로 LATEST_EXECUTION 호출됨)
      fetchNewPipelineId().catch((error) => {
        console.error("새로운 pipelineId 가져오기 실패:", error);
      });
    }, 3 * 60 * 1000); // 3분 = 180,000ms

    return () => {
      clearInterval(interval);
    };
  }, [resetPipelineStore, fetchNewPipelineId]);

  // 배경음악 초기화 (Game 페이지에서만, UI 없이 백그라운드에서만 재생)
  useEffect(() => {
    const track2 = new Audio();
    track2.src = bgMusic;
    track2.controls = true; // 기본 HTML5 컨트롤 UI 비활성화
    track2.loop = true;
    track2.preload = "auto";
    track2.currentTime = 10; // 10초부터 시작
    track2.volume = 0.5; // 기본 볼륨 50%
    
    // Audio 요소를 DOM에 추가하지 않음 (메모리에만 존재, 화면에 표시되지 않음)
    bgMusicRef.current = track2;

    // 사용자 인터랙션 후 자동 재생 시작 (게임 시작 시)
    const handleUserInteraction = () => {
      if (track2.paused) {
        track2.play().catch((error) => {
          console.log("Background music play prevented:", error);
        });
      }
    };

    // 사용자 인터랙션 이벤트 리스너 추가
    window.addEventListener("click", handleUserInteraction, { once: true });
    window.addEventListener("keydown", handleUserInteraction, { once: true });

    // 페이지를 떠날 때 배경음악 정리
    return () => {
      console.log("게임 페이지를 떠남 - 배경음악 정리");
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.src = "";
        bgMusicRef.current = null;
      }
    };
  }, []);

  // 사운드 효과 초기화
  useEffect(() => {
    const hitAudio = new Audio("/sounds/hit.mp3");
    const successAudio = new Audio("/sounds/success.mp3");
    setHitSound(hitAudio);
    setSuccessSound(successAudio);
  }, [setHitSound, setSuccessSound]);

  // 파이프라인 상태 변경 감지 및 처리
  useEffect(() => {
    if (!pipelineStatus || !isGameReady || !gameCoreRef.current) return;

    const status = pipelineStatus.status?.toUpperCase() || "";
    const currentPipelineId = pipelineStatus.pipelineId || pipelineStatus.pipelineID || pipelineId;
    
    // STARTED: 맵이 시작됨
    if (status === "STARTED" && currentPipelineId) {
      console.log("Pipeline 시작 감지:", currentPipelineId, status);
      // STARTED 상태는 게임이 이미 진행 중이므로 특별한 처리 없음
      // 플레이어가 계속 이동하면 됨
    }
    
    // FAILED 또는 FAILURE: 맵이 실패함 - "진짜" 헤드라인과 함께
    // API에서 "FAILED", "FAILURE", "failed" 등 다양한 형태로 올 수 있음
    if (
      (status === "FAILED" || status === "FAILURE") &&
      currentPipelineId &&
      failureHandledRef.current !== currentPipelineId
    ) {
      console.log("Pipeline 실패 감지:", currentPipelineId, status);
      
      // 실패 처리 시작 (중복 처리 방지)
      failureHandledRef.current = currentPipelineId;
      
      // 플레이어가 장애물에 부딪치는 애니메이션 실행
      gameCoreRef.current
        .triggerFailureWithObstacle(async () => {
          // 충돌 애니메이션 완료 후 모달 오픈
          console.log("충돌 애니메이션 완료 - 모달 오픈");
          setModalOpen(true);
          
          // 실패 후 새로운 pipelineId 가져오기 (중복 호출 방지)
          if (!fetchingNewIdRef.current) {
            fetchingNewIdRef.current = true;
            try {
              console.log("실패 후 새로운 pipelineId 가져오기 위해 LATEST_EXECUTION 호출");
              await fetchNewPipelineId();
              console.log("새로운 pipelineId 가져오기 완료");
            } catch (error) {
              console.error("새로운 pipelineId 가져오기 실패:", error);
            } finally {
              fetchingNewIdRef.current = false;
            }
          }
        })
        .catch((error) => {
          console.error("실패 애니메이션 실행 오류:", error);
          // 오류 발생 시에도 모달은 오픈
          setModalOpen(true);
          
          // 실패 후 새로운 pipelineId 가져오기 시도 (중복 호출 방지)
          if (!fetchingNewIdRef.current) {
            fetchingNewIdRef.current = true;
            fetchNewPipelineId()
              .catch((err) => {
                console.error("새로운 pipelineId 가져오기 실패:", err);
              })
              .finally(() => {
                fetchingNewIdRef.current = false;
              });
          }
        });
    }
    
    // SUCCEEDED 또는 SUCCESS: 맵이 성공함
    // API에서 "SUCCEEDED", "SUCCESS", "success" 등 다양한 형태로 올 수 있음
    if (
      (status === "SUCCEEDED" || status === "SUCCESS") &&
      currentPipelineId &&
      failureHandledRef.current !== currentPipelineId
    ) {
      console.log("Pipeline 성공 감지:", currentPipelineId, status);
      
      // 성공 처리 시작 (중복 처리 방지)
      failureHandledRef.current = currentPipelineId;
      
      // 플레이어를 맵 끝까지 이동시키고 성공 애니메이션 실행
      gameCoreRef.current
        .triggerSuccessWithGoalMove(async () => {
          // 이동 및 애니메이션 완료 후 성공 이미지 표시
          console.log("성공 이미지 표시");
          setShowSuccessImage(true);
          
          // Deploy 단계가 완료되면 Validation 모달 표시
          if (deployStage.status === "SUCCEEDED" && validationHandledRef.current !== currentPipelineId) {
            console.log("Deploy 단계 완료 - Validation 모달 표시");
            validationHandledRef.current = currentPipelineId;
            // 성공 이미지를 잠시 보여준 후 Validation 모달 표시 (약 2초 후)
            setTimeout(() => {
              setShowValidationModal(true);
            }, 2000);
          }
          
          // 성공 이미지 표시 후 새로운 pipelineId 가져오기 (중복 호출 방지)
          if (!fetchingNewIdRef.current) {
            fetchingNewIdRef.current = true;
            // 성공 이미지를 보여준 후 새로운 pipelineId 가져오기 (약 3초 후)
            setTimeout(() => {
              fetchNewPipelineId()
                .then(() => {
                  console.log("성공 후 새로운 pipelineId 가져오기 완료");
                })
                .catch((error) => {
                  console.error("새로운 pipelineId 가져오기 실패:", error);
                })
                .finally(() => {
                  fetchingNewIdRef.current = false;
                  // 성공 후 실패 처리 상태 초기화 (다음 실패 감지를 위해)
                  failureHandledRef.current = null;
                  validationHandledRef.current = null;
                });
            }, 3000); // 성공 이미지를 보여준 후 3초 대기
          }
        })
        .catch((error) => {
          console.error("성공 애니메이션 실행 오류:", error);
          // 오류 발생 시에도 성공 이미지는 표시
          setShowSuccessImage(true);
          
          // Deploy 단계가 완료되면 Validation 모달 표시
          if (deployStage.status === "SUCCEEDED" && validationHandledRef.current !== currentPipelineId) {
            console.log("Deploy 단계 완료 - Validation 모달 표시 (에러 케이스)");
            validationHandledRef.current = currentPipelineId;
            setTimeout(() => {
              setShowValidationModal(true);
            }, 2000);
          }
          
          // 성공 후 새로운 pipelineId 가져오기 시도 (중복 호출 방지)
          if (!fetchingNewIdRef.current) {
            fetchingNewIdRef.current = true;
            setTimeout(() => {
              fetchNewPipelineId()
                .catch((err) => {
                  console.error("새로운 pipelineId 가져오기 실패:", err);
                })
                .finally(() => {
                  fetchingNewIdRef.current = false;
                  failureHandledRef.current = null;
                  validationHandledRef.current = null;
                });
            }, 3000);
          }
        });
    }
    
    // Deploy 단계가 SUCCEEDED일 때 Validation 모달 표시 (Validation 단계로 넘어감)
    if (
      deployStage.status === "SUCCEEDED" &&
      currentPipelineId &&
      validationHandledRef.current !== currentPipelineId
    ) {
      console.log("✅ Deploy 단계 완료 - Validation 단계로 넘어감");
      validationHandledRef.current = currentPipelineId;
      // 약간의 딜레이 후 Validation 모달 표시 (Validation 단계 시작)
      setTimeout(() => {
        console.log("🚀 Validation 모달 오픈 - 100% 달성 표시");
        setShowValidationModal(true);
      }, 1500);
    }
    
    // CANCELED: 파이프라인 취소됨
    if (
      status === "CANCELED" &&
      currentPipelineId &&
      failureHandledRef.current !== currentPipelineId
    ) {
      console.log("Pipeline 취소 감지:", currentPipelineId, status);
      
      // 취소 처리 (중복 처리 방지)
      failureHandledRef.current = currentPipelineId;
      
      // 취소 시 새로운 pipelineId 가져오기
      if (!fetchingNewIdRef.current) {
        fetchingNewIdRef.current = true;
        fetchNewPipelineId()
          .then(() => {
            console.log("취소 후 새로운 pipelineId 가져오기 완료");
          })
          .catch((error) => {
            console.error("새로운 pipelineId 가져오기 실패:", error);
          })
          .finally(() => {
            fetchingNewIdRef.current = false;
            failureHandledRef.current = null;
          });
      }
    }
  }, [pipelineStatus, isGameReady, gameCoreRef, pipelineId, fetchNewPipelineId]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", backgroundColor: "#0c0c10" }}>
      <ParallaxBackground />
      
      {/* Back to Landing Button */}
      <div style={{
        position: "absolute",
        top: 20,
        right: 20,
        zIndex: 1000,
      }}>
        <Link to="/">
          <Button 
            variant="outline"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "white",
              padding: "8px 16px",
              fontSize: "14px",
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            ← 홈으로
          </Button>
        </Link>
      </div>
      
      <div
        ref={containerRef}
        style={{ 
          display: "block", 
          width: "100%", 
          height: "100%", 
          position: "relative", 
          zIndex: 1, 
          opacity: 1 
        }}
      />
      
      {/* API 결과 모달 - 실패 시 자동 오픈 */}
      <ApiResultModal 
        open={modalOpen}
        onOpenChange={setModalOpen}
        showTrigger={false}
        pipelineStatus={pipelineStatus}
        pipelineId={pipelineId}
        isLoading={isLoading}
        error={error}
      />
      
      {/* 성공 이미지 - 성공 시 화면 중앙에 표시 */}
      <SuccessImage 
        show={showSuccessImage}
        onClose={() => setShowSuccessImage(false)}
      />
      
      {/* 벨리데이션 모달 - Deploy 완료 후 Beanstalk URL 표시 */}
      <ValidationModal
        open={showValidationModal}
        onOpenChange={(open) => {
          setShowValidationModal(open);
          // 모달이 닫히면 Validation 완료 상태 유지 (100% 달성 상태 유지)
          if (!open && isValidationComplete) {
            // 모달이 닫혀도 Validation 완료 상태는 유지
          }
        }}
        onValidationComplete={(beanstalkUrl) => {
          if (beanstalkUrl) {
            console.log("✅ 벨리데이션 완료 - Beanstalk URL:", beanstalkUrl);
            // Validation이 성공하면 100% 달성 상태로 설정하고 통신 완전히 중지
            setIsValidationComplete(true);
            console.log("🛑 Validation 완료 - 모든 통신(polling) 중지");
          } else {
            console.log("⚠️ 벨리데이션 실패 또는 URL 없음");
          }
        }}
      />
      
      {/* 파이프라인 진행률 프로그래스 바 */}
      <PipelineProgressBar isValidationComplete={isValidationComplete || showValidationModal} />
    </div>
  );
}

