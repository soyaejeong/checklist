import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthService } from '@/services/auth-service';

export class SupabaseAuthService implements AuthService {
  constructor(private client: SupabaseClient) {}

  async getCurrentUser(): Promise<{ id: string; isAnonymous: boolean } | null> {
    const {
      data: { user },
    } = await this.client.auth.getUser();

    if (!user) return null;

    return { id: user.id, isAnonymous: user.is_anonymous ?? false };
  }

  async signInAnonymously(): Promise<void> {
    const { error } = await this.client.auth.signInAnonymously();
    if (error) throw error;
  }

  async upgradeToEmail(_email: string, _password: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async signOut(): Promise<void> {
    throw new Error('Not implemented');
  }

  onAuthStateChange(
    _cb: (user: { id: string; isAnonymous: boolean } | null) => void,
  ): () => void {
    throw new Error('Not implemented');
  }
}
