import kaplay from "kaplay";
import { loadCoreAssets, loadParallaxSprites } from "./assets";
import { Player } from "./entities/Player";
import { ObstacleManager } from "./entities/Obstacle";
import { Goal } from "./entities/Goal";
import { MapSystem } from "./systems/MapSystem";
import { ParallaxSystem } from "./systems/ParallaxSystem";
import { getMockMovementPath } from "../mock/movement-paths";
import type { MovementPath } from "../types/movement";

export interface GameCoreConfig {
  width: number;
  height: number;
  debug?: boolean;
}

type KaplayInstance = ReturnType<typeof kaplay>;

export class GameCore {
  private k: KaplayInstance;
  private player: Player;
  private obstacleManager: ObstacleManager;
  private goal: Goal;
  private mapSystem: MapSystem;
  private parallaxSystem: ParallaxSystem;
  
  public currentPath: MovementPath | null = null;

  constructor(config: GameCoreConfig) {
    console.log("Creating Kaplay instance with config:", config);
    
    this.k = kaplay({
      width: config.width,
      height: config.height,
      background: [0, 0, 0, 0],
      debug: config.debug || false,
      global: false,
      canvas: undefined, // Let kaplay create its own canvas
    });

    console.log("Kaplay instance created, canvas:", this.k.canvas);

    this.player = new Player(this.k);
    this.obstacleManager = new ObstacleManager(this.k);
    this.goal = new Goal(this.k);
    this.mapSystem = new MapSystem(this.k);
    this.parallaxSystem = new ParallaxSystem(this.k);

    this.loadAssets();
    this.setupGameWorld();
  }

  private loadAssets() {
    try {
      loadCoreAssets(this.k);
      loadParallaxSprites(this.k);
      console.log("Assets loading started");
    } catch (error) {
      console.warn("Asset loading error (will use fallbacks):", error);
    }
  }

  private setupGameWorld() {
    this.k.onLoad(() => {
      console.log("[BG] assets loaded, setting up parallax background");
      
      try {
        this.parallaxSystem.createCanvasBackground();
      } catch (error) {
        console.log("Parallax background creation failed:", error);
      }
    });
  }

  initialize() {
    this.mapSystem.createGround();
    
    this.player.create({
      x: 100,
      y: this.k.height() - 120,
      speed: 200,
    });

    this.goal.create({
      x: this.k.width() - 150,
      y: this.k.height() - 130,
    });

    this.obstacleManager.create(300, this.k.height() - 140);
    this.obstacleManager.create(500, this.k.height() - 140);
  }

  async startMovement(): Promise<void> {
    if (this.player.moving) {
      console.log("Already moving!");
      return;
    }

    try {
      const data = await getMockMovementPath();
      this.currentPath = data;

      console.log("Movement path received:", data);

      this.obstacleManager.destroyAll();

      if (data.hasObstacle) {
        const obstacleX = this.player.position.x + data.distance / 2;
        this.obstacleManager.create(obstacleX, this.k.height() - 140);
      }

      const targetX = this.player.position.x + data.distance;
      await this.player.moveToPosition(targetX);
    } catch (error) {
      console.error("Failed to load mock movement path:", error);
    }
  }

  resetGame() {
    this.player.reset(100, this.k.height() - 120);
    this.obstacleManager.destroyAll();
    this.obstacleManager.create(300, this.k.height() - 140);
    this.obstacleManager.create(500, this.k.height() - 140);
  }

  // 각 단계별 성공/실패 테스트 메서드
  async testStage(stage: "Build" | "Test" | "Deploy", success: boolean) {
    if (this.player.moving) {
      console.log("Already moving!");
      return;
    }

    // 각 구역의 중심 좌표 계산
    const zoneCenters = {
      Build: { x: this.k.width() / 4, y: this.k.height() / 4 },
      Test: { x: (this.k.width() / 2) + (this.k.width() / 4), y: this.k.height() / 4 },
      Deploy: { x: this.k.width() / 2, y: (this.k.height() / 2) + (this.k.height() / 4) },
    };

    const targetPos = zoneCenters[stage];
    
    // 플레이어 이동
    await this.player.moveToPosition(targetPos.x);

    // 성공/실패 처리
    if (success) {
      // 성공 애니메이션
      this.player.triggerSuccess();
      console.log(`${stage} stage succeeded!`);
    } else {
      // 실패 애니메이션
      this.player.triggerFailure();
      console.log(`${stage} stage failed!`);
    }
  }

  attachCanvas(container: HTMLElement) {
    console.log("Attaching canvas to container:", container, "Canvas:", this.k.canvas);
    
    if (!this.k.canvas) {
      console.error("No canvas available from Kaplay!");
      return;
    }
    
    // Clear any existing children
    container.innerHTML = '';
    
    // Append the canvas
    container.appendChild(this.k.canvas);
    
    // Style the canvas
    const canvas = this.k.canvas as HTMLCanvasElement;
    canvas.style.background = "transparent";
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    
    console.log("Canvas attached and styled");
  }

  get canvas() {
    return this.k.canvas;
  }

  /**
   * 플레이어 실패 애니메이션 트리거
   */
  triggerPlayerFailure() {
    if (this.player) {
      this.player.triggerFailure();
    }
  }

