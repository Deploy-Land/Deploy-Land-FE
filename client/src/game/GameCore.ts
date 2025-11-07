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
}