import kaplay from "kaplay";

type KaboomCtx = ReturnType<typeof kaplay>;
type GameObj = ReturnType<KaboomCtx["add"]> & Record<string, any>;
type UpdateHandle = ReturnType<KaboomCtx["onUpdate"]>;

export interface PlayerConfig {
  x: number;
  y: number;
  speed?: number;
}

export class Player {
  private k: KaboomCtx;
  private gameObj: GameObj | null = null;
  private boneObj: GameObj | null = null;
  private boneFollowController: UpdateHandle | null = null;
  private scaleAnimationHandle: UpdateHandle | null = null;
  private idleAnimationHandle: UpdateHandle | null = null;
  private isMoving = false;

  constructor(k: KaboomCtx) {
    this.k = k;
  }

  create(config: PlayerConfig) {
    this.gameObj = this.k.add([
      this.k.sprite("shiba_1"),
      this.k.pos(config.x, config.y),
      this.k.area(),
      this.k.body(),
      this.k.anchor("center"),
      this.k.scale(0.3), // 크기 조정
      this.k.z(10), // 배경보다 위에 렌더링 (bg_near가 z=-10)
      "player",
      {
        speed: config.speed || 200,
        currentFrame: 1,
      },
    ]);

    this.setupCollisions();
    this.startIdleAnimation();
    return this.gameObj;
  }

  private setupCollisions() {
    if (!this.gameObj) return;

    this.gameObj.onCollide("obstacle", (obstacle: any) => {
      if (this.isMoving) {
        console.log("Collision detected!");
        this.isMoving = false;
        this.stopIdleAnimation();
        this.k.play("hit");

        obstacle.shake = 1;
        const shakeInterval = this.k.onUpdate(() => {
          if (obstacle.shake > 0) {
            obstacle.shake -= this.k.dt() * 2;
            obstacle.pos.x += Math.sin(this.k.time() * 50) * obstacle.shake * 5;
          } else {
            shakeInterval.cancel();
          }
        });

        this.k.wait(0.5, () => {
          if (this.gameObj) {
            this.gameObj.pos.x -= 50;
          }
          // 충돌 후 idle 애니메이션 재시작
          this.startIdleAnimation();
        });
      }
    });

    this.gameObj.onCollide("goal", () => {
      if (this.isMoving) {
        console.log("Goal reached!");
        this.triggerSuccess();
      }
    });
  }

  async moveToPosition(targetX: number): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.gameObj) {
        resolve();
        return;
      }

      // 움직임 시작 시 idle 애니메이션 중지
      this.stopIdleAnimation();

      this.isMoving = true;
      const startX = this.gameObj.pos.x;
      const distance = targetX - startX;
      const duration = Math.abs(distance) / this.gameObj.speed;
      let elapsed = 0;
      let animationFrame = 1;
      let animationTimer = 0;
      const animationSpeed = 0.2; // 초당 프레임 변경 속도

      const moveInterval = this.k.onUpdate(() => {
        if (!this.isMoving || !this.gameObj) {
          // 움직임이 멈추면 idle 애니메이션 시작
          moveInterval.cancel();
          this.startIdleAnimation();
          resolve();
          return;
        }

        elapsed += this.k.dt();
        animationTimer += this.k.dt();
        
        // 시바견 걷기 애니메이션 (프레임 1-3 순환)
        if (animationTimer >= animationSpeed) {
          animationTimer = 0;
          animationFrame = (animationFrame % 3) + 1;
          this.gameObj.use(this.k.sprite(`shiba_${animationFrame}`));
        }

        const progress = Math.min(elapsed / duration, 1);
        this.gameObj.pos.x = startX + distance * progress;
        
        if (progress >= 1) {
          this.isMoving = false;
          moveInterval.cancel();
          // 움직임이 끝나면 idle 애니메이션 시작
          this.startIdleAnimation();
          resolve();
        }
      });
    });
  }

  reset(x: number, y: number) {
    if (!this.gameObj) return;
    
    this.stopIdleAnimation();
    
    this.gameObj.pos.x = x;
    this.gameObj.pos.y = y;
    this.gameObj.angle = 0;
    this.gameObj.scale = this.k.vec2(0.3); // 시바견 크기 유지
    this.gameObj.use(this.k.sprite("shiba_1")); // 첫 번째 프레임으로 초기화
    
    // 뼈다귀 제거
    this.removeBone();
    if (this.scaleAnimationHandle) {
      try {
        this.scaleAnimationHandle.cancel();
      } finally {
        this.scaleAnimationHandle = null;
      }
    }
    
    this.isMoving = false;
    // 리셋 후 idle 애니메이션 시작
    this.startIdleAnimation();
  }

  get position() {
    return this.gameObj?.pos || { x: 0, y: 0 };
  }

  get moving() {
    return this.isMoving;
  }

  /**
   * 플레이어 이동을 강제로 중단
   */
  stopMoving() {
    if (this.isMoving && this.gameObj) {
      this.isMoving = false;
      this.stopIdleAnimation();
      // 이동 중지 후 idle 애니메이션 시작
      this.startIdleAnimation();
    }
  }

  // 외부에서 성공/실패 애니메이션 트리거
  triggerSuccess() {
    if (!this.gameObj) return;
    
    // 이동 중지
    this.stopMoving();
    this.stopIdleAnimation();
    
    this.k.play("success");
    this.gameObj.angle = 0;
    this.spawnTemporaryBone(40, -70, 0.5);
    this.animateScaleTo(0.9, 0.45);
    // 성공 후에도 idle 애니메이션 계속 재생
    this.startIdleAnimation();
  }

  triggerFailure() {
    if (!this.gameObj) return;
    
    this.stopIdleAnimation();
    this.isMoving = false;
    this.k.play("hit");
    
    // 실패 시 뒤로 밀림
    this.k.wait(0.5, () => {
      if (this.gameObj) {
        this.gameObj.pos.x -= 50;
      }
      // 실패 후 idle 애니메이션 재시작
      this.startIdleAnimation();
    });
  }

  private spawnTemporaryBone(offsetX: number, offsetY: number, lifetime = 0.6) {
    if (!this.gameObj) return;

    this.removeBone();

    const bone = this.k.add([
      this.k.sprite("bone"),
      this.k.pos(this.gameObj.pos.x + offsetX, this.gameObj.pos.y + offsetY),
      this.k.anchor("center"),
      this.k.z(11),
      "bone",
    ]);

    bone.width = 100;
    bone.height = 100;

    this.boneObj = bone;
    this.boneFollowController = this.k.onUpdate(() => {
      if (!this.boneObj || !this.gameObj) {
        return;
      }
      this.boneObj.pos.x = this.gameObj.pos.x + offsetX;
      this.boneObj.pos.y = this.gameObj.pos.y + offsetY;
    });

    this.k.wait(lifetime, () => {
      if (this.boneObj === bone) {
        this.removeBone();
      }
    });
  }

  private removeBone() {
    if (this.boneFollowController) {
      try {
        this.boneFollowController.cancel();
      } catch (error) {
        console.warn("Failed to cancel bone follow controller", error);
      }
      this.boneFollowController = null;
    }

    if (this.boneObj) {
      this.boneObj.destroy();
      this.boneObj = null;
    }
  }

  private animateScaleTo(targetScale: number, duration = 0.45) {
    if (!this.gameObj) return;

    if (this.scaleAnimationHandle) {
      try {
        this.scaleAnimationHandle.cancel();
      } catch (error) {
        console.warn("Failed to cancel scale animation", error);
      }
      this.scaleAnimationHandle = null;
    }

    const startScale = this.gameObj.scale?.x ?? 0.3;
    if (Math.abs(startScale - targetScale) < 0.001) {
      this.gameObj.scale = this.k.vec2(targetScale);
      return;
    }

    let elapsed = 0;
    this.scaleAnimationHandle = this.k.onUpdate(() => {
      if (!this.gameObj) {
        return;
      }

      elapsed += this.k.dt();
      const progress = Math.min(elapsed / duration, 1);
      const currentScale = startScale + (targetScale - startScale) * progress;
      this.gameObj.scale = this.k.vec2(currentScale);

      if (progress >= 1 && this.scaleAnimationHandle) {
        try {
          this.scaleAnimationHandle.cancel();
        } finally {
          this.scaleAnimationHandle = null;
        }
        this.gameObj.scale = this.k.vec2(targetScale);
      }
    });
  }

  /**
   * 제자리에서 뛰는 애니메이션 시작
   */
  private startIdleAnimation() {
    if (!this.gameObj || this.isMoving) return;
    
    // 이미 실행 중이면 중지
    this.stopIdleAnimation();

    let animationFrame = 1;
    let animationTimer = 0;
    const animationSpeed = 0.15; // 제자리 애니메이션 속도 (약간 느리게)

    this.idleAnimationHandle = this.k.onUpdate(() => {
      if (!this.gameObj || this.isMoving) {
        this.stopIdleAnimation();
        return;
      }

      animationTimer += this.k.dt();
      
      // 시바견 제자리 뛰기 애니메이션 (프레임 1-3 순환)
      if (animationTimer >= animationSpeed) {
        animationTimer = 0;
        animationFrame = (animationFrame % 3) + 1;
        this.gameObj.use(this.k.sprite(`shiba_${animationFrame}`));
      }
    });
  }

  /**
   * 제자리 애니메이션 중지
   */
  private stopIdleAnimation() {
    if (this.idleAnimationHandle) {
      try {
        this.idleAnimationHandle.cancel();
      } catch (error) {
        console.warn("Failed to cancel idle animation", error);
      }
      this.idleAnimationHandle = null;
    }
  }
}