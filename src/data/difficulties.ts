import type { DifficultyPreset } from "../game/types";

export const DIFFICULTIES: DifficultyPreset[] = [
  {
    id: "gungnyeo",
    label: "궁녀급",
    description: "입문용. 타이밍 창이 넓고 체력이 넉넉합니다.",
    windowScale: 1.18,
    playerHpScale: 1.2,
    enemyHpScale: 0.92,
    chipDamageScale: 0.8,
  },
  {
    id: "sanggung",
    label: "상궁급",
    description: "기본 난이도. 권렵 다툼의 리듬을 가장 균형 있게 즐깁니다.",
    windowScale: 1,
    playerHpScale: 1,
    enemyHpScale: 1,
    chipDamageScale: 1,
  },
  {
    id: "jungjeon",
    label: "중전급",
    description: "숙련자용. 타이밍이 촘촜하고 반격 압박이 강합니다.",
    windowScale: 0.82,
    playerHpScale: 0.9,
    enemyHpScale: 1.1,
    chipDamageScale: 1.15,
  },
];
