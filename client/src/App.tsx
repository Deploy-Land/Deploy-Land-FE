import { useEffect, useRef, useState } from "react";
import kaboom from "kaboom";
import "@fontsource/inter";
import { Button } from "@/components/ui/button";
import { useAudio } from "./lib/stores/useAudio";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const [isGameReady, setIsGameReady] = useState(false);
  const { playHit, playSuccess, setHitSound, setSuccessSound } = useAudio();

  useEffect(() => {
    if (initializedRef.current) return;
    
    if (!containerRef.current) {
      console.error("Container ref is null, retrying...");
      return;
    }
    
    initializedRef.current = true;
    console.log("Initializing Kaboom...");

    const k = kaboom({
      width: window.innerWidth,
      height: window.innerHeight,
      background: [135, 206, 235],
      debug: true,
      global: false,
    });

    containerRef.current.appendChild(k.canvas);
    gameRef.current = k;

    let player: any;
    let obstacles: any[] = [];
    let goal: any;
    let isMoving = false;
    let currentPath: any = null;

    k.loadSound("hit", "/sounds/hit.mp3");
    k.loadSound("success", "/sounds/success.mp3");

    const hitAudio = new Audio("/sounds/hit.mp3");
    const successAudio = new Audio("/sounds/success.mp3");
    setHitSound(hitAudio);
    setSuccessSound(successAudio);

    function createGround() {
      k.add([
        k.rect(k.width(), 80),
        k.pos(0, k.height() - 80),
        k.color(139, 69, 19),
        k.area(),
        k.body({ isStatic: true }),
        "ground",
      ]);
    }

    function createPlayer() {
      player = k.add([
        k.rect(40, 40),
        k.pos(100, k.height() - 120),
        k.color(255, 0, 0),
        k.area(),
        k.body(),
        k.anchor("center"),
        "player",
        {
          speed: 200,
        },
      ]);

      player.onCollide("obstacle", (obstacle: any) => {
        if (isMoving) {
          console.log("Collision detected!");
          isMoving = false;
          playHit();
          k.play("hit");

          obstacle.shake = 1;
          const shakeInterval = k.onUpdate(() => {
            if (obstacle.shake > 0) {
              obstacle.shake -= k.dt() * 2;
              obstacle.pos.x += Math.sin(k.time() * 50) * obstacle.shake * 5;
            } else {
              shakeInterval.cancel();
            }
          });

          k.wait(0.5, () => {
            player.pos.x -= 50;
          });
        }
      });

      player.onCollide("goal", () => {
        if (isMoving) {
          console.log("Goal reached!");
          isMoving = false;
          playSuccess();
          k.play("success");

          let rotation = 0;
          const celebrateInterval = k.onUpdate(() => {
            rotation += k.dt() * 10;
            player.angle = Math.sin(rotation) * 20;
            player.scale = k.vec2(1 + Math.sin(rotation * 2) * 0.2);

            if (rotation > Math.PI * 4) {
              celebrateInterval.cancel();
              player.angle = 0;
              player.scale = k.vec2(1);
            }
          });
        }
      });
    }

    function createGoal() {
      goal = k.add([
        k.rect(50, 50),
        k.pos(k.width() - 150, k.height() - 130),
        k.color(0, 255, 0),
        k.area(),
        k.anchor("center"),
        "goal",
        {
          pulse: 0,
        },
      ]);

      goal.onUpdate(() => {
        goal.pulse += k.dt() * 4;
        goal.scale = k.vec2(1 + Math.sin(goal.pulse) * 0.1);
      });
    }

    function createObstacle(x: number) {
      const obstacle = k.add([
        k.rect(40, 60),
        k.pos(x, k.height() - 140),
        k.color(128, 128, 128),
        k.area(),
        k.anchor("center"),
        "obstacle",
        {
          shake: 0,
        },
      ]);
      obstacles.push(obstacle);
      return obstacle;
    }

    async function movePlayerToPosition(targetX: number) {
      return new Promise<void>((resolve) => {
        isMoving = true;
        const startX = player.pos.x;
        const distance = targetX - startX;
        const duration = Math.abs(distance) / player.speed;
        let elapsed = 0;

        const moveInterval = k.onUpdate(() => {
          if (!isMoving) {
            moveInterval.cancel();
            resolve();
            return;
          }

          elapsed += k.dt();
          const progress = Math.min(elapsed / duration, 1);
          player.pos.x = startX + distance * progress;

          if (progress >= 1) {
            isMoving = false;
            moveInterval.cancel();
            resolve();
          }
        });
      });
    }

    createGround();
    createPlayer();
    createGoal();
    createObstacle(300);
    createObstacle(500);

    (window as any).startMovement = async () => {
      if (isMoving) {
        console.log("Already moving!");
        return;
      }

      try {
        const response = await fetch("/api/movement-path");
        const data = await response.json();
        currentPath = data;

        console.log("Movement path received:", data);

        obstacles.forEach((obs) => obs.destroy());
        obstacles = [];

        if (data.hasObstacle) {
          const obstacleX = player.pos.x + data.distance / 2;
          createObstacle(obstacleX);
        }

        const targetX = player.pos.x + data.distance;
        await movePlayerToPosition(targetX);
      } catch (error) {
        console.error("Failed to fetch movement path:", error);
      }
    };

    (window as any).resetGame = () => {
      player.pos.x = 100;
      player.angle = 0;
      player.scale = k.vec2(1);
      obstacles.forEach((obs) => obs.destroy());
      obstacles = [];
      createObstacle(300);
      createObstacle(500);
      isMoving = false;
    };

    setIsGameReady(true);

    return () => {
      if (gameRef.current) {
        gameRef.current = null;
      }
    };
  }, []);

  const handleStartMovement = () => {
    (window as any).startMovement?.();
  };

  const handleReset = () => {
    (window as any).resetGame?.();
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div ref={containerRef} style={{ display: "block", width: "100%", height: "100%" }} />
      
      {isGameReady && (
        <div style={{
          position: "absolute",
          top: 20,
          left: 20,
          display: "flex",
          gap: "10px",
          zIndex: 1000,
        }}>
          <Button
            onClick={handleStartMovement}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "12px 24px",
              fontSize: "16px",
            }}
          >
            API로 이동 시작
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              color: "black",
              padding: "12px 24px",
              fontSize: "16px",
            }}
          >
            리셋
          </Button>
        </div>
      )}

      <div style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "15px",
        borderRadius: "8px",
        fontFamily: "Inter, sans-serif",
        fontSize: "14px",
        zIndex: 1000,
      }}>
        <div><strong>조작 방법:</strong></div>
        <div>• "API로 이동 시작" 버튼을 클릭하면 API가 호출됩니다</div>
        <div>• 캐릭터(빨간 박스)가 자동으로 이동합니다</div>
        <div>• 장애물(회색 박스)과 충돌하면 충돌 애니메이션이 재생됩니다</div>
        <div>• 목표(초록 박스)에 도달하면 성공 애니메이션이 재생됩니다</div>
      </div>
    </div>
  );
}

export default App;
