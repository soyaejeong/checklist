import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockSupabaseClient } from '../../helpers/mock-supabase';
import { SupabaseAuthService } from '@/services/implementations/supabase-auth-service';

describe('SupabaseAuthService', () => {
  describe('getCurrentUser()', () => {
    it('returns { id, isAnonymous } when session exists', async () => {
      const mockClient = createMockSupabaseClient({
        authUser: { id: 'user-123', is_anonymous: true },
      });
      const service = new SupabaseAuthService(mockClient as never);
      const user = await service.getCurrentUser();
      expect(user).toEqual({ id: 'user-123', isAnonymous: true });
    });

    it('returns null when no session', async () => {
      const mockClient = createMockSupabaseClient({ authUser: null });
      const service = new SupabaseAuthService(mockClient as never);
      const user = await service.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('signInAnonymously()', () => {
    it('calls Supabase auth signInAnonymously method successfully', async () => {
      const mockClient = createMockSupabaseClient();
      const signInSpy = vi.spyOn(mockClient.auth, 'signInAnonymously');
      const service = new SupabaseAuthService(mockClient as never);
      await service.signInAnonymously();
      expect(signInSpy).toHaveBeenCalledOnce();
    });

    it('retries up to 3 times with exponential backoff on failure', async () => {
      vi.useFakeTimers();
      let callCount = 0;
      const mockClient = createMockSupabaseClient();
      mockClient.auth.signInAnonymously = async () => {
        callCount++;
        if (callCount < 3) {
          return { data: { user: null, session: null }, error: { message: 'fail', status: 500 } as never };
        }
        return { data: { user: { id: 'u1' }, session: {} }, error: null } as never;
      };

      const service = new SupabaseAuthService(mockClient as never);
      const promise = service.signInAnonymously();

      // First retry after ~1000ms
      await vi.advanceTimersByTimeAsync(1000);
      // Second retry after ~2000ms
      await vi.advanceTimersByTimeAsync(2000);

      await promise;
      expect(callCount).toBe(3);
      vi.useRealTimers();
    });

    it('throws after all 3 retries exhausted', async () => {
      vi.useFakeTimers();
      let callCount = 0;
      const mockClient = createMockSupabaseClient();
      mockClient.auth.signInAnonymously = async () => {
        callCount++;
        return { data: { user: null, session: null }, error: { message: 'auth failed', status: 500 } as never };
      };

      const service = new SupabaseAuthService(mockClient as never);
      const promise = service.signInAnonymously().catch((e) => e);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      const error = await promise;
      expect(error).toBeDefined();
      expect(callCount).toBe(3);
      vi.useRealTimers();
    });
  });

  describe('signOut()', () => {
    it('calls Supabase signOut', async () => {
      const mockClient = createMockSupabaseClient();
      const signOutSpy = vi.spyOn(mockClient.auth, 'signOut');
      const service = new SupabaseAuthService(mockClient as never);
      await service.signOut();
      expect(signOutSpy).toHaveBeenCalledOnce();
    });
  });

  describe('upgradeToEmail()', () => {
    it('calls Supabase updateUser with email and password', async () => {
      const mockClient = createMockSupabaseClient();
      const updateSpy = vi.spyOn(mockClient.auth, 'updateUser');
      const service = new SupabaseAuthService(mockClient as never);
      await service.upgradeToEmail('test@example.com', 'password123');
      expect(updateSpy).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    });
  });

  describe('onAuthStateChange()', () => {
    it('subscribes and returns unsubscribe function', () => {
      const mockClient = createMockSupabaseClient();
      const service = new SupabaseAuthService(mockClient as never);
      const cb = vi.fn();
      const unsubscribe = service.onAuthStateChange(cb);
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
