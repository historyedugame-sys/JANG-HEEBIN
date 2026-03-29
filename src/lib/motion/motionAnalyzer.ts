import {
  DEFAULT_MOTION_SNAPSHOT,
  type AttackEvent,
  type MotionSettings,
  type MotionSnapshot,
  type PoseFrame,
} from "./types";

interface Point {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export class MotionAnalyzer {
  private lastPose: PoseFrame | null = null;

  private lastAttackAt = 0;

  private attackId = 0;

  private readyStartedAt: number | null = null;

  private readyAnchor: Point | null = null;

  private recoverUntil = 0;

  private smoothedWrist: Point | null = null;

  reset() {
    this.lastPose = null;
    this.lastAttackAt = 0;
    this.readyStartedAt = null;
    this.readyAnchor = null;
    this.recoverUntil = 0;
    this.smoothedWrist = null;
  }

  update(
    pose: PoseFrame | null,
    brightness: number,
    settings: MotionSettings,
  ): { snapshot: MotionSnapshot; attack: AttackEvent | null } {
    const effectiveMinVelocity = settings.minVelocity / settings.sensitivity;
    const effectiveMinTravel = settings.minTravel / settings.sensitivity;

    if (!pose) {
      return {
        snapshot: {
          ...DEFAULT_MOTION_SNAPSHOT,
          state: "lost",
          brightness,
          lightingWarning: brightness < 52,
        },
        attack: null,
      };
    }

    const wristKey =
      pose.rightWrist.score >= pose.leftWrist.score ? "rightWrist" : "leftWrist";
    const shoulderKey =
      wristKey === "rightWrist" ? "rightShoulder" : "leftShoulder";
    const activeHand = wristKey === "rightWrist" ? "right" : "left";
    const wrist = pose[wristKey];
    const shoulder = pose[shoulderKey];

    if (wrist.score < 0.35 || shoulder.score < 0.35) {
      return {
        snapshot: {
          ...DEFAULT_MOTION_SNAPSHOT,
          state: "lost",
          activeHand,
          brightness,
          lightingWarning: brightness < 52,
        },
        attack: null,
      };
    }

    const alpha = clamp(1 - settings.smoothing, 0.18, 0.86);
    if (!this.smoothedWrist) {
      this.smoothedWrist = { x: wrist.x, y: wrist.y };
    } else {
      this.smoothedWrist = {
        x: this.smoothedWrist.x + (wrist.x - this.smoothedWrist.x) * alpha,
        y: this.smoothedWrist.y + (wrist.y - this.smoothedWrist.y) * alpha,
      };
    }

    const previous = this.lastPose;
    this.lastPose = pose;

    if (!previous) {
      return {
        snapshot: {
          ...DEFAULT_MOTION_SNAPSHOT,
          activeHand,
          confidence: wrist.score,
          brightness,
          lightingWarning: brightness < 52,
          trackingWarning: false,
          wrist: this.smoothedWrist,
          shoulder: { x: shoulder.x, y: shoulder.y },
        },
        attack: null,
      };
    }

    const previousWrist = previous[wristKey];
    const dt = Math.max(16, pose.ts - previous.ts);
    const dx = this.smoothedWrist.x - previousWrist.x;
    const dy = this.smoothedWrist.y - previousWrist.y;
    const speed = Math.hypot(dx, dy) / (dt / 1000);
    const relativeX = this.smoothedWrist.x - shoulder.x;
    const relativeY = this.smoothedWrist.y - shoulder.y;
    const nearShoulder =
      Math.abs(relativeX) <= settings.readyZoneX &&
      Math.abs(relativeY) <= settings.readyZoneY &&
      speed < effectiveMinVelocity * 0.75;

    if (nearShoulder) {
      if (this.readyStartedAt === null) {
        this.readyStartedAt = pose.ts;
        this.readyAnchor = { x: this.smoothedWrist.x, y: this.smoothedWrist.y };
      }
    } else if (speed < effectiveMinVelocity * 0.33) {
      this.readyStartedAt = null;
      this.readyAnchor = null;
    }

    const readyProgress =
      this.readyStartedAt === null
        ? 0
        : clamp((pose.ts - this.readyStartedAt) / settings.readyHoldMs, 0, 1);

    const anchor = this.readyAnchor ?? { x: shoulder.x, y: shoulder.y };
    const travelDistance = distance(anchor, this.smoothedWrist);

    let direction: MotionSnapshot["vector"]["direction"] = "unknown";
    if (Math.abs(dx) > Math.abs(dy) * 1.2) {
      direction = dx >= 0 ? "right" : "left";
    } else if (Math.abs(dy) > 0.012) {
      direction = dy >= 0 ? "down" : "up";
    }

    const confidence = Math.min(wrist.score, shoulder.score);
    const trackingWarning = confidence < 0.45;
    const lightingWarning = brightness < 52;
    const isRecovering = pose.ts < this.recoverUntil;

    let attack: AttackEvent | null = null;
    if (
      readyProgress >= 1 &&
      !isRecovering &&
      pose.ts - this.lastAttackAt >= settings.cooldownMs &&
      travelDistance >= effectiveMinTravel &&
      speed >= effectiveMinVelocity &&
      (direction === "right" || direction === "left")
    ) {
      this.attackId += 1;
      this.lastAttackAt = pose.ts;
      this.recoverUntil = pose.ts + settings.cooldownMs;
      this.readyStartedAt = null;
      this.readyAnchor = null;
      attack = {
        id: this.attackId,
        ts: pose.ts,
        direction,
        distance: travelDistance,
        speed,
        confidence,
        activeHand,
        source: "camera",
      };
    }

    return {
      snapshot: {
        state: isRecovering
          ? "recover"
          : readyProgress >= 1
            ? "strikeWindow"
            : readyProgress > 0
              ? "ready"
              : "idle",
        activeHand,
        vector: {
          dx,
          dy,
          speed,
          distance: travelDistance,
          direction,
        },
        confidence,
        readyProgress,
        lightingWarning,
        trackingWarning,
        brightness,
        wrist: this.smoothedWrist,
        shoulder: { x: shoulder.x, y: shoulder.y },
      },
      attack,
    };
  }
}
