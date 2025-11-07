import kaplay, { type KaboomCtx } from "kaplay";
type GameObj = ReturnType<ReturnType<typeof kaplay>["add"]>;

export interface PlayerConfig {
  x: number;
  y: number;
  speed?: number;
}

export class Player {
  private k: KaboomCtx;
  private gameObj: GameObj | null = null;
  private boneObj: GameObj | null = null;
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
    return this.gameObj;
  }

  private setupCollisions() {
    if (!this.gameObj) return;

    this.gameObj.onCollide("obstacle", (obstacle: any) => {
      if (this.isMoving) {
        console.log("Collision detected!");
        this.isMoving = false;
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
        });
      }
    });

    this.gameObj.onCollide("goal", () => {
      if (this.isMoving) {
        console.log("Goal reached!");
        this.isMoving = false;
        this.k.play("success");

        // 뼈다귀가 아직 없으면 머리 위에 추가
        if (!this.boneObj && this.gameObj) {
          this.boneObj = this.k.add([
            this.k.sprite("bone"),
            this.k.pos(this.gameObj.pos.x + 35, this.gameObj.pos.y - 70), // x축 오른쪽 35px, y축 위 70px 이동
            this.k.anchor("center"),
            this.k.z(11), // 플레이어보다 위에
            "bone",
          ]);
          
          // width와 height를 100px로 고정
          this.boneObj.width = 100;
          this.boneObj.height = 100;

          // 뼈다귀가 플레이어를 따라다니도록
          this.k.onUpdate(() => {
            if (this.boneObj && this.gameObj) {
              this.boneObj.pos.x = this.gameObj.pos.x + 35; // x축 오른쪽 35px 이동
              this.boneObj.pos.y = this.gameObj.pos.y - 70; // y축 위 70px 이동
            }
          });
        }

        // 성공 시 사이즈를 키우는 간단한 확대 애니메이션 (0.3 -> 0.5)
        let t = 0;
        const startScale = 0.3;
        const endScale = 0.5;
        const duration = 0.35;
        const growInterval = this.k.onUpdate(() => {
          if (!this.gameObj) return;
          t += this.k.dt();
          const p = Math.min(1, t / duration);
          const s = startScale * (1 - p) + end*Scale* p;
          this.gameObj.scale = this.k.vec2(s);
          if (p >= 1) {
            try { growInterval.cancel(); } catch {}
          }
        });
      }
    });
  }

  async moveToPosition(targetX: number): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.gameObj) {
        resolve();
        return;
      }

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
          // 움직임이 멈추면 첫 번째 프레임으로 돌아감
          if (this.gameObj) {
            this.gameObj.use(this.k.sprite("shiba_1"));
          }
          moveInterval.cancel();
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
          this.gameObj.use(this.k.sprite("shiba_1")); // 정지 시 첫 번째 프레임
          moveInterval.cancel();
          resolve();
        }
      });
    });
  }

  reset(x: number, y: number) {
    if (!this.gameObj) return;
    
    this.gameObj.pos.x = x;
    this.gameObj.pos.y = y;
    this.gameObj.angle = 0;
    this.gameObj.scale = this.k.vec2(0.3); // 시바견 크기 유지
    this.gameObj.use(this.k.sprite("shiba_1")); // 첫 번째 프레임으로 초기화
    
    // 뼈다귀 제거
    if (this.boneObj) {
      this.boneObj.destroy();
      this.boneObj = null;
    }
    
    this.isMoving = false;
  }

  get position() {
    return this.gameObj?.pos || { x: 0, y: 0 };
  }

  get moving() {
    return this.isMoving;
  }

  // 외부에서 성공/실패 애니메이션 트리거
  triggerSuccess() {
    if (!this.gameObj) return;
    
    this.isMoving = false;
    this.k.play("success");
    
    // 뼈다귀가 아직 없으면 머리 위에 추가
    if (!this.boneObj) {
      this.boneObj = this.k.add([
        this.k.sprite("bone"),
        this.k.pos(this.gameObj.pos.x + 40, this.gameObj.pos.y - 20), // x축 오른쪽 40px, y축 위 20px 이동
        this.k.anchor("center"),
        this.k.z(11), // 플레이어보다 위에
        "bone",
      ]);
      
      // width와 height를 100px로 고정
      this.boneObj.width = 100;
      this.boneObj.height = 100;

      // 뼈다귀가 플레이어를 따라다니도록
      this.k.onUpdate(() => {
        if (this.boneObj && this.gameObj) {
          this.boneObj.pos.x = this.gameObj.pos.x + 40; // x축 오른쪽 40px 이동
          this.boneObj.pos.y = this.gameObj.pos.y - 20; // y축 위 20px 이동
        }
      });
    }
    
    let rotation = 0;
    const celebrateInterval = this.k.onUpdate(() => {
      if (!this.gameObj) return;
      
      rotation += this.k.dt() * 10;
      this.gameObj.angle = Math.sin(rotation) * 20;
          this.gameObj.scale = this.k.vec2(0.35 + Math.sin(rotation * 2) * 0.15);
      
      if (rotation > Math.PI * 4) {
        celebrateInterval.cancel();
            this.gameObj.angle = 0;
            this.gameObj.scale = this.k.vec2(0.5);
      }
    });
  }

  triggerFailure() {
    if (!this.gameObj) return;
    
    this.isMoving = false;
    this.k.play("hit");
    
    // 실패 시 뒤로 밀림
    this.k.wait(0.5, () => {
      if (this.gameObj) {
        this.gameObj.pos.x -= 50;
      }
    });
  }
}