import { Component, ElementRef, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pose, Results, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { ExerciseEngine } from '../exercise-engine';

@Component({
  selector: 'app-pose-detector',
  imports: [CommonModule],
  templateUrl: './pose-detector.html',
  styleUrl: './pose-detector.scss',
})
export class PoseDetector implements AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  pose!: Pose;
  camera!: Camera;

  private exerciseEngine = inject(ExerciseEngine);

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

    // Send landmarks to Exercise Engine Service
    this.squatReps = this.exerciseEngine.detectSquat(results.poseLandmarks);
    this.pushupReps = this.exerciseEngine.detectPushUp(results.poseLandmarks);
    this.qualityScore = this.exerciseEngine.evaluateForm(results.poseLandmarks);
  }
}
