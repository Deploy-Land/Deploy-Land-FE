import "@fontsource/inter";
import { useEffect, useRef, useState } from "react";
import { ParallaxBackground } from "../components/ParallaxBackground";
import { GameControls } from "../components/GameControls";
import { ApiResultModal } from "../components/ApiResultModal";
import { SuccessImage } from "../components/SuccessImage";
import { AudioControls } from "../components/AudioControls";
import { useGameManager } from "../hooks/useGameManager";
import { usePipelineStatus } from "../hooks/usePipelineStatus";
import { useAudio } from "../lib/stores/useAudio";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export function Game() {
  const { containerRef, isGameReady, handleStartMovement, handleReset, handleStageTest, gameCoreRef } = useGameManager();
  const { pipelineStatus, pipelineId, fetchNewPipelineId } = usePipelineStatus();
  const { setBackgroundMusic, startBackgroundMusic, stopBackgroundMusic } = useAudio();
  const [modalOpen, setModalOpen] = useState(false);
  const [showSuccessImage, setShowSuccessImage] = useState(false);
  const failureHandledRef = useRef<string | null>(null);
  const fetchingNewIdRef = useRef(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // 배경음악 초기화
  useEffect(() => {
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.preload = "auto";
    bgMusicRef.current = bgMusic;
    setBackgroundMusic(bgMusic);

    // 페이지를 떠날 때 배경음악 정리
    return () => {
      console.log("게임 페이지를 떠남 - 배경음악 정리");
      stopBackgroundMusic();
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.src = "";
        bgMusicRef.current = null;
      }
    };
  }, [setBackgroundMusic, stopBackgroundMusic]);

  // 파이프라인 상태 변경 감지 및 처리 (실패/성공 시 새로운 pipelineId 가져오기)
  useEffect(() => {
    if (!pipelineStatus || !isGameReady || !gameCoreRef.current) return;

    const status = pipelineStatus.status?.toUpperCase() || "";
    const currentPipelineId = pipelineStatus.pipelineId || pipelineStatus.pipelineID || pipelineId;
    
    // 실패 처리: FAILED 상태 감지
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
    
    // 성공 처리: SUCCESS 상태 감지 시 맵 끝까지 이동 후 성공 이미지 표시
    if (
      (status === "SUCCESS" || status === "SUCCEEDED") &&
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
                });
            }, 3000); // 성공 이미지를 보여준 후 3초 대기
          }
        })
        .catch((error) => {
          console.error("성공 애니메이션 실행 오류:", error);
          // 오류 발생 시에도 성공 이미지는 표시
          setShowSuccessImage(true);
          
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
                });
            }, 3000);
          }
        });
    }
  }, [pipelineStatus, isGameReady, gameCoreRef, pipelineId, fetchNewPipelineId]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", backgroundColor: "#0c0c10" }}>
      <ParallaxBackground />
      
      {/* Audio Controls */}
      <AudioControls />
      
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
      
      {isGameReady && (
        <GameControls 
          onStartMovement={handleStartMovement} 
          onReset={handleReset} 
          onStageTest={handleStageTest}
        />
      )}
      
      {/* API 결과 모달 - 실패 시 자동 오픈 */}
      <ApiResultModal 
        open={modalOpen}
        onOpenChange={setModalOpen}
        showTrigger={false}
      />
      
      {/* 성공 이미지 - 성공 시 화면 중앙에 표시 */}
      <SuccessImage 
        show={showSuccessImage}
        onClose={() => setShowSuccessImage(false)}
      />
    </div>
  );
}

