import { useCallback, useEffect, useRef, useState } from "react";
import { MotionAnalyzer } from "../lib/motion/motionAnalyzer";
import { createPoseDetector } from "../lib/motion/poseDetector";
import {
  DEFAULT_MOTION_SETTINGS,
  DEFAULT_MOTION_SNAPSHOT,
  type MotionSettings,
  type WebcamMotionState,
} from "../lib/motion/types";

const sampleBrightness = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): number => {
  const width = 64;
  const height = 36;
  canvas.width = width;
  canvas.height = height;
  context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return 80;
  }

  context.drawImage(video, 0, 0, width, height);
  const image = context.getImageData(0, 0, width, height).data;
  let total = 0;
  for (let index = 0; index < image.length; index += 16) {
    total += (image[index] + image[index + 1] + image[index + 2]) / 3;
  }
  return total / (image.length / 16);
};

export interface WebcamMotionController extends WebcamMotionState {
  videoRef: React.RefObject<HTMLVideoElement>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  updateSetting: <K extends keyof MotionSettings>(
    key: K,
    value: MotionSettings[K],
  ) => void;
  triggerSyntheticAttack: (direction?: "left" | "right") => void;
}

export function useWebcamMotion(): WebcamMotionController {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stateRef = useRef<WebcamMotionState>({
    status: "idle",
    error: null,
    streamActive: false,
    permission: "unknown",
    fps: 0,
    processingMs: 0,
    snapshot: DEFAULT_MOTION_SNAPSHOT,
    lastAttackEvent: null,
    settings: DEFAULT_MOTION_SETTINGS,
  });
  const [state, setState] = useState(stateRef.current);
  const detectorRef = useRef<Awaited<ReturnType<typeof createPoseDetector>> | null>(
    null,
  );
  const analyzerRef = useRef(new MotionAnalyzer());
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastProcessRef = useRef(0);
  const lastDeltaRef = useRef(0);
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const debugAttackId = useRef(9000);

  const commitState = useCallback(
    (updater: (current: WebcamMotionState) => WebcamMotionState) => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      setState(next);
    },
    [],
  );

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    detectorRef.current?.close();
    detectorRef.current = null;
    analyzerRef.current.reset();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    commitState((current) => ({
      ...current,
      status: "idle",
      streamActive: false,
      fps: 0,
      processingMs: 0,
      snapshot: DEFAULT_MOTION_SNAPSHOT,
    }));
  }, [commitState]);

  const triggerSyntheticAttack = useCallback(
    (direction: "left" | "right" = "right") => {
      debugAttackId.current += 1;
      commitState((current) => ({
        ...current,
        lastAttackEvent: {
          id: debugAttackId.current,
          ts: performance.now(),
          direction,
          distance: 0.16,
          speed: 1.42,
          confidence: 1,
          activeHand: direction === "right" ? "right" : "left",
          source: "debug",
        },
      }));
    },
    [commitState],
  );

  const updateSetting = useCallback(
    <K extends keyof MotionSettings>(key: K, value: MotionSettings[K]) => {
      commitState((current) => ({
        ...current,
        settings: {
          ...current.settings,
          [key]: value,
        },
      }));
    },
    [commitState],
  );

  const startLoop = useCallback(() => {
    const run = (rafTs: number) => {
      const video = videoRef.current;
      if (!video) {
        rafRef.current = requestAnimationFrame(run);
        return;
      }

      if (video.readyState >= 2 && rafTs - lastProcessRef.current > 1000 / 20) {
        const processingStarted = performance.now();
        const brightness = sampleBrightness(
          video,
          scratchCanvasRef.current ??= document.createElement("canvas"),
        );
        const pose = detectorRef.current?.detect(video, processingStarted) ?? null;
        const { snapshot, attack } = analyzerRef.current.update(
          pose,
          brightness,
          stateRef.current.settings,
        );
        lastDeltaRef.current = rafTs - lastProcessRef.current;
        lastProcessRef.current = rafTs;

        commitState((current) => ({
          ...current,
          status: current.status === "loading-model" ? "ready" : current.status,
          snapshot,
          lastAttackEvent: attack ?? current.lastAttackEvent,
          fps:
            lastDeltaRef.current > 0
              ? Math.round(1000 / lastDeltaRef.current)
              : current.fps,
          processingMs: Math.round((performance.now() - processingStarted) * 10) / 10,
        }));
      }

      rafRef.current = requestAnimationFrame(run);
    };

    rafRef.current = requestAnimationFrame(run);
  }, [commitState]);

  const startCamera = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      commitState((current) => ({
        ...current,
        status: "unsupported",
        error: "이 브라우저는 웹캠 API를 지원하지 않습니다.",
      }));
      return;
    }

    commitState((current) => ({
      ...current,
      status: "requesting",
      error: null,
    }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 540 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      commitState((current) => ({
        ...current,
        status: "loading-model",
        permission: "granted",
        streamActive: true,
      }));

      detectorRef.current = await createPoseDetector();
      startLoop();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "웹캠 또는 포즈 모델을 초기화하지 못했습니다.";

      commitState((current) => ({
        ...current,
        status: "error",
        permission: "denied",
        streamActive: false,
        error: message,
      }));
    }
  }, [commitState, startLoop]);

  useEffect(() => stopCamera, [stopCamera]);

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    updateSetting,
    triggerSyntheticAttack,
  };
}
