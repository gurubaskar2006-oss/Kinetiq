import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExerciseEngine {
  squatState = 'up';
  squatReps = 0;
  pushupState = 'up';
  pushupReps = 0;

  constructor() {}

  calculateAngle(a: any, b: any, c: any): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  }

  detectSquat(landmarks: any[]) {
    // MediaPipe landmarks: 23=left hip, 25=left knee, 27=left ankle
    const hip = landmarks[23];
    const knee = landmarks[25];
    const ankle = landmarks[27];

    if (hip && knee && ankle) {
      const angle = this.calculateAngle(hip, knee, ankle);

      if (angle > 160) {
        this.squatState = 'up';
      }
      if (angle < 90 && this.squatState === 'up') {
        this.squatState = 'down';
        this.squatReps += 1;
      }
    }
    return this.squatReps;
  }

  detectPushUp(landmarks: any[]) {
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

  evaluateForm(landmarks: any[]): number {
    // Placeholder implementation for a weighted score based on rules
    // Posture Accuracy: 40%
    // Range of Motion: 30%
    // Balance: 20%
    // Consistency: 10%

    // In a real implementation, these would dynamically calculate
    // based on continuous tracking of the landmarks array
    const postureScore = 88;
    const romScore = 92;
    const balanceScore = 84;
    const consistencyScore = 90;

    const overallScore =
      (postureScore * 0.40) +
      (romScore * 0.30) +
      (balanceScore * 0.20) +
      (consistencyScore * 0.10);

    return overallScore;
  }
}
