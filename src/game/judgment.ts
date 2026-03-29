import type { AttackCue, DifficultyPreset, JudgmentGrade, RoundConfig } from "./types";
import type { AttackEvent } from "../lib/motion/types";

export interface AttackResolution {
  grade: JudgmentGrade;
  enemyDamage: number;
  selfDamage: number;
  finesseDelta: number;
  summary: string;
}

export function evaluateAttack(params: {
  cue: AttackCue;
  round: RoundConfig;
  difficulty: DifficultyPreset;
  event: AttackEvent;
  targetAt: number;
  playerFinesse: number;
}): AttackResolution {
  const { cue, round, difficulty, event, targetAt, playerFinesse } = params;
  const deltaMs = event.ts - targetAt;
  const perfectMs = round.perfectMs * difficulty.windowScale;
  const goodMs = round.goodMs * difficulty.windowScale;

  if (cue.fake) {
    return {
      grade: "fake-trigger",
      enemyDamage: 0,
      selfDamage: Math.round((cue.damage.selfOnCounter ?? 10) * difficulty.chipDamageScale),
      finesseDelta: -20,
      summary: "페이크에 먼저 반응했습니다.",
    };
  }

  if (
    (cue.gesture === "swipe-right" && event.direction !== "right") ||
    (cue.gesture === "swipe-left" && event.direction !== "left")
  ) {
    return {
      grade: "wrong-direction",
      enemyDamage: 0,
      selfDamage: Math.round((cue.damage.selfOnMiss ?? 4) * difficulty.chipDamageScale),
      finesseDelta: -12,
      summary: "손의 방향이 맞지 않았습니다.",
    };
  }

  if (Math.abs(deltaMs) <= perfectMs) {
    if (cue.guard && cue.guardBreakOnly && playerFinesse < 100) {
      return {
        grade: "guarded",
        enemyDamage: 0,
        selfDamage: Math.round((cue.damage.selfOnMiss ?? 5) * difficulty.chipDamageScale),
        finesseDelta: -6,
        summary: "가드를 뚫지 못했습니다. Perfect 연속으로 필살기 게이지를 채우세요.",
      };
    }

    return {
      grade: "perfect",
      enemyDamage: cue.damage.perfect,
      selfDamage: 0,
      finesseDelta: cue.guard ? 28 : 24,
      summary: cue.guard
        ? "완벽한 타이밍으로 장막을 뚫었습니다."
        : "Perfect! 총애의 리듬을 정확히 읽었습니다.",
    };
  }

  if (Math.abs(deltaMs) <= goodMs) {
    if (cue.guard) {
      return {
        grade: "guarded",
        enemyDamage: 0,
        selfDamage: Math.round((cue.damage.selfOnMiss ?? 4) * difficulty.chipDamageScale),
        finesseDelta: -5,
        summary: "왕후의 가드에 막혔습니다. 더 정확한 타이밍이 필요합니다.",
      };
    }

    return {
      grade: "good",
      enemyDamage: cue.damage.good,
      selfDamage: 0,
      finesseDelta: 15,
      summary: "Good. 한 박자 살아 있는 타격입니다.",
    };
  }

  return {
    grade: deltaMs < 0 ? "too-early" : "too-late",
    enemyDamage: 0,
    selfDamage: Math.round((cue.damage.selfOnMiss ?? 5) * difficulty.chipDamageScale),
    finesseDelta: -14,
    summary: deltaMs < 0 ? "너무 빨랐습니다." : "한 박자 늦었습니다.",
  };
}

export function labelForJudge(grade: JudgmentGrade | null) {
  switch (grade) {
    case "perfect":
      return "PERFECT";
    case "good":
      return "GOOD";
    case "too-early":
      return "EARLY";
    case "too-late":
      return "LATE";
    case "fake-trigger":
      return "FAKE";
    case "wrong-direction":
      return "WRONG";
    case "guarded":
      return "GUARD";
    case "too-small":
      return "WEAK";
    case "miss":
      return "MISS";
    default:
      return "READY";
  }
}
