import { GOOGLE_CONFIG } from '../config/google';

export interface GoogleAuthToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

class GoogleAuthService {
  private token: GoogleAuthToken | null = null;

  constructor() {
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage(): void {
    try {
      const stored = localStorage.getItem('google_auth_token');
      if (stored) {
        this.token = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading token from storage:', error);
    }
  }

  private saveTokenToStorage(token: GoogleAuthToken): void {
    try {
      localStorage.setItem('google_auth_token', JSON.stringify(token));
      this.token = token;
    } catch (error) {
      console.error('Error saving token to storage:', error);
    }
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CONFIG.CLIENT_ID,
      redirect_uri: GOOGLE_CONFIG.REDIRECT_URI,
      scope: GOOGLE_CONFIG.SCOPES.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<GoogleAuthToken> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
          redirect_uri: GOOGLE_CONFIG.REDIRECT_URI,
          grant_type: 'authorization_code',
          code: code
        })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      const token: GoogleAuthToken = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000)
      };

      this.saveTokenToStorage(token);
      return token;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<GoogleAuthToken> {
    if (!this.token?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
          refresh_token: this.token.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const newToken: GoogleAuthToken = {
        access_token: data.access_token,
        refresh_token: this.token.refresh_token, // Keep existing refresh token
        expires_at: Date.now() + (data.expires_in * 1000)
      };

      this.saveTokenToStorage(newToken);
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  async getValidToken(): Promise<string> {
    if (!this.token) {
      throw new Error('No token available. Please authenticate first.');
    }

    // Check if token is expired (with 5 minute buffer)
    if (Date.now() >= (this.token.expires_at - 300000)) {
      await this.refreshToken();
    }

    return this.token.access_token;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  logout(): void {
    localStorage.removeItem('google_auth_token');
    this.token = null;
  }
}

export const googleAuth = new GoogleAuthService();