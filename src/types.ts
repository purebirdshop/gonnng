export interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  estimatedHours?: number; // For the Sand tracker/Reality checking
}

export interface Phase {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Recipe {
  id: string; // Internal System ID (FR-001)
  publicId?: string; // Public Identifier (FR-002, Base62 e.g. T8PnZK4vx)
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  category: 'Humorous' | 'Practical' | 'Creative' | 'Educational' | 'Strategy';
  tags: string[];
  phases: {
    title: string;
    tasks: { title: string; estimatedHours?: number }[];
  }[];
  isCustom?: boolean;
  forkedFrom?: string; // Track original creator
  forkedFromInternalId?: string; // Parent Recipe Internal ID (FR-006)
  forkedFromPublicId?: string; // Parent Recipe Public ID (FR-006)
  gongsCount?: {
    continue: number;
    refine: number;
    reconsider: number;
  };
}

export interface Project {
  id: string; // Internal System ID (FR-001)
  publicId?: string; // Public Identifier (FR-002, Base62 e.g. F93LmQa8Y)
  title: string;
  recipeId: string;
  recipeTitle: string;
  phases: Phase[];
  createdAt: string;
  completedAt?: string;
  isCompleted?: boolean;
  collectionId?: string;
  privacy: 'public' | 'internal' | 'private';
  progressPhotos?: { url: string; caption: string; date: string }[];
  lastProgressShotAt?: string;
}

export interface Collection {
  id: string; // Internal System ID
  publicId?: string; // Public Identifier
  title: string;
  description: string;
  deadlineDate: string; // ISO date string
  projectIds: string[];
  workMode: 'sequential' | 'parallel' | 'hybrid';
  budgetedHours?: number; // Sand capacity
}

export interface Creator {
  id: string; // Internal System ID (FR-001)
  publicId?: string; // Public Identifier (FR-002)
  username?: string; // Unique username e.g. jasonburns (FR-005)
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  goals: string;
  privacyDefault: 'public' | 'internal' | 'private';
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  followsYou?: boolean;
  isInCircle?: boolean; // Mutual follow flag (isFollowing && followsYou)
}

export interface PostComment {
  id: string;
  publicId?: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  content: string;
  timeString: string;
  likes?: number;
  userLiked?: boolean;
  parentId?: string;
  replyToUser?: string;
}

export interface FeedPost {
  id: string; // Internal System ID (FR-001)
  publicId?: string; // Public Identifier (FR-002, Base62 e.g. B2FsQa81R)
  type: 'project_created' | 'task_completed' | 'project_completed' | 'progress_shot' | 'update_logged';
  userId: string;
  userName: string;
  username?: string; // Creator's unique username for profile URL resolution
  userAvatar: string;
  timeString: string;
  title: string;
  content?: string;
  attachedId?: string; // ID of referenced Project/Recipe
  attachedName?: string; // Name of referenced Project/Recipe
  image?: string;
  images?: string[];
  hashtags?: string[] | string;
  privacy: 'public' | 'internal' | 'private';
  createdAt?: string;
  gongs: {
    continue: number;
    refine: number;
    reconsider: number;
    userVoted?: 'continue' | 'refine' | 'reconsider';
  };
  comments?: PostComment[];
}
