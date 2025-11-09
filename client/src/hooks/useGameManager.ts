import { useEffect, useRef, useState } from "react";
import { GameCore } from "../game/GameCore";

export function useGameManager() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameCore | null>(null);
  const initializedRef = useRef(false);
  const [isGameReady, setIsGameReady] = useState(false);

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

  return {
    containerRef,
    isGameReady,
    gameCoreRef: gameRef,
  };
}