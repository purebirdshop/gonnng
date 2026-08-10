import {
  Database,
  ProfileVisibility,
  RecipeVisibility,
  MediaType,
  FeedbackType
} from './lib/database.types';

export type { ProfileVisibility, RecipeVisibility, MediaType, FeedbackType };

// Database Row Interfaces
export type UserRow = Database['public']['Tables']['users']['Row'];
export type RecipeRow = Database['public']['Tables']['recipes']['Row'];
export type RecipePhaseRow = Database['public']['Tables']['recipe_phases']['Row'];
export type RecipeTaskRow = Database['public']['Tables']['recipe_tasks']['Row'];
export type RecipeBookmarkRow = Database['public']['Tables']['recipe_bookmarks']['Row'];
export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectPhaseRow = Database['public']['Tables']['project_phases']['Row'];
export type ProjectTaskRow = Database['public']['Tables']['project_tasks']['Row'];
export type PostRow = Database['public']['Tables']['posts']['Row'];
export type PostMediaRow = Database['public']['Tables']['post_media']['Row'];
export type PostFeedbackRow = Database['public']['Tables']['post_feedback']['Row'];
export type CommentRow = Database['public']['Tables']['comments']['Row'];
export type FollowRow = Database['public']['Tables']['follows']['Row'];
export type CircleRow = Database['public']['Views']['circles']['Row'];
export type DirectMessageRow = Database['public']['Tables']['direct_messages']['Row'];

// Domain Types for UI
export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  text: string;
  timestamp: string;
  createdAt?: number;
  isRead: boolean;
  status?: 'pending' | 'accepted';
  postThumbnail?: string;
  postId?: string;
}

export interface MessageThread {
  creator: Creator;
  messages: DirectMessage[];
  lastUpdated: number;
  unreadCount: number;
}
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  estimatedHours?: number;
  sourceTaskId?: string | null;
  position?: number;
}

export interface Phase {
  id: string;
  title: string;
  tasks: Task[];
  sourcePhaseId?: string | null;
  position?: number;
}

export interface RecipePhase {
  id?: string;
  title: string;
  position?: number;
  tasks: { id?: string; title: string; position?: number; estimatedHours?: number }[];
}

export interface Recipe {
  id: string;
  publicId?: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  category: string;
  tags: string[];
  phases: RecipePhase[];
  visibility?: RecipeVisibility;
  isCustom?: boolean;
  forkedFrom?: string;
  forkedFromInternalId?: string;
  forkedFromPublicId?: string;
  gongsCount?: {
    continue: number;
    refine: number;
    reconsider: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  publicId?: string;
  userId?: string;
  title: string;
  recipeId?: string;
  recipeTitle?: string;
  category?: string;
  phases: Phase[];
  createdAt: string;
  completedAt?: string;
  isCompleted?: boolean;
  collectionId?: string;
  privacy: ProfileVisibility;
  progressPhotos?: { url: string; caption: string; date: string; bucket?: string; path?: string }[];
  lastProgressShotAt?: string;
}

export interface Collection {
  id: string;
  publicId?: string;
  title: string;
  description: string;
  deadlineDate: string;
  projectIds: string[];
  workMode: 'sequential' | 'parallel' | 'hybrid';
  budgetedHours?: number;
}

export interface Creator {
  id: string;
  publicId?: string;
  username?: string;
  name: string;
  email: string;
  avatarUrl: string;
  avatarBucket?: string;
  avatarPath?: string;
  avatarStoragePath?: string;
  bio: string;
  goals: string;
  privacyDefault: ProfileVisibility;
  followersCount: number;
  followingCount: number;
  followerIds?: string[];
  followingIds?: string[];
  isFollowing?: boolean;
  followsYou?: boolean;
  isInCircle?: boolean;
  allowedEnvironments?: string[];
}

export interface PostComment {
  id: string;
  publicId?: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  body?: string;
  content: string;
  timeString: string;
  likes?: number;
  userLiked?: boolean;
  parentId?: string | null;
  replyToUser?: string;
  createdAt?: string;
  children?: PostComment[];
}

export interface PostMediaItem {
  id: string;
  postId?: string;
  storageBucket: string;
  storagePath: string;
  mediaType: MediaType;
  position: number;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  resolvedUrl?: string;
}

export interface FeedPost {
  id: string;
  publicId?: string;
  type: 'project_created' | 'task_completed' | 'project_completed' | 'progress_shot' | 'update_logged';
  userId: string;
  userName: string;
  username?: string;
  userAvatar: string;
  timeString: string;
  title: string;
  content?: string;
  description?: string;
  attachedId?: string;
  attachedName?: string;
  projectId?: string | null;
  image?: string;
  images?: string[];
  media?: PostMediaItem[];
  mediaFiles?: File[];
  hashtags?: string[] | string;
  privacy: ProfileVisibility;
  createdAt?: string;
  gongs: {
    continue: number;
    refine: number;
    reconsider: number;
    userVoted?: 'continue' | 'refine' | 'reconsider' | FeedbackType;
  };
  comments?: PostComment[];
}
