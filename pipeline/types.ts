export type MonsterDirection = "north" | "east" | "south" | "west";

export interface ChipLevel {
  levelNumber: number;
  timeLimit: number;
  chipsRequired: number;
  size: {
    width: number;
    height: number;
  };
  layers: {
    lower: string[];
    upper: string[];
  };
  monsters: {
    x: number;
    y: number;
    direction: MonsterDirection;
  }[];
  metadata: {
    title?: string;
    hint?: string;
    passwordHash?: string;
    passwordPlain?: string;
  };
}

export interface ChipDatFile {
  sourceFile: string;
  magic: number;
  levelCount: number;
  levels: ChipLevel[];
}
