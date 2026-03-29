import type { AttackCue, BattlePhase } from "../game/types";

export function TimingRail({
  cue,
  phase,
  phaseElapsedMs,
  phaseDurationMs,
}: {
  cue: AttackCue;
  phase: BattlePhase;
  phaseElapsedMs: number;
  phaseDurationMs: number;
}) {
  const progress = phaseDurationMs <= 0 ? 0 : Math.max(0, Math.min(1, phaseElapsedMs / phaseDurationMs));

  return (
    <div className={`timing-rail phase-${phase}`}>
      <div className="timing-track">
        <div className="timing-target" />
        <div className="timing-marker" style={{ left: phase === "timingWindow" ? `${20 + progress * 60}%` : `${10 + progress * 80}%` }} />
      </div>
      <div className="timing-meta">
        <strong>{cue.label}</strong>
        <span>{cue.fake ? "페이크 패턴" : cue.guard ? "가드 패턴" : cue.counterOnEarly ? "반격 주의" : "정면 타이밍"}</span>
      </div>
    </div>
  );
}
