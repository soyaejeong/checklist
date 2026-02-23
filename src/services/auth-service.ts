export interface AuthService {
  getCurrentUser(): Promise<{ id: string; isAnonymous: boolean } | null>;
  signInAnonymously(): Promise<void>;
  upgradeToEmail(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChange(
    cb: (user: { id: string; isAnonymous: boolean } | null) => void,
  ): () => void;
}
