import type { PoseFrame } from "./types";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

export interface PoseDetector {
  detect(video: HTMLVideoElement, ts: number): PoseFrame | null;
  close(): void;
}

const normalize = (landmark?: { x: number; y: number; visibility?: number }) => ({
  x: landmark?.x ?? 0,
  y: landmark?.y ?? 0,
  score: landmark?.visibility ?? 0,
});

export async function createPoseDetector(): Promise<PoseDetector> {
  const vision = await import("@mediapipe/tasks-vision");
  const filesetResolver = await vision.FilesetResolver.forVisionTasks(WASM_URL);
  const detector = await vision.PoseLandmarker.createFromOptions(
    filesetResolver,
    {
      baseOptions: {
        modelAssetPath: MODEL_URL,
      },
      runningMode: "VIDEO",
      numPoses: 1,
    },
  );

  return {
    detect(video, ts) {
      const result = detector.detectForVideo(video, ts);
      const landmarks = result.landmarks?.[0];
      if (!landmarks) {
        return null;
      }

      return {
        ts,
        nose: normalize(landmarks[0]),
        leftShoulder: normalize(landmarks[11]),
        rightShoulder: normalize(landmarks[12]),
        leftElbow: normalize(landmarks[13]),
        rightElbow: normalize(landmarks[14]),
        leftWrist: normalize(landmarks[15]),
        rightWrist: normalize(landmarks[16]),
      };
    },
    close() {
      detector.close();
    },
  };
}
