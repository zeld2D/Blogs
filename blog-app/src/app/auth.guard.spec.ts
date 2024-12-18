import { inject, TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthGuard]
    });
  });

  beforeEach(inject([AuthGuard], (guard: AuthGuard) => {
    authGuard = guard;
  }));

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  // Add more tests for the guard's behavior
});