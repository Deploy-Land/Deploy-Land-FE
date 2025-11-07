export interface MovementPath {
  direction: "right" | "left" | "up" | "down";
  distance: number;
  hasObstacle: boolean;
}


