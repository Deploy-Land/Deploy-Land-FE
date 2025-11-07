import "@fontsource/inter";
import { ParallaxBackground } from "../components/ParallaxBackground";
import { GameControls } from "../components/GameControls";
import { useGameManager } from "../hooks/useGameManager";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export function Game() {
  const { containerRef, isGameReady, handleStartMovement, handleReset, handleStageTest } = useGameManager();

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
      
      {isGameReady && (
        <GameControls 
          onStartMovement={handleStartMovement} 
          onReset={handleReset} 
          onStageTest={handleStageTest}
        />
      )}
    </div>
  );
}

