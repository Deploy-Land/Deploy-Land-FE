import type { KaboomCtx, GameObj } from "kaplay";

export class ObstacleManager {
  private k: KaboomCtx;
  private obstacles: GameObj[] = [];

  constructor(k: KaboomCtx) {
    this.k = k;
  }

  create(x: number, y: number): GameObj {
    const obstacle = this.k.add([
      this.k.sprite("bug"),
      this.k.pos(x, y),
      this.k.area(),
      this.k.anchor("center"),
      "obstacle",
      {
        shake: 0,
      },
    ]);
    
    // 스프라이트가 로드된 후 크기를 100px * 100px로 조정
    // onUpdate를 사용하여 스프라이트의 실제 크기를 확인한 후 scale 계산
    let sizeSet = false;
    const sizeCheck = this.k.onUpdate(() => {
      if (!sizeSet && obstacle.width && obstacle.height && obstacle.width > 0 && obstacle.height > 0) {
        const targetSize = 100;
        // 현재 스프라이트의 표시 크기 (scale 적용 전 원본 크기)
        // Kaplay에서 sprite의 width/height는 scale이 적용된 후의 크기일 수 있음
        // 원본 크기를 얻기 위해 scale로 나눔 (scale이 없으면 1)
        const currentScaleX = obstacle.scale?.x || 1;
        const currentScaleY = obstacle.scale?.y || 1;
        const originalWidth = obstacle.width / currentScaleX;
        const originalHeight = obstacle.height / currentScaleY;
        
        // 정사각형으로 유지하기 위해 더 큰 값 기준
        const originalSize = Math.max(originalWidth, originalHeight);
        const scale = targetSize / originalSize;
        
        obstacle.scale = this.k.vec2(scale);
        sizeSet = true;
        sizeCheck.cancel();
      }
    });
    
    // 타임아웃 설정 (5초 후에도 크기를 못 찾으면 기본 크기 사용)
    this.k.wait(5, () => {
      if (!sizeSet) {
        console.warn("장애물 크기 설정 타임아웃, 기본 크기 사용");
        sizeCheck.cancel();
      }
    });
    
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