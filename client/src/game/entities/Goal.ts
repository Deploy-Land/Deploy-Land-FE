import type { KaboomCtx, GameObj } from "kaplay";

export interface GoalConfig {
  x: number;
  y: number;
  size?: number;
}

export class Goal {
  private k: KaboomCtx;
  private gameObj: GameObj | null = null;

  constructor(k: KaboomCtx) {
    this.k = k;
  }

  create(config: GoalConfig) {
    const size = config.size || 50;
    
    // 초록색 배경 제거, 투명한 rect와 area로 충돌 감지만 유지
    this.gameObj = this.k.add([
      this.k.rect(size, size),
      this.k.pos(config.x, config.y),
      this.k.color(0, 0, 0, 0), // 완전히 투명
      this.k.area(),
      this.k.anchor("center"),
      "goal",
    ]);

    return this.gameObj;
  }

  get position() {
    return this.gameObj?.pos || { x: 0, y: 0 };
  }
}