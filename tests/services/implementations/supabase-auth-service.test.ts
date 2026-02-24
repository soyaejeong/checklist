import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      const mockClient = createMockSupabaseClient({
        authUser: null,
      });

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
  });
});
