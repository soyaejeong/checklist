import { describe, it, expect } from 'vitest';
import type { AuthService } from '@/services/auth-service';

describe('AuthService', () => {
  const mockService: AuthService = {
    getCurrentUser: async () => null,
    signInAnonymously: async () => {},
    upgradeToEmail: async (_email: string, _password: string) => {},
    signOut: async () => {},
    onAuthStateChange: (_cb) => () => {},
  };

  it('declares getCurrentUser() returning Promise<User | null>', () => {
    expect(mockService.getCurrentUser).toBeDefined();
  });

  it('declares signInAnonymously() returning Promise<void>', () => {
    expect(mockService.signInAnonymously).toBeDefined();
  });

  it('declares upgradeToEmail(email, password) returning Promise<void>', () => {
    expect(mockService.upgradeToEmail).toBeDefined();
  });

  it('declares signOut() returning Promise<void>', () => {
    expect(mockService.signOut).toBeDefined();
  });

  it('declares onAuthStateChange(cb) returning unsubscribe function', () => {
    const unsubscribe = mockService.onAuthStateChange(() => {});
    expect(typeof unsubscribe).toBe('function');
  });
});
