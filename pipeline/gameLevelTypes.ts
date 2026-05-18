/** Level JSON schema produced by the DAT pipeline for game clients. */

export interface LevelMonster {
  x: number;
  y: number;
  direction: "north" | "east" | "south" | "west";
}

export interface LevelLayers {
  lower: string[];
  upper: string[];
}

export interface LevelHud {
  levelTitle: string;
  levelNumber?: number;
  timer?: {
    mode: "countDown" | "countUp" | "none";
    initialSeconds: number;
  };
  chipCounter?: {
    mode: "remaining";
    initial: number;
    required: number;
  };
  collectiblesOnMap?: number;
  inventorySlots?: string[];
}

export interface LevelData {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  layers: LevelLayers;
  timeLimit?: number;
  chipsRequired?: number;
  monsters?: LevelMonster[];
  metadata?: {
    title?: string;
    hint?: string;
    passwordHash?: string;
    passwordPlain?: string;
  };
  playerStart?: { x: number; y: number };
  hud?: LevelHud;
}
