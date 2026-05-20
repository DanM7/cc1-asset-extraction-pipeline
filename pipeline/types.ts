export type MonsterDirection = "north" | "east" | "south" | "west";

/** DAT field 4: brown button → trap. */
export interface TrapButtonLink {
  button: { x: number; y: number };
  trap: { x: number; y: number };
}

/** DAT field 5: red button → clone machine. */
export interface CloneButtonLink {
  button: { x: number; y: number };
  clone: { x: number; y: number };
}

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
  trapLinks?: TrapButtonLink[];
  cloneLinks?: CloneButtonLink[];
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
