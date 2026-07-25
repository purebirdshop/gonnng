import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Creator, FeedPost, Recipe, Collection, Project } from '../types';
import {
  INITIAL_CREATORS,
  INITIAL_FEED_POSTS,
  INITIAL_RECIPES,
  INITIAL_COLLECTIONS,
  INITIAL_PROJECTS
} from '../data/initialData';

// LOCAL STORAGE FALLBACK KEYS
const KEYS = {
  CREATORS: 'gonnng_creators',
  POSTS: 'gonnng_posts',
  RECIPES: 'gonnng_recipes',
  COLLECTIONS: 'gonnng_collections',
  PROJECTS: 'gonnng_projects'
};

// HELPER FOR LOCAL STORAGE READ/WRITE
function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write ${key} to localStorage:`, err);
  }
}

// Data Service API
export const dataService = {
  // Check active data mode
  isSupabaseActive(): boolean {
    return isSupabaseConfigured();
  },

  // --- CREATORS ---
  async getCreators(): Promise<Creator[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('creators').select('*');
      if (!error && data && data.length > 0) {
        return data.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email || '',
          avatarUrl: row.avatar_url || '',
          bio: row.bio || '',
          goals: row.goals || '',
          privacyDefault: row.privacy_default || 'public',
          followersCount: row.followers_count ?? 0,
          followingCount: row.following_count ?? 0,
          isFollowing: row.is_following ?? false,
          followsYou: row.follows_you ?? false,
          isInCircle: (row.is_following ?? false) && (row.follows_you ?? false)
        }));
      }
    }
    return getLocal<Creator[]>(KEYS.CREATORS, INITIAL_CREATORS);
  },

  async saveCreators(creators: Creator[]): Promise<void> {
    setLocal(KEYS.CREATORS, creators);
    if (isSupabaseConfigured() && supabase) {
      const rows = creators.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        avatar_url: c.avatarUrl,
        bio: c.bio,
        goals: c.goals,
        privacy_default: c.privacyDefault,
        followers_count: c.followersCount,
        following_count: c.followingCount,
        is_following: c.isFollowing ?? false,
        follows_you: c.followsYou ?? false,
        is_in_circle: (c.isFollowing ?? false) && (c.followsYou ?? false)
      }));
      await supabase.from('creators').upsert(rows);
    }
  },

  // --- FEED POSTS ---
  async getPosts(): Promise<FeedPost[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(row => ({
          id: row.id,
          type: row.type,
          userId: row.user_id,
          userName: row.user_name,
          userAvatar: row.user_avatar,
          timeString: row.time_string,
          title: row.title,
          content: row.content,
          attachedId: row.attached_id,
          attachedName: row.attached_name,
          image: row.image,
          privacy: row.privacy,
          gongs: row.gongs || { continue: 0, refine: 0, reconsider: 0 },
          comments: row.comments || []
        }));
      }
    }
    return getLocal<FeedPost[]>(KEYS.POSTS, INITIAL_FEED_POSTS);
  },

  async savePosts(posts: FeedPost[]): Promise<void> {
    setLocal(KEYS.POSTS, posts);
    if (isSupabaseConfigured() && supabase) {
      const rows = posts.map(p => ({
        id: p.id,
        type: p.type,
        user_id: p.userId,
        user_name: p.userName,
        user_avatar: p.userAvatar,
        time_string: p.timeString,
        title: p.title,
        content: p.content,
        attached_id: p.attachedId,
        attached_name: p.attachedName,
        image: p.image,
        privacy: p.privacy,
        gongs: p.gongs,
        comments: p.comments
      }));
      await supabase.from('posts').upsert(rows);
    }
  },

  async addPost(post: FeedPost): Promise<void> {
    const existing = await this.getPosts();
    const updated = [post, ...existing];
    await this.savePosts(updated);
  },

  // --- RECIPES ---
  async getRecipes(): Promise<Recipe[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('recipes').select('*');
      if (!error && data && data.length > 0) {
        return data.map(row => ({
          id: row.id,
          title: row.title,
          description: row.description || '',
          authorId: row.author_id,
          authorName: row.author_name,
          category: row.category,
          tags: row.tags || [],
          phases: row.phases || [],
          isCustom: row.is_custom,
          forkedFrom: row.forked_from,
          gongsCount: row.gongs_count || { continue: 0, refine: 0, reconsider: 0 }
        }));
      }
    }
    return getLocal<Recipe[]>(KEYS.RECIPES, INITIAL_RECIPES);
  },

  async saveRecipes(recipes: Recipe[]): Promise<void> {
    setLocal(KEYS.RECIPES, recipes);
    if (isSupabaseConfigured() && supabase) {
      const rows = recipes.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        author_id: r.authorId,
        author_name: r.authorName,
        category: r.category,
        tags: r.tags,
        phases: r.phases,
        is_custom: r.isCustom ?? false,
        forked_from: r.forkedFrom,
        gongs_count: r.gongsCount
      }));
      await supabase.from('recipes').upsert(rows);
    }
  },

  // --- COLLECTIONS ---
  async getCollections(): Promise<Collection[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('collections').select('*');
      if (!error && data && data.length > 0) {
        return data.map(row => ({
          id: row.id,
          title: row.title,
          description: row.description || '',
          deadlineDate: row.deadline_date,
          projectIds: row.project_ids || [],
          workMode: row.work_mode || 'hybrid',
          budgetedHours: row.budgeted_hours ? Number(row.budgeted_hours) : undefined
        }));
      }
    }
    return getLocal<Collection[]>(KEYS.COLLECTIONS, INITIAL_COLLECTIONS);
  },

  async saveCollections(collections: Collection[]): Promise<void> {
    setLocal(KEYS.COLLECTIONS, collections);
    if (isSupabaseConfigured() && supabase) {
      const rows = collections.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        deadline_date: c.deadlineDate,
        project_ids: c.projectIds,
        work_mode: c.workMode,
        budgeted_hours: c.budgetedHours
      }));
      await supabase.from('collections').upsert(rows);
    }
  },

  // --- PROJECTS ---
  async getProjects(): Promise<Project[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('projects').select('*');
      if (!error && data && data.length > 0) {
        return data.map(row => ({
          id: row.id,
          title: row.title,
          recipeId: row.recipe_id,
          recipeTitle: row.recipe_title,
          phases: row.phases || [],
          createdAt: row.created_at,
          completedAt: row.completed_at,
          collectionId: row.collection_id,
          privacy: row.privacy,
          progressPhotos: row.progress_photos || [],
          lastProgressShotAt: row.last_progress_shot_at
        }));
      }
    }
    return getLocal<Project[]>(KEYS.PROJECTS, INITIAL_PROJECTS);
  },

  async saveProjects(projects: Project[]): Promise<void> {
    setLocal(KEYS.PROJECTS, projects);
    if (isSupabaseConfigured() && supabase) {
      const rows = projects.map(p => ({
        id: p.id,
        title: p.title,
        recipe_id: p.recipeId,
        recipe_title: p.recipeTitle,
        phases: p.phases,
        created_at: p.createdAt,
        completed_at: p.completedAt,
        collection_id: p.collectionId,
        privacy: p.privacy,
        progress_photos: p.progressPhotos,
        last_progress_shot_at: p.lastProgressShotAt
      }));
      await supabase.from('projects').upsert(rows);
    }
  }
};
