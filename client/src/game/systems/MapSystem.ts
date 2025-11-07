import type { KaboomCtx } from "kaplay";

export class MapSystem {
  private k: KaboomCtx;

  constructor(k: KaboomCtx) {
    this.k = k;
  }

  // 정적 맵 생성 기능 제거됨

  createGround() {
    this.k.add([
      this.k.rect(this.k.width(), 80),
      this.k.pos(0, this.k.height() - 80),
      this.k.color(139, 69, 19),
      this.k.area(),
      this.k.body({ isStatic: true }),
      "ground",
    ]);
  }

  // 기본 구역 설정 제거됨
}