import { UserSession, ProjectItem, FeedPost } from '../types';

// Default backend URL pointing to the Gonnng REST API
// In production, update this to your deployed API domain URL
// let API_BASE_URL = 'https://ais-dev-w7pyuadwxq5gwkpazt2wgu-566264457486.us-west2.run.app';
let API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const setApiBaseUrl = (url: string) => {
  API_BASE_URL = url.endsWith('/') ? url.slice(0, -1) : url;
};

export const getApiBaseUrl = () => API_BASE_URL;

export const mobileApi = {
  async checkHealth(): Promise<{ status: string; environment?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      return await res.json();
    } catch {
      return { status: 'offline' };
    }
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: UserSession; error?: string }> {
    try {
      console.log('API_BASE_URL:', API_BASE_URL);

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network connection error' };
    }
  },

  async getProjects(): Promise<ProjectItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`);
      if (res.ok) {
        const data = await res.json();
        return data.projects || [];
      }
      return [];
    } catch {
      return [];
    }
  },

  async getFeed(): Promise<FeedPost[]> {
    return [
      {
        id: '1',
        creatorName: 'Aria Chen',
        creatorHandle: '@aria',
        title: 'Building a Solar Micro-Garden Controller',
        content: 'Just finished tuning the telemetry sensor loop for moisture reading.',
        timestamp: '2h ago',
        likesCount: 24,
        commentsCount: 5,
      },
      {
        id: '2',
        creatorName: 'Marcus Vance',
        creatorHandle: '@marcus',
        title: 'Custom Ceramic Glaze Formulator',
        content: 'Recipe updated with cobalt carbonate reduction specs!',
        timestamp: '5h ago',
        likesCount: 42,
        commentsCount: 12,
      }
    ];
  }
};
