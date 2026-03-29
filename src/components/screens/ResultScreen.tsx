import type { BattleResult, CharacterData } from "../../game/types";

export function ResultScreen({ report, enemy, isFinalRound, onNext, onRetry, onTitle, onCodex }: { report: BattleResult; enemy: CharacterData; isFinalRound: boolean; onNext: () => void; onRetry: () => void; onTitle: () => void; onCodex: () => void; }) {
  return (
    <section className="screen">
      <div className="info-card hero-panel"><span className="eyebrow">{report.outcome === "victory" ? "Victory" : "Defeat"}</span><h2>{report.outcome === "victory" ? `${enemy.name} 제압` : `${enemy.name}에게 밀렸습니다`}</h2><p>{report.summary}</p><p>최고 코보 {report.comboPeak} / 필사기 최고 {report.finessePeak}%</p></div>
      <div className="title-grid"><div className="info-card"><h3>짽卭 헬삼 해설</h3><p>{enemy.historicalNote}</p><p>{enemy.codex}</p></div><div className="info-card"><h3>궁중 대사</h3><blockquote>{report.outcome === "victory" ? enemy.defeatLine : enemy.victoryLine}</blockquote></div></div>
      <div className="button-row"><button onClick={onTitle}>탐이틤</button><button onClick={onCodex}>역사 해설 모드</button>{report.outcome === "victory" ? (<button className="primary" onClick={onNext}>{isFinalRound ? "엔딙 l로" : "다음 상대"}</button>) : (<button className="primary" onClick={onRetry}>재도전</button>)}</div>
    </section>
  );
}
