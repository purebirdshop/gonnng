export interface UserSession {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  role?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'In Progress' | 'Completed' | 'Idea';
  createdAt: string;
  recipeCount?: number;
}

export interface FeedPost {
  id: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar?: string;
  title: string;
  content: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
}
