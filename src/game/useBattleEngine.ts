import { useEffect, useRef, useState } from "react";
import type { AttackEvent } from "../lib/motion/types";
import { evaluateAttack } from "./judgment";
import type {
  AttackCue,
  BattlePhase,
  BattleResult,
  DifficultyPreset,
  JudgmentGrade,
  RoundConfig,
} from "./types";

export interface BattleEngineState {
  phase: BattlePhase;
  phaseElapsedMs: number;
  phaseDurationMs: number;
  cueIndex: number;
  currentCue: AttackCue;
  playerHp: number;
  enemyHp: number;
  playerMaxHp: number;
  enemyMaxHp: number;
  combo: number;
  comboPeak: number;
  finesse: number;
  finessePeak: number;
  timeLeftMs: number;
  message: string;
  lastJudge: JudgmentGrade | null;
  enemyReaction: "idle" | "hit" | "guard" | "counter" | "feint";
  result: BattleResult | null;
  feedbackTick: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const createInitialState = (
  round: RoundConfig,
  difficulty: DifficultyPreset,
): BattleEngineState => ({
  phase: "countdown",
  phaseElapsedMs: 0,
  phaseDurationMs: 3000,
  cueIndex: 0,
  currentCue: round.patterns[0],
  playerHp: Math.round(round.playerHp * difficulty.playerHpScale),
  enemyHp: Math.round(round.enemyHp * difficulty.enemyHpScale),
  playerMaxHp: Math.round(round.playerHp * difficulty.playerHpScale),
  enemyMaxHp: Math.round(round.enemyHp * difficulty.enemyHpScale),
  combo: 0,
  comboPeak: 0,
  finesse: 0,
  finessePeak: 0,
  timeLeftMs: round.timeLimitMs,
  message: "궁중 연타전 개막",
  lastJudge: null,
  enemyReaction: "idle",
  result: null,
  feedbackTick: 0,
});

export function useBattleEngine(
  round: RoundConfig,
  difficulty: DifficultyPreset,
  lastAttackEvent: AttackEvent | null,
) {
  const [state, setState] = useState(() => createInitialState(round, difficulty));
  const stateRef = useRef(state);
  const phaseStartedAt = useRef(performance.now());
  const battleStartedAt = useRef(performance.now());
  const lastAttackId = useRef(0);
  const targetAt = useRef(0);

  const commit = (updater: (current: BattleEngineState) => BattleEngineState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
  };

  const cueAt = (index: number) => round.patterns[index % round.patterns.length];

  const finishBattle = (outcome: "victory" | "defeat", summary: string) => {
    commit((current) => ({
      ...current,
      phase: "battleEnd",
      phaseDurationMs: 0,
      phaseElapsedMs: 0,
      result: {
        outcome,
        roundId: round.id,
        enemyId: round.enemyId,
        comboPeak: current.comboPeak,
        finessePeak: current.finessePeak,
        summary,
        historyUnlockId: round.enemyId,
      },
    }));
  };

  const enterPhase = (
    phase: BattlePhase,
    duration: number,
    patch?: Partial<BattleEngineState>,
  ) => {
    phaseStartedAt.current = performance.now();
    commit((current) => ({
      ...current,
      phase,
      phaseDurationMs: duration,
      phaseElapsedMs: 0,
      ...patch,
    }));
  };

  const queueNextCue = () => {
    const nextCue = cueAt(stateRef.current.cueIndex + 1);
    commit((current) => ({
      ...current,
      cueIndex: current.cueIndex + 1,
      currentCue: nextCue,
      enemyReaction: "idle",
    }));
    enterPhase("patternTelegraph", nextCue.telegraphMs, {
      message: nextCue.fake
        ? "페이크 예고. 섣불리 손을 내밀지 마세요."
        : "등불이 밝아질 때를 노리세요.",
    });
  };

  const resolveLateMiss = () => {
    const cue = stateRef.current.currentCue;
    commit((current) => {
      const damage = Math.round((cue.damage.selfOnMiss ?? 5) * difficulty.chipDamageScale);
      return {
        ...current,
        playerHp: Math.max(0, current.playerHp - damage),
        combo: 0,
        finesse: clamp(current.finesse - 10, 0, 100),
        lastJudge: "too-late",
        enemyReaction: cue.fake ? "feint" : "counter",
        message: cue.fake
          ? "페이크는 넘겼지만 진짜 박자를 놓쳤습니다."
          : "타이밍을 놓쳤습니다.",
        feedbackTick: current.feedbackTick + 1,
      };
    });
    enterPhase("resolveHit", cue.recoveryMs);
  };

  const processAttack = (event: AttackEvent) => {
    const current = stateRef.current;
    const cue = current.currentCue;
    if (current.result) {
      return;
    }

    if (
      (current.phase === "patternTelegraph" || current.phase === "readyWindow") &&
      cue.counterOnEarly
    ) {
      commit((battle) => {
        const selfDamage = Math.round(
          (cue.damage.selfOnCounter ?? 9) * difficulty.chipDamageScale,
        );
        return {
          ...battle,
          playerHp: Math.max(0, battle.playerHp - selfDamamge),
          combo: 0,
          finesse: clamp(battle.finesse - 16, 0, 100),
          lastJudge: "too-early",
          enemyReaction: cue.fake ? "feint" : "counter",
          message: cue.fake
            ? "회인트에 머저 밑응을 내주습니다."
            : "너무 빨랐습니다. 상대가 반격했습니다.",
          feedbackTick: battle.feedbackTick + 1,
        };
      });
      enterPhase("resolveHit", cue.recoveryMs);
      return;
    }

    if (current.phase !== "timingWindow") {
      return;
    }

    const resolution = evaluateAttack({
      cue,
      round,
      difficulty,
      event,
      targetAt: targetAt.current,
      playerFinesse: current.finesse,
    });

    commit((battle) => {
      const combo = resolution.enemyDamage > 0 ? battle.combo + 1 : 0;
      const finesseNext =
        resolution.grade === "perfect" && cue.guardBreakOnly && battle.finesse >= 100
          ? 0
          : clamp(battle.finesse + resolution.finesseDelta, 0, 100);

      return {
        ...battle,
        playerHp: Math.max(0, battle.playerHp - resolution.selfDamage),
        enemyHp: Math.max(0, battle.enemyHp - resolution.enemyDamage),
        combo,
        comboPeak: Math.max(battle.comboPeak, combo),
        finesse: finesseNext,
        finessePeak: Math.max(battle.finessePeak, finesseNext),
        lastJudge: resolution.grade,
        enemyReaction:
          resolution.grade === "perfect" || resolution.grade === "good"
            ? "hit"
            : resolution.grade === "guarded"
              ? "guard"
              : resolution.grade === "fake-trigger"
                ? "feint"
                : "counter",
        message: resolution.summary,
        feedbackTick: battle.feedbackTick + 1,
      };
    });

    enterPhase("resolveHit", cue.recoveryMs);
  };

  useEffect(() => {
    const reset = createInitialState(round, difficulty);
    stateRef.current = reset;
    setState(reset);
    phaseStartedAt.current = performance.now();
    battleStartedAt.current = performance.now();
    targetAt.current = 0;
    lastAttackId.current = 0;
  }, [difficulty, round]);

  useEffect(() => {
    if (!lastAttackEvent || lastAttackEvent.id === lastAttackId.current) {
      return;
    }

    lastAttackId.current = lastAttackEvent.id;
    processAttack(lastAttackEvent);
  }, [lastAttackEvent]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = stateRef.current;
      if (current.result) {
        return;
      }

      const now = performance.now();
      const elapsed = now - phaseStartedAt.current;
      const timeLeftMs = Math.max(0, round.timeLimitMs - (now - battleStartedAt.current));

      commit((battle) => ({
        ...battle,
        phaseElapsedMs: elapsed,
        timeLeftMs,
      }));

      if (timeLeftMs <= 0) {
        finishBattle(
          current.enemyHp <= 0 ? "victory" : "defeat",
          current.enemyHp <= 0
            ? "시간이 다 되기 전에 흐름을 장악했습니다."
            : "시간이 끝나며 상대가 우위를 지켰습니다.",
        );
        return;
      }

      if (current.playerHp <= 0) {
        finishBattle("defeat", "희빈 장씨가 이번 궁중 승부에서 밀렸습니다.");
        return;
      }

      if (current.enemyHp <= 0) {
        finishBattle("victory", "상대를 제압하고 다음 궁중 무대로 나아갑니다.");
        return;
      }

      switch (current.phase) {
        case "countdown":
          if (elapsed >= current.phaseDurationMs) {
            enterPhase("patternTelegraph", current.currentCue.telegraphMs, {
              message: current.currentCue.fake
                ? "붉은 예고선은 페이크일 수 있습니다."
                : "레일이 빛나는 순간을 노리세요.",
            });
          }
          break;
        case "patternTelegraph":
          if (elapsed >= current.currentCue.telegraphMs) {
            enterPhase("readyWindow", current.currentCue.readyMs, {
              message: "손을 어깨 가까이에 두고 힘을 모으세요.",
            });
          }
          break;
        case "readyWindow":
          if (elapsed >= current.currentCue.readyMs) {
            targetAt.current = performance.now() + current.currentCue.windowMs / 2;
            enterPhase("timingWindow", current.currentCue.windowMs, {
              message: current.currentCue.fake
                ? "움직이지 말고 진짜 박자를 기다리세요."
                : current.currentCue.guard
                  ? "Perfect로 장막을 뚫으세요."
                  : "지금, 손을 내질러 보세요.",
            });
          }
          break;
        case "timingWindow":
          if (elapsed >= current.currentCue.windowMs) {
            resolveLateMiss();
          }
          break;
        case "resolveHit":
          if (elapsed >= current.currentCue.recoveryMs) {
            queueNextCue();
          }
          break;
        default:
          break;
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [difficulty.chipDamageScale, round]);

  return state;
}
