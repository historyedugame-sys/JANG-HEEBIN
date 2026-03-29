export type DetectorStatus =
  | "idle"
  | "requesting"
  | "camera-ready"
  | "loading-model"
  | "ready"
  | "error"
  | "unsupported";

export type MotionState = "idle" | "ready" | "strikeWindow" | "recover" | "lost";

export interface Joint2D {
  x: number;
  y: number;
  score: number;
}

export interface PoseFrame {
  ts: number;
  leftShoulder: Joint2D;
  rightShoulder: Joint2D;
  leftElbow: Joint2D;
  rightElbow: Joint2D;
  leftWrist: Joint2D;
  rightWrist: Joint2D;
  nose: Joint2D;
}

export interface MotionVector {
  dx: number;
  dy: number;
  speed: number;
  distance: number;
  direction: "left" | "right" | "up" | "down" | "unknown";
}

export interface AttackEvent {
  id: number;
  ts: number;
  direction: "left" | "right";
  distance: number;
  speed: number;
  confidence: number;
  activeHand: "left" | "right";
  source: "camera" | "debug";
}

export interface MotionSnapshot {
  state: MotionState;
  activeHand: "left" | "right";
  vector: MotionVector;
  confidence: number;
  readyProgress: number;
  lightingWarning: boolean;
  trackingWarning: boolean;
  brightness: number;
  wrist: { x: number; y: number } | null;
  shoulder: { x: number; y: number } | null;
}

export interface MotionSettings {
  sensitivity: number;
  minTravel: number;
  minVelocity: number;
  readyHoldMs: number;
  smoothing: number;
  cooldownMs: number;
  readyZoneX: number;
  readyZoneY: number;
}

export interface WebcamMotionState {
  status: DetectorStatus;
  error: string | null;
  streamActive: boolean;
  permission: "unknown" | "granted" | "denied";
  fps: number;
  processingMs: number;
  snapshot: MotionSnapshot;
  lastAttackEvent: AttackEvent | null;
  settings: MotionSettings;
}

export const DEFAULT_MOTION_SETTINGS: MotionSettings = {
  sensitivity: 1,
  minTravel: 0.075,
  minVelocity: 0.95,
  readyHoldMs: 180,
  smoothing: 0.38,
  cooldownMs: 540,
  readyZoneX: 0.12,
  readyZoneY: 0.12,
};

export const DEFAULT_MOTION_SNAPSHOT: MotionSnapshot = {
  state: "idle",
  activeHand: "right",
  vector: {
    dx: 0,
    dy: 0,
    speed: 0,
    distance: 0,
    direction: "unknown",
  },
  confidence: 0,
  readyProgress: 0,
  lightingWarning: false,
  trackingWarning: true,
  brightness: 0,
  wrist: null,
  shoulder: null,
};
