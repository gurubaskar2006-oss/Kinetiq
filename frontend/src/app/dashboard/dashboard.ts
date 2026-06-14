import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  sessions: any[] = [];

  constructor() {}

  ngOnInit() {
    this.fetchSessions();
  }

  async fetchSessions() {
    try {
      // Dummy fetch to represent integration with the backend API
      // In reality, this would use Angular's HttpClient with authorization headers
      const response = await fetch('http://localhost:8000/sessions', {
        headers: {
          'Authorization': 'Bearer placeholder_token'
        }
      });
      if (response.ok) {
        this.sessions = await response.json();
      } else {
        // Mock data for display purposes if backend is not reachable/auth fails
        this.sessions = [
          { exercise_type: 'Squat', reps: 15, quality_score: 92.5, created_at: new Date() },
          { exercise_type: 'Push-Up', reps: 20, quality_score: 88.0, created_at: new Date() }
        ];
      }
    } catch(err) {
       this.sessions = [
          { exercise_type: 'Squat', reps: 15, quality_score: 92.5, created_at: new Date() },
          { exercise_type: 'Push-Up', reps: 20, quality_score: 88.0, created_at: new Date() }
        ];
    }
  }
}
