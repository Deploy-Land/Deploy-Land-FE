import type { KaboomCtx } from "kaplay";

export interface ParallaxLayer {
  key: string;
  z: number;
  y: number;
}

export class ParallaxSystem {
  private k: KaboomCtx;

  constructor(k: KaboomCtx) {
    this.k = k;
  }

  createCanvasBackground() {
    const W = this.k.width();
    const H = this.k.height();

    const layers: ParallaxLayer[] = [
      { key: "bg_sky", z: -50, y: 0 },
      { key: "bg_far", z: -40, y: 0 },
      { key: "bg_mid", z: -30, y: 0 },
      { key: "bg_trees", z: -20, y: 0 },
      { key: "bg_near", z: -10, y: 0 },
    ];

    layers.forEach((l) => {
      try {
        const spr = this.k.add([
          this.k.sprite(l.key, { tiled: true }),
          this.k.anchor("botleft"),
          this.k.pos(0, H + l.y),
          this.k.fixed(),
          this.k.z(l.z),
        ]);
        spr.width = W;
        console.log(`[BG] layer added: ${l.key} z=${l.z}`);
      } catch (_err) {
        this.k.add([
          this.k.rect(W, H),
          this.k.pos(0, 0),
          this.k.color(20, 24, 32),
          this.k.fixed(),
          this.k.z(l.z),
        ]);
        console.warn(`[BG] missing layer sprite: ${l.key}, using solid color fallback`);
      }
    });
  }
}