import { TestBed } from '@angular/core/testing';

import { ExerciseEngine } from './exercise-engine';

describe('ExerciseEngine', () => {
  let service: ExerciseEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExerciseEngine);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
