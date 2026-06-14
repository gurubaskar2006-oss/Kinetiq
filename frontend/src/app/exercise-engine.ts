import { Injectable } from '@angular/core';
import { PoseLandmark } from './models';

@Injectable({
  providedIn: 'root',
})
export class ExerciseEngine {
  // Squat FSM: STANDING -> DESCENDING -> BOTTOM -> ASCENDING
  squatState: 'STANDING' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING' = 'STANDING';
  squatReps = 0;
  pushupState = 'up';
  pushupReps = 0;

  // Real-time metrics
  currentSquatDepth = 180;
  minSquatDepth = 180; // track the lowest angle reached in current rep

  // Risk Flags
  riskFlags: string[] = [];

  // Analytics aggregation
  sessionAngles: number[] = [];
  sessionDepths: number[] = [];

  constructor() {}

  calculateAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  }

  detectSquat(landmarks: PoseLandmark[]) {
    // MediaPipe landmarks:
    // Left: 23=hip, 25=knee, 27=ankle
    // Right: 24=hip, 26=knee, 28=ankle
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const leftAnkle = landmarks[27];
    const rightHip = landmarks[24];
    const rightKnee = landmarks[26];
    const rightAnkle = landmarks[28];
    const leftShoulder = landmarks[11];

    if (leftHip && leftKnee && leftAnkle && rightHip && rightKnee && rightAnkle && leftShoulder) {
      const leftAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
      const avgAngle = (leftAngle + rightAngle) / 2;

      this.currentSquatDepth = avgAngle;

      // Update Risk Detection
      this.detectSquatRisks(leftHip, leftKnee, leftAnkle, leftShoulder, avgAngle);

      // FSM Logic
      switch (this.squatState) {
        case 'STANDING':
          if (avgAngle < 160) {
            this.squatState = 'DESCENDING';
            this.minSquatDepth = avgAngle;
          }
          break;
        case 'DESCENDING':
          if (avgAngle < this.minSquatDepth) {
            this.minSquatDepth = avgAngle;
          }
          if (avgAngle < 90) {
             this.squatState = 'BOTTOM';
          } else if (avgAngle > 160) {
             // Aborted rep
             this.squatState = 'STANDING';
          }
          break;
        case 'BOTTOM':
          if (avgAngle > 100) {
            this.squatState = 'ASCENDING';
          }
          break;
        case 'ASCENDING':
          if (avgAngle > 160) {
            this.squatState = 'STANDING';
            this.squatReps += 1;
            this.sessionDepths.push(this.minSquatDepth);

            // Post-rep risk check: Shallow Squat
            if (this.minSquatDepth > 100 && !this.riskFlags.includes('Shallow Squat')) {
               this.riskFlags.push('Shallow Squat');
            }
          } else if (avgAngle < 90) {
            // Went back down before fully standing
            this.squatState = 'BOTTOM';
          }
          break;
      }
    }
    return this.squatReps;
  }

  detectSquatRisks(hip: PoseLandmark, knee: PoseLandmark, ankle: PoseLandmark, shoulder: PoseLandmark, depthAngle: number) {
      // 1. Knee Valgus (Knee collapsing inward)
      // Simplified: if knee x is significantly inside hip x relative to ankle
      // (This is a 2D proxy; true valgus requires 3D or proper camera angle)
      if (this.squatState === 'BOTTOM' || this.squatState === 'DESCENDING') {
         // Assuming user faces camera, if knee.x is between the hips too much...
         // For a profile view, knee should track over toes.
         // We will add a placeholder logic here that represents the calculation
         const kneeHipDiff = Math.abs(hip.x - knee.x);
         if (kneeHipDiff > 0.15 && !this.riskFlags.includes('Knee Valgus (Proxy)')) {
             this.riskFlags.push('Knee Valgus (Proxy)');
         }
      }

      // 2. Forward Lean (Trunk angle relative to vertical)
      // Calculate angle between shoulder, hip, and vertical line
      const verticalRef = { x: hip.x, y: hip.y - 0.5, z: hip.z, visibility: 1.0 };
      const trunkAngle = this.calculateAngle(shoulder, hip, verticalRef);
      if (trunkAngle > 45 && this.squatState !== 'STANDING' && !this.riskFlags.includes('Excessive Forward Lean')) {
          this.riskFlags.push('Excessive Forward Lean');
      }
  }

  detectPushUp(landmarks: PoseLandmark[]) {
    // MediaPipe landmarks: 11=left shoulder, 13=left elbow, 15=left wrist
    const shoulder = landmarks[11];
    const elbow = landmarks[13];
    const wrist = landmarks[15];

    if (shoulder && elbow && wrist) {
      const angle = this.calculateAngle(shoulder, elbow, wrist);

      if (angle > 160) {
        this.pushupState = 'up';
      }
      if (angle < 90 && this.pushupState === 'up') {
        this.pushupState = 'down';
        this.pushupReps += 1;
      }
    }
    return this.pushupReps;
  }

  evaluateForm(landmarks: PoseLandmark[]): number {
    // Dynamic Quality Score Calculation

    // 1. Range of Motion (30%): Based on average depth reached
    let avgDepth = 180;
    if (this.sessionDepths.length > 0) {
        avgDepth = this.sessionDepths.reduce((a, b) => a + b, 0) / this.sessionDepths.length;
    }
    // Perfect depth is < 90. Baseline is 160.
    let romScore = 100 - Math.max(0, (avgDepth - 80)); // 80 is 100%, 180 is 0%
    romScore = Math.max(0, Math.min(100, romScore));

    // 2. Posture Accuracy (40%): Penalized by risk flags
    let postureScore = 100;
    if (this.riskFlags.includes('Excessive Forward Lean')) postureScore -= 20;
    if (this.riskFlags.includes('Knee Valgus (Proxy)')) postureScore -= 20;
    postureScore = Math.max(0, postureScore);

    // 3. Balance (20%): Placeholder for symmetry
    const balanceScore = 85;

    // 4. Consistency (10%): Based on standard deviation of depth
    let consistencyScore = 90;
    if (this.sessionDepths.length > 1) {
        const mean = avgDepth;
        const variance = this.sessionDepths.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / this.sessionDepths.length;
        const stdDev = Math.sqrt(variance);
        consistencyScore = 100 - (stdDev * 2); // Deduct points for high variance
        consistencyScore = Math.max(0, Math.min(100, consistencyScore));
    }

    const overallScore =
      (postureScore * 0.40) +
      (romScore * 0.30) +
      (balanceScore * 0.20) +
      (consistencyScore * 0.10);

    return overallScore;
  }

  getRiskFlags(): string[] {
      return this.riskFlags;
  }

  getAverageROM(): number {
      if (this.sessionDepths.length === 0) return 0;
      return this.sessionDepths.reduce((a, b) => a + b, 0) / this.sessionDepths.length;
  }

  resetSession() {
      this.squatReps = 0;
      this.pushupReps = 0;
      this.squatState = 'STANDING';
      this.pushupState = 'up';
      this.riskFlags = [];
      this.sessionDepths = [];
      this.sessionAngles = [];
  }
}