  /**
   * 플레이어 성공 애니메이션 트리거
   */
  triggerPlayerSuccess() {
    if (this.player) {
      this.player.triggerSuccess();
    }
  }

  /**
   * 플레이어를 맵 오른쪽 끝까지 이동시키고 성공 애니메이션 실행
   * @param onComplete 이동 및 애니메이션 완료 후 실행할 콜백
   */
  async triggerSuccessWithGoalMove(onComplete?: () => void): Promise<void> {
    if (!this.player) {
      onComplete?.();
      return;
    }

    try {
      // 성공 시 모든 장애물 제거
      this.obstacleManager.destroyAll();
      console.log("성공 시 장애물 제거 완료");

      // 맵의 오른쪽 끝까지 이동
      const targetX = this.k.width() + 1000;
      
      // 플레이어를 오른쪽 끝까지 이동하고 완료될 때까지 기다림
      console.log("플레이어를 오른쪽 끝으로 이동:", targetX);
      await this.player.moveToPosition(targetX);

      // 이동 완료 확인: 플레이어가 완전히 멈췄는지 확인
      let waitCount = 0;
      while (this.player.moving && waitCount < 20) {
        await new Promise<void>((resolve) => {
          this.k.wait(0.1, () => {
            resolve();
          });
        });
        waitCount++;
      }

      // 만약 아직 이동 중이면 강제로 중지
      if (this.player.moving) {
        console.warn("플레이어 이동 강제 중지");
        this.player.stopMoving();
        // 강제 중지 후 추가 대기
        await new Promise<void>((resolve) => {
          this.k.wait(0.3, () => {
            resolve();
          });
        });
      }

      console.log("플레이어 이동 완료 - 성공 애니메이션 시작");

      // 이동이 완전히 끝난 후 성공 애니메이션 실행
      this.player.triggerSuccess();

      // 스케일 애니메이션 완료까지 대기 (0.45초) + 뼈다귀 사라지는 시간 (0.5초) + 여유 시간
      await new Promise<void>((resolve) => {
        this.k.wait(1.5, () => {
          resolve();
        });
      });

      // 성공 애니메이션 완료 후 플레이어를 화면 밖으로 이동
      console.log("성공 애니메이션 완료 - 플레이어를 화면 밖으로 이동");
      const currentPlayerX = this.player.position.x;
      const exitX = currentPlayerX + 800; // 현재 위치에서 더 오른쪽으로 이동 (화면 밖으로)
      
      // 플레이어를 화면 밖으로 이동
      this.player.moveToPosition(exitX).catch((error) => {
        console.warn("플레이어 화면 밖 이동 중 오류:", error);
      });

      // 플레이어가 화면 밖으로 나가는 것을 보여주기 위해 짧은 대기 (이동 시작만 확인)
      await new Promise<void>((resolve) => {
        this.k.wait(0.8, () => {
          resolve();
        });
      });

      console.log("성공 애니메이션 및 화면 밖 이동 완료 - 콜백 실행");
      onComplete?.();
    } catch (error) {
      console.error("성공 애니메이션 실행 오류:", error);
      // 오류 발생 시 플레이어 이동 중지
      if (this.player) {
        this.player.stopMoving();
        this.player.triggerSuccess();
      }
      onComplete?.();
    }
  }

  get goalPosition() {
    return this.goal?.position || { x: this.k.width() - 150, y: this.k.height() - 130 };
  }

  /**
   * 플레이어가 장애물에 부딪치며 실패하는 애니메이션
   * @param onComplete 충돌 완료 후 실행할 콜백
   */
  async triggerFailureWithObstacle(onComplete?: () => void): Promise<void> {
    if (!this.player) {
      onComplete?.();
      return;
    }

    const playerPos = this.player.position;
    const obstacleDistance = 200; // 플레이어 앞 200px에 장애물 배치
    const obstacleX = playerPos.x + obstacleDistance;
    const obstacleY = this.k.height() - 140;

    // 기존 장애물 제거
    this.obstacleManager.destroyAll();

    // 플레이어 앞에 장애물 생성
    this.obstacleManager.create(obstacleX, obstacleY);

    // 플레이어를 장애물 방향으로 이동
    // Player의 onCollide가 자동으로 충돌을 감지하고 처리함 (충돌 사운드, 장애물 흔들림, 플레이어 뒤로 밀림)
    const targetX = playerPos.x + obstacleDistance + 30; // 장애물을 통과하려고 시도 (충돌 발생)
    
    // 플레이어 이동 시작 (충돌 시 자동으로 멈춤)
    this.player.moveToPosition(targetX).catch((error) => {
      console.warn("플레이어 이동 중 오류:", error);
    });

    // 충돌 애니메이션 완료까지 대기
    // 이동 시간 (약 1초) + 충돌 애니메이션 (0.5초) + 뒤로 밀림 (0.5초) + 실패 애니메이션 (1초) = 약 3초
    await new Promise<void>((resolve) => {
      this.k.wait(3.0, () => {
        resolve();
      });
    });

    // 콜백 실행 (모달 오픈)
    onComplete?.();
  }
}