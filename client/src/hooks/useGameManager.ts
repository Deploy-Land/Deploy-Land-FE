import { useEffect, useRef, useState } from "react";
import { GameCore } from "../game/GameCore";
import { useAudio } from "../lib/stores/useAudio";

export function useGameManager() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameCore | null>(null);
  const initializedRef = useRef(false);
  const [isGameReady, setIsGameReady] = useState(false);
  const { setHitSound, setSuccessSound } = useAudio();

  useEffect(() => {
    const initializeGame = () => {
      if (initializedRef.current || !containerRef.current) {
        return;
      }
      
      initializedRef.current = true;
      console.log("Initializing Game Core...");

      try {
        const game = new GameCore({
          width: window.innerWidth,
          height: window.innerHeight,
          debug: true,
        });

        game.attachCanvas(containerRef.current);
        gameRef.current = game;

        // 오디오 설정
        const hitAudio = new Audio("/sounds/hit.mp3");
        const successAudio = new Audio("/sounds/success.mp3");
        setHitSound(hitAudio);
        setSuccessSound(successAudio);

        // 게임 초기화
        game.initialize();
        setIsGameReady(true);
        
        console.log("Game initialized successfully");
      } catch (error) {
        console.error("Failed to initialize game:", error);
        initializedRef.current = false;
      }
    };

    // 컨테이너가 준비될 때까지 기다림
    if (containerRef.current) {
      initializeGame();
    } else {
      // DOM이 준비될 때까지 약간 기다림
      const timer = setTimeout(initializeGame, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current = null;
      }
    };
  }, []);

  const handleStartMovement = async () => {
    if (gameRef.current) {
      await gameRef.current.startMovement();
    }
  };

  const handleReset = () => {
    if (gameRef.current) {
      gameRef.current.resetGame();
    }
  };

  const handleStageTest = async (stage: "Build" | "Test" | "Deploy", success: boolean) => {
    if (gameRef.current) {
      await gameRef.current.testStage(stage, success);
    }
  };

  return {
    containerRef,
    isGameReady,
    handleStartMovement,
    handleReset,
    handleStageTest,
    gameCoreRef: gameRef,
  };
}