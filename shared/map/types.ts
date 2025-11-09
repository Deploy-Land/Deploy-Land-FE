export interface MovementPath {
  direction: "right" | "left" | "up" | "down";
  distance: number;
  hasObstacle: boolean;
}

export type MapZone = "build" | "test" | "deploy";

export interface MapZoneConfig {
  id: MapZone;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color?: [number, number, number];
  texture?: string;
}

