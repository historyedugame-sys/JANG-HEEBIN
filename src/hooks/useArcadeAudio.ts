import { useCallback, useEffect, useRef, useState } from "react";

const CHIME_VOLUME = 0.045;

export function useArcadeAudio() {
  contextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);

  const ensureContext = useCallback(async () => {
    if (typeof window === "undefined") {
      return null;
    }

    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }

    if (contextRef.current.state === "suspended") {
      await contextRef.current.resume();
    }

    return contextRef.current;
  }, []);

  const playTone = useCallback(
    async (
      frequency: number,
      duration: number,
      type: OscillatorType,
      volume = CHIME_VOLUME,
      offset = 0,
    ) => {
      context = await ensureContext();
      if (!context) {
        return;
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + offset);
      gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(
        volume,
        context.currentTime + offset + 0.02,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + offset + duration,
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + offset);
      oscillator.stop(context.currentTime + offset + duration + 0.05);
    },
    [ensureContext],
  );

  const playUiClick = useCallback(() => {
    void playTone(420, 0.12, "square", 0.03);
    void playTone(630, 0.08, "triangle", 0.02, 0.03);
  }, [playTone]);

  const playJudge = useCallback(
    (grade: "miss" | "good" | "perfect" | "guarded" | "counter") => {
      if (grade === "perfect") {
        void playTone(660, 0.18, "triangle", 0.05);
        void playTone(990, 0.14, "triangle", 0.04, 0.06);
        return;
      }

      if (grade === "good") {
        void playTone(560, 0.16, "square", 0.04);
        return;
      }

      if (grade === "guarded") {
        void playTone(240, 0.12, "sawtooth", 0.03);
        return;
      }

      if (grade === "counter") {
        void playTone(210, 0.18, "sawtooth", 0.04);
        void playTone(120, 0.22, "square", 0.03, 0.05);
        return;
      }

      void playTone(180, 0.22, "square", 0.025);
    },
    [playTone],
  );

  const playRoundClear = useCallback(() => {
    void playTone(440, 0.18, "triangle", 0.04);
    void playTone(660, 0.18, "triangle", 0.04, 0.12);
    void playTone(880, 0.26, "triangle", 0.04, 0.22);
  }, [playTone]);

  const playDefeat = useCallback(() => {
    void playTone(260, 0.16, "sawtooth", 0.03);
    void playTone(195, 0.18, "square", 0.03, 0.12);
    void playTone(140, 0.24, "square", 0.028, 0.24);
  }, [playTone]);

  useEffect(() => {
    if (!musicEnabled) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const schedule = () => {
      void playTone(220, 0.28, "triangle", 0.015);
      void playTone(330, 0.22, "triangle", 0.012, 0.32);
      void playTone(294, 0.24, "triangle", 0.012, 0.64);
      void playTone(392, 0.26, "triangle", 0.014, 0.94);
    };

    schedule();
    intervalRef.current = window.setInterval(schedule, 1600);
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [musicEnabled, playTone]);

  return {
    musicEnabled,
    toggleMusic: () => setMusicEnabled((current) => !current),
    playUiClick,
    playJudge,
    playRoundClear,
    playDefeat,
  };
}
