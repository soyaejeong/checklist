import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthService } from '@/services/auth-service';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

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
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { error } = await this.client.auth.signInAnonymously();
      if (!error) return;

      lastError = error;
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  async upgradeToEmail(email: string, password: string): Promise<void> {
    const { error } = await this.client.auth.updateUser({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  onAuthStateChange(
    cb: (user: { id: string; isAnonymous: boolean } | null) => void,
  ): () => void {
    const {
      data: { subscription },
    } = this.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        cb({
          id: session.user.id,
          isAnonymous: (session.user as { is_anonymous?: boolean }).is_anonymous ?? false,
        });
      } else {
        cb(null);
      }
    });

    return () => subscription.unsubscribe();
  }
}
