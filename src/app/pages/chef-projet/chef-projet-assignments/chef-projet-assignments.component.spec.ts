import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChefProjetAssignmentsComponent } from './chef-projet-assignments.component';

describe('ChefProjetAssignmentsComponent', () => {
  let component: ChefProjetAssignmentsComponent;
  let fixture: ComponentFixture<ChefProjetAssignmentsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChefProjetAssignmentsComponent]
    });
    fixture = TestBed.createComponent(ChefProjetAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
