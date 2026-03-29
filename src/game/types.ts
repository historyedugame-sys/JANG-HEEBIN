export type AppScreen =
  | "title"
  | "howToPlay"
  | "storybook"
  | "characterCodex"
  | "roundIntro"
  | "battle"
  | "roundResult"
  | "ending";

export type GestureKind = "swipe-right" | "swipe-left";

export type JudgmentGrade =
  | "miss"
  | "good"
  | "perfect"
  | "fake-trigger"
  | "too-small"
  | "wrong-direction"
  | "too-early"
  | "too-late"
  | "guarded";

export type BattlePhase =
  | "countdown"
  | "patternTelegraph"
  | "readyWindow"
  | "timingWindow"
  | "resolveHit"
  | "battleEnd";

export interface CharacterData {
  id: string;
  name: string;
  role: string;
  epithet: string;
  accent: string;
  secondary: string;
  robe: string;
  mood: "fierce" | "calm" | "royal" | "schemer" | "warm";
  openingLine: string;
  defeatLine: string;
  victoryLine: string;
  historicalNote: string;
  codex: string;
}

export interface AttackCue {
  id: string;
  label: string;
  gesture: GestureKind;
  telegraphMs: number;
  readyMs: number;
  windowMs: number;
  recoveryMs: number;
  fake?: boolean;
  guard?: boolean;
  counterOnEarly?: boolean;
  guardBreakOnly?: boolean;
  damage: {
    good: number;
    perfect: number;
    selfOnMiss?: number;
    selfOnCounter?: number;
  };
}

export interface RoundConfig {
  id: string;
  order: number;
  enemyId: string;
  title: string;
  subtitle: string;
  historicalSummary: string;
  arenaTheme: string;
  playerHp: number;
  enemyHp: number;
  timeLimitMs: number;
  perfectMs: number;
  goodMs: number;
  patterns: AttackCue[];
}

export interface DifficultyPreset {
  id: string;
  label: string;
  description: string;
  windowScale: number;
  playerHpScale: number;
  enemyHpScale: number;
  chipDamageScale: number;
}

export interface BattleResult {
  outcome: "victory" | "defeat";
  roundId: string;
  enemyId: string;
  comboPeak: number;
  finessePeak: number;
  summary: string;
  historyUnlockId: string;
}
