import { Component, ElementRef, ViewChild, AfterViewInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Pose, Results, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { ExerciseEngine } from '../exercise-engine';

@Component({
  selector: 'app-pose-detector',
  imports: [CommonModule],
  templateUrl: './pose-detector.html',
  styleUrl: './pose-detector.scss',
})
export class PoseDetector implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  pose!: Pose;
  camera!: Camera;

  private exerciseEngine = inject(ExerciseEngine);
  private router = inject(Router);
  private replayData: any[] = [];
  private sessionStartTime: number = 0;

  squatReps = 0;
  pushupReps = 0;
  qualityScore = 0;

  async ngAfterViewInit() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        this.videoElement.nativeElement.srcObject = stream;
        this.sessionStartTime = Date.now();
        this.initPoseDetection();
      } else {
         console.warn("getUserMedia is not supported or not available in this environment");
      }
    } catch (err) {
      console.error("Error accessing webcam: ", err);
    }
  }

  initPoseDetection() {
    this.pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    this.pose.setOptions({
      modelComplexity: 2, // HEAVY
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.pose.onResults((results: Results) => this.onResults(results));

    const video = this.videoElement.nativeElement;
    this.camera = new Camera(video, {
      onFrame: async () => {
        await this.pose.send({image: video});
      },
      width: 640,
      height: 480
    });
    this.camera.start();
  }

  onResults(results: Results) {
    if (!results.poseLandmarks) {
      return;
    }

    // Store frames for replay
    // To save memory, we can sample every N frames, but for now we store all.
    this.replayData.push(results.poseLandmarks);

    // Send landmarks to Exercise Engine Service
    this.squatReps = this.exerciseEngine.detectSquat(results.poseLandmarks);
    this.pushupReps = this.exerciseEngine.detectPushUp(results.poseLandmarks);
    this.qualityScore = this.exerciseEngine.evaluateForm(results.poseLandmarks);
  }

  async stopWorkout() {
    if (this.camera) {
      this.camera.stop();
    }

    const durationSec = (Date.now() - this.sessionStartTime) / 1000;
    const exerciseType = this.squatReps >= this.pushupReps ? 'Squat' : 'Push-Up';
    const reps = Math.max(this.squatReps, this.pushupReps);
    const riskFlags = this.exerciseEngine.getRiskFlags();
    const averageRom = this.exerciseEngine.getAverageROM();

    const payload = {
      exercise_type: exerciseType,
      reps: reps,
      quality_score: this.qualityScore,
      duration: durationSec,
      average_rom: averageRom,
      average_balance: 85.0, // Placeholder
      risk_flags: riskFlags,
      exercise_version: "v2.0",
      replay_data: this.replayData
    };

    try {
       // Since auth isn't fully wired on the frontend side, we'll try to POST.
       // It will fail without a token, but the structure is correct.
       const response = await fetch('http://localhost:8000/sessions', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': 'Bearer placeholder'
         },
         body: JSON.stringify(payload)
       });
       console.log('Workout saved:', response.status);
    } catch (err) {
       console.error('Failed to save workout', err);
    }

    this.exerciseEngine.resetSession();
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy() {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.pose) {
      this.pose.close();
    }
  }
}
