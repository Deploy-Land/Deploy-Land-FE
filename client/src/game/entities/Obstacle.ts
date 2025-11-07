import type { KaboomCtx, GameObj } from "kaplay";

export class ObstacleManager {
  private k: KaboomCtx;
  private obstacles: GameObj[] = [];

  constructor(k: KaboomCtx) {
    this.k = k;
  }

  create(x: number, y: number): GameObj {
    const obstacle = this.k.add([
      this.k.rect(40, 60),
      this.k.pos(x, y),
      this.k.color(128, 128, 128),
      this.k.area(),
      this.k.anchor("center"),
      "obstacle",
      {
        shake: 0,
      },
    ]);
    
    this.obstacles.push(obstacle);
    return obstacle;
  }

  destroyAll() {
    this.obstacles.forEach((obs) => obs.destroy());
    this.obstacles = [];
  }

  get count() {
    return this.obstacles.length;
  }
}