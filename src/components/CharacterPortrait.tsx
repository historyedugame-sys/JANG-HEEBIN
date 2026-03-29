import type { CharacterData } from "../game/types";

export function CharacterPortrait({
  character,
  side,
  reaction,
  hpRatio,
}: {
  character: CharacterData;
  side: "left" | "right";
  reaction: "idle" | "hit" | "guard" | "counter" | "feint";
  hpRatio: number;
}) {
  return (
    <div className={`portrait-card side-${side} state-${reaction}`}>
      <div className="portrait-ribbon">
        <span>{character.role}</span>
        <strong>{character.name}</strong>
      </div>
      <svg
        viewBox="0 0 240 300"
        className="portrait-illustration"
        aria-label={character.name}
      >
        <defs>
          <linearGradient id={`robe-${character.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={character.robe} />
            <stop offset="100%" stopColor={character.accent} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="240" height="300" rx="30" fill="rgba(17, 9, 17, 0.28)" />
        <circle cx="120" cy="78" r="40" fill="#e3bf9c" />
        <ellipse cx="120" cy="165" rx="78" ry="92" fill={`url(#robe-${character.id})`} />
        <ellipse cx="120" cy="54" rx="36" ry="25" fill="#1a1021" />
        <circle cx="85" cy="54" r="15" fill="#1a1021" />
        <circle cx="155" cy="54" r="15" fill="#1a1021" />
        <circle cx="108" cy="76" r="4" fill="#1d1111" />
        <circle cx="132" cy="76" r="4" fill="#1d1111" />
        <path d="M103 95 Q120 106 137 95" fill="none" stroke="#8b4b57" strokeWidth="3" strokeLinecap="round" />
        <path d="M67 145 Q120 205 173 145" fill="none" stroke={character.secondary} strokeWidth="10" strokeLinecap="round" />
        <circle cx="170" cy="60" r="10" fill={character.accent} />
        <circle cx="182" cy="70" r="7" fill={character.secondary} />
      </svg>
      <div className="portrait-meta">
        <span>{character.epithet}</span>
        <div className="portrait-hp">
          <div style={{ width: `${Math.max(0, Math.min(100, hpRatio * 100))}%` }} />
        </div>
      </div>
    </div>
  );
}
