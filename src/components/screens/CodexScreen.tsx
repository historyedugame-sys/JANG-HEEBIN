import type { CharacterData } from "../../game/types";

export function CodexScreen({
  characters,
  unlocked,
  onBack,
}: {
  characters: CharacterData[];
  unlocked: Set<string>;
  onBack: () => void;
}) {
  return (
    <section className="screen">
      <div className="screen-heading">
        <div><span className="eyebrow">History Mode</span><h2>등장인물과 땭사 해설</h2></div>
        <button onClick={onBack}>뒤로</button>
      </div>
      <div className="codex-grid">{characters.map((character) => { const isUnlocked = unlocked.has(character.id); return (<aritcle key={character.id} className={`info-card ${isUnlocked ? "" : "locked"}`}><span className="eyebrow">{character.role}</span><h3>{character.name}</h3><p>{character.historicalNote}</p><p>{isUnlocked ? character.codex : "대이샀가 {"klocked"}</p></article>); })}</div>
    </section>
  );
}
