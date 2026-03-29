import { useState } from "react";
import { ArcadeFrame } from "./components/ArcadeFrame";
import { BattleScreen } from "./components/screens/BattleScreen";
import { CodexScreen } from "./components/screens/CodexScreen";
import { EndingScreen } from "./components/screens/EndingScreen";
import { HowToPlayScreen } from "./components/screens/HowToPlayScreen";
import { ResultScreen } from "./components/screens/ResultScreen";
import { RoundIntroScreen } from "./components/screens/RoundIntroScreen";
import { StoryScreen } from "./components/screens/StoryScreen";
import { TitleScreen } from "./components/screens/TitleScreen";
import { CHARACTER_BY_ID, COURT_CHARACTERS, PLAYER_CHARACTER } from "./data/characters";
import { DIFFICULTIES } from "./data/difficulties";
import { ROUNDS } from "./data/rounds";
import { STORY_SCENES } from "./data/story";
import type { AppScreen, BattleResult } from "./game/types";
import { useArcadeAudio } from "./hooks/useArcadeAudio";
import { useWebcamMotion } from "./hooks/useWebcamMotion";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("title");
  const [difficultyId, setDifficultyId] = useState(DIFFICULTIES[1].id);
  const [roundIndex, setRoundIndex] = useState(0);
  const [lastReport, setLastReport] = useState<BattleResult | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(
    new Set(["heebin-jangssi", "gungnyeo"]),
  );
  const motion = useWebcamMotion();
  const audio = useArcadeAudio();

  const difficulty =
    DIFFICULTIES.find((entry) => entry.id === difficultyId) ?? DIFFICULTIES[1];
  const round = ROUNDS[roundIndex];
  const enemy = CHARACTER_BY_ID[round.enemyId];

  const withClick = (callback: () => void) => () => {
    audio.playUiClick();
    callback();
  };

  const goToTitle = () => {
    setScreen("title");
    setRoundIndex(0);
    setLastReport(null);
  };

  return (
    <ArcadeFrame title="희빈 장씨: 궁중 연타전">
      {screen === "title" ? (
        <TitleScreen
          difficulties={DIFFICULTIES}
          selectedDifficultyId={difficultyId}
          musicEnabled={audio.musicEnabled}
          onChooseDifficulty={(id) => {
            audio.playUiClick();
            setDifficultyId(id);
          }}
          onStart={withClick(() => setScreen("howToPlay"))}
          onHowTo={withClick(() => setScreen("howToPlay"))}
          onCodex={withClick(() => setScreen("characterCodex"))}
          onToggleMusic={() => {
            audio.playUiClick();
            audio.toggleMusic();
          }}
        />
      ) : null}

      {screen === "howToPlay" ? (
        <HowToPlayScreen
          motion={motion}
          onBack={withClick(() => setScreen("title"))}
          onContinue={withClick(() => setScreen("storybook"))}
        />
      ) : null}

      {screen === "storybook" ? (
        <StoryScreen
          scenes={STORY_SCENES}
          onBack={withClick(() => setScreen("howToPlay"))}
          onDone={withClick(() => setScreen("roundIntro"))}
        />
      ) : null}

      {screen === "characterCodex" ? (
        <CodexScreen
          characters={[PLAYER_CHARACTER, ...COURT_CHARACTERS]}
          unlocked={unlocked}
          onBack={withClick(() => setScreen(lastReport ? "roundResult" : "title"))}
        />
      ) : null}

      {screen === "roundIntro" ? (
        <RoundIntroScreen
          round={round}
          enemy={enemy}
          onBack={withClick(() => setScreen(roundIndex === 0 ? "storybook" : "roundResult"))}
          onBattle={withClick(() => setScreen("battle"))}
        />
      ) : null}

      {screen === "battle" ? (
        <BattleScreen
          round={round}
          player={PLAYER_CHARACTER}
          enemy={enemy}
          difficulty={difficulty}
          motion={motion}
          onExit={withClick(() => setScreen("roundIntro"))}
          onPlayJudge={(grade) => audio.playJudge(grade)}
          onResolved={(report) => {
            if (report.outcome === "victory") {
              audio.playRoundClear();
            } else {
              audio.playDefeat();
            }

            setUnlocked((current) => new Set([...current, report.historyUnlockId]));
            setLastReport(report);
            setScreen("roundResult");
          }}
        />
      ) : null}

      {screen === "roundResult" && lastReport ? (
        <ResultScreen
          report={lastReport}
          enemy={enemy}
          isFinalRound={roundIndex === ROUNDS.length - 1}
          onTitle={withClick(goToTitle)}
          onCodex={withClick(() => setScreen("characterCodex"))}
          onRetry={withClick(() => setScreen("battle"))}
          onNext={withClick(() => {
            if (lastReport.outcome !== "victory") {
              setScreen("battle");
              return;
            }

            if (roundIndex === ROUNDS.length - 1) {
              setScreen("ending");
              return;
            }

            setRoundIndex((current) => current + 1);
            setScreen("roundIntro");
          })}
        />
      ) : null}

      {screen === "ending" ? (
        <EndingScreen
          onTitle={withClick(goToTitle)}
          onCodex={withClick(() => setScreen("characterCodex"))}
        />
      ) : null}
    </ArcadeFrame>
  );
}
