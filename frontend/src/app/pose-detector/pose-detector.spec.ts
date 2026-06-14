import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoseDetector } from './pose-detector';

describe('PoseDetector', () => {
  let component: PoseDetector;
  let fixture: ComponentFixture<PoseDetector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoseDetector],
    }).compileComponents();

    fixture = TestBed.createComponent(PoseDetector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
