import type { MovementPath } from "../types/movement";

export const MOCK_MOVEMENT_PATHS: MovementPath[] = [
  { direction: "right", distance: 300, hasObstacle: false },
  { direction: "right", distance: 200, hasObstacle: true },
  { direction: "right", distance: 400, hasObstacle: false },
  { direction: "right", distance: 150, hasObstacle: true },
  { direction: "right", distance: 500, hasObstacle: false },
];

export async function getMockMovementPath(): Promise<MovementPath> {
  const randomIndex = Math.floor(Math.random() * MOCK_MOVEMENT_PATHS.length);
  const selected = MOCK_MOVEMENT_PATHS[randomIndex];

  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...selected }), 150);
  });
}


