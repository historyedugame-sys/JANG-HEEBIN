import { labelForJudge } from "../game/judgment";

export function BattleHud(props: {
  roundTitle: string;
  subtitle: string;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  combo: number;
  finesse: number;
  timeLeftMs: number;
  judge: Parameters<typeof labelForJudge>[0];
}) {
  return (
    <div className="battle-hud">
      <div className="hud-row">
        <div className="hud-health">
          <span>희빈 장씨</span>
          <div className="health-bar">
            <div style={{ width: `${(props.playerHp / props.playerMaxHp) * 100}%` }} />
          </div>
        </div>
        <div className="hud-center">
          <small>{props.roundTitle}</small>
          <strong>{props.subtitle}</strong>
          <span className="judge-pill">{labelForJudge(props.judge)}</span>
        </div>
        <div className="hud-health enemy">
          <span>상대</span>
          <div className="health-bar">
            <div style={{ width: `${(props.enemyHp / props.enemyMaxHp) * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="hud-row secondary">
        <span>콤보 {props.combo}</span>
        <span>필살기 {Math.round(props.finesse)}%</span>
        <span>남은 시간 {(props.timeLeftMs / 1000).toFixed(1)}초</span>
      </div>
    </div>
  );
}
