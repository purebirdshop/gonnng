import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Creator,
  FeedPost,
  Recipe,
  Collection,
  Project,
  PostComment,
  PostMediaItem,
  FeedbackType,
  RecipeVisibility,
  ProfileVisibility,
  Phase,
  Task
} from '../types';
import { getPublicMediaUrl, uploadService } from './uploadService';
import { authService } from './authService';
import { hydrateCreators } from '../utils/followUtils';

// LOCAL STORAGE FALLBACK KEYS
const KEYS = {
  CREATORS: 'gonnng_creators',
  POSTS: 'gonnng_posts',
  RECIPES: 'gonnng_recipes',
  COLLECTIONS: 'gonnng_collections',
  PROJECTS: 'gonnng_projects',
  FEEDBACK: 'gonnng_post_feedback',
  BOOKMARKS: 'gonnng_recipe_bookmarks',
  FOLLOWS: 'gonnng_follows'
};

// IN-MEMORY FALLBACK STORE
const memoryStore = new Map<string, string>();

function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key) || memoryStore.get(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    const memItem = memoryStore.get(key);
    if (memItem) {
      try {
        return JSON.parse(memItem);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    // Strip large base64 data URLs from posts if any legacy ones exist
    let cleanValue = value;
    if (key === KEYS.POSTS && Array.isArray(value)) {
      cleanValue = value.map((p: any) => {
        if (!p) return p;
        const copy = { ...p };
        if (copy.image && copy.image.startsWith('data:')) {
          delete copy.image;
        }
        if (Array.isArray(copy.media)) {
          copy.media = copy.media.map((m: any) => {
            if (m && m.resolvedUrl && m.resolvedUrl.startsWith('data:')) {
              return { ...m, resolvedUrl: '' };
            }
            return m;
          });
        }
        return copy;
      }) as unknown as T;
    }

    const str = JSON.stringify(cleanValue);
    localStorage.setItem(key, str);
    memoryStore.set(key, str);
  } catch {
    // Fall back to in-memory store gracefully if localStorage quota is reached or unavailable
    try {
      const str = JSON.stringify(value);
      memoryStore.set(key, str);
    } catch {}
  }
}

export const dataService = {
  isSupabaseActive(): boolean {
    return isSupabaseConfigured() && Boolean(supabase);
  },

  // ================= USERS / CREATORS =================
  async getCreators(): Promise<Creator[]> {
    if (this.isSupabaseActive() && supabase) {
      const { data: users, error } = await supabase.from('users').select('*');
      if (!error && users && users.length > 0) {
        // Fetch follows for circles & count calculations
        const { data: followsData } = await supabase.from('follows').select('*');
        const { data: circlesData } = await supabase.from('circles').select('*');

        const followsList = followsData || [];
        const circlesList = circlesData || [];

        return users.map(u => {
          const followerIds = followsList.filter(f => f.followee_id === u.id).map(f => f.follower_id);
          const followingIds = followsList.filter(f => f.follower_id === u.id).map(f => f.followee_id);

          return {
            id: u.id,
            publicId: u.public_id,
            username: u.username,
            name: u.username || u.public_id,
            email: u.email,
            avatarUrl: u.avatar_url || getPublicMediaUrl('avatars', `${u.public_id || u.id}/avatar.jpg`),
            bio: u.about || '',
            goals: '',
            privacyDefault: (u.profile_visibility as ProfileVisibility) || 'public',
            followersCount: followerIds.length,
            followingCount: followingIds.length,
            followerIds,
            followingIds,
            isInCircle: circlesList.some(c => c.user_id === u.id)
          };
        });
      }
    }
    return hydrateCreators(getLocal<Creator[]>(KEYS.CREATORS, []));
  },

  async saveCreators(creators: Creator[]): Promise<void> {
    setLocal(KEYS.CREATORS, creators);
  },

  async updateUserProfile(updatedUser: Creator, previousName?: string): Promise<{
    creators: Creator[];
    posts: FeedPost[];
    recipes: Recipe[];
  }> {
    const existingCreators = await this.getCreators();
    const updatedCreators = existingCreators.some(c => c.id === updatedUser.id)
      ? existingCreators.map(c => c.id === updatedUser.id ? { ...c, ...updatedUser } : c)
      : [...existingCreators, updatedUser];

    setLocal(KEYS.CREATORS, updatedCreators);

    const existingPosts = await this.getPosts();
    const updatedPosts = existingPosts.map(p => {
      const isPostAuthor = p.userId === updatedUser.id || (previousName && p.userName === previousName);
      if (isPostAuthor) {
        return {
          ...p,
          userName: updatedUser.name,
          userAvatar: updatedUser.avatarUrl
        };
      }
      return p;
    });
    setLocal(KEYS.POSTS, updatedPosts);

    const existingRecipes = await this.getRecipes();
    const updatedRecipes = existingRecipes.map(r => {
      if (r.authorId === updatedUser.id || (previousName && r.authorName === previousName)) {
        return { ...r, authorName: updatedUser.name };
      }
      return r;
    });
    setLocal(KEYS.RECIPES, updatedRecipes);

    if (this.isSupabaseActive() && supabase) {
      const userPayload = {
        id: updatedUser.id,
        public_id: updatedUser.publicId || updatedUser.username || updatedUser.id,
        username: updatedUser.username || updatedUser.name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        email: updatedUser.email || '',
        about: updatedUser.bio || '',
        profile_visibility: updatedUser.privacyDefault || 'public'
      };

      const { error } = await supabase.from('users').upsert(userPayload, { onConflict: 'id' });
      if (error) console.error('Error updating user in Supabase:', error);
    }

    return { creators: updatedCreators, posts: updatedPosts, recipes: updatedRecipes };
  },

  // ================= FOLLOWS & CIRCLES =================
  async toggleFollowUser(followerId: string, followeeId: string): Promise<{ isFollowing: boolean; isInCircle: boolean }> {
    if (followerId === followeeId) throw new Error('Cannot follow yourself');

    if (this.isSupabaseActive() && supabase) {
      // Check if already following
      const { data: existing } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('followee_id', followeeId)
        .maybeSingle();

      if (existing) {
        // Unfollow
        await supabase.from('follows').delete().eq('id', existing.id);
        return { isFollowing: false, isInCircle: false };
      } else {
        // Follow (upsert to handle unique constraint safely)
        await supabase.from('follows').upsert(
          { follower_id: followerId, followee_id: followeeId },
          { onConflict: 'follower_id, followee_id' }
        );

        // Check circle view (mutual follow check)
        const { data: circle } = await supabase
          .from('circles')
          .select('*')
          .eq('user_id', followerId)
          .eq('circle_user_id', followeeId)
          .maybeSingle();

        return { isFollowing: true, isInCircle: Boolean(circle) };
      }
    } else {
      // Local fallback
      const follows = getLocal<Array<{ followerId: string; followeeId: string }>>(KEYS.FOLLOWS, []);
      const idx = follows.findIndex(f => f.followerId === followerId && f.followeeId === followeeId);
      let isFollowing = false;

      if (idx >= 0) {
        follows.splice(idx, 1);
      } else {
        follows.push({ followerId, followeeId });
        isFollowing = true;
      }
      setLocal(KEYS.FOLLOWS, follows);

      const isMutual = follows.some(f => f.followerId === followeeId && f.followeeId === followerId);
      return { isFollowing, isInCircle: isFollowing && isMutual };
    }
  },

  // ================= RECIPES & FORKING =================
  async getRecipes(): Promise<Recipe[]> {
    if (this.isSupabaseActive() && supabase) {
      const { data: recipeRows, error } = await supabase.from('recipes').select('*');
      if (!error && recipeRows && recipeRows.length > 0) {
        const { data: phasesData } = await supabase.from('recipe_phases').select('*').order('position');
        const { data: tasksData } = await supabase.from('recipe_tasks').select('*').order('position');
        const { data: usersData } = await supabase.from('users').select('*');

        const usersMap = new Map((usersData || []).map(u => [u.id, u]));

        return recipeRows.map(r => {
          const author = usersMap.get(r.user_id);
          const rPhases = (phasesData || []).filter(p => p.recipe_id === r.id);

          const phases = rPhases.map(p => {
            const pTasks = (tasksData || []).filter(t => t.phase_id === p.id);
            return {
              id: p.id,
              title: p.title,
              position: p.position,
              tasks: pTasks.map(t => ({
                id: t.id,
                title: t.title,
                position: t.position
              }))
            };
          });

          return {
            id: r.id,
            title: r.title,
            description: r.description || '',
            authorId: r.user_id,
            authorName: author?.username || author?.public_id || 'Creator',
            authorUsername: author?.username,
            category: 'Practical',
            tags: [],
            phases,
            visibility: r.visibility,
            isCustom: false,
            forkedFrom: r.forked_from_recipe_id || undefined,
            createdAt: r.created_at,
            updatedAt: r.updated_at
          };
        });
      }
    }
    return getLocal<Recipe[]>(KEYS.RECIPES, []);
  },

  async saveRecipes(recipes: Recipe[]): Promise<void> {
    setLocal(KEYS.RECIPES, recipes);
  },

  /**
   * Recipe Forking: Real row copy inserting new recipes, recipe_phases, and recipe_tasks rows
   */
  async forkRecipe(userId: string, sourceRecipe: Recipe): Promise<Recipe> {
    if (this.isSupabaseActive() && supabase) {
      // 1. Insert new recipe row
      const { data: newRecipeRow, error: recipeErr } = await supabase
        .from('recipes')
        .insert({
          user_id: userId,
          title: `${sourceRecipe.title} (Fork)`,
          description: sourceRecipe.description,
          visibility: 'private' as RecipeVisibility,
          forked_from_recipe_id: sourceRecipe.id
        })
        .select()
        .single();

      if (recipeErr || !newRecipeRow) {
        throw new Error(`Failed to fork recipe: ${recipeErr?.message || 'Unknown error'}`);
      }

      // 2. Real row copy of phases and tasks
      for (let pIndex = 0; pIndex < sourceRecipe.phases.length; pIndex++) {
        const sourcePhase = sourceRecipe.phases[pIndex];
        const { data: newPhaseRow, error: phaseErr } = await supabase
          .from('recipe_phases')
          .insert({
            recipe_id: newRecipeRow.id,
            title: sourcePhase.title,
            position: sourcePhase.position ?? pIndex + 1
          })
          .select()
          .single();

        if (phaseErr || !newPhaseRow) continue;

        for (let tIndex = 0; tIndex < sourcePhase.tasks.length; tIndex++) {
          const sourceTask = sourcePhase.tasks[tIndex];
          await supabase.from('recipe_tasks').insert({
            phase_id: newPhaseRow.id,
            title: sourceTask.title,
            position: sourceTask.position ?? tIndex + 1
          });
        }
      }

      const reloaded = await this.getRecipes();
      const created = reloaded.find(r => r.id === newRecipeRow.id);
      if (created) return created;
    }

    // Local fallback
    const newForked: Recipe = {
      ...sourceRecipe,
      id: `recipe-fork-${Date.now()}`,
      title: `${sourceRecipe.title} (Fork)`,
      authorId: userId,
      forkedFrom: sourceRecipe.id
    };
    const existing = await this.getRecipes();
    await this.saveRecipes([newForked, ...existing]);
    return newForked;
  },

  /**
   * Recipe Bookmarks: row-per-user in recipe_bookmarks
   */
  async toggleBookmarkRecipe(userId: string, recipeId: string): Promise<boolean> {
    if (this.isSupabaseActive() && supabase) {
      const { data: existing } = await supabase
        .from('recipe_bookmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .maybeSingle();

      if (existing) {
        await supabase.from('recipe_bookmarks').delete().eq('id', existing.id);
        return false;
      } else {
        await supabase.from('recipe_bookmarks').upsert(
          { user_id: userId, recipe_id: recipeId },
          { onConflict: 'user_id, recipe_id' }
        );
        return true;
      }
    } else {
      const bookmarks = getLocal<Array<{ userId: string; recipeId: string }>>(KEYS.BOOKMARKS, []);
      const idx = bookmarks.findIndex(b => b.userId === userId && b.recipeId === recipeId);
      let bookmarked = false;
      if (idx >= 0) {
        bookmarks.splice(idx, 1);
      } else {
        bookmarks.push({ userId, recipeId });
        bookmarked = true;
      }
      setLocal(KEYS.BOOKMARKS, bookmarks);
      return bookmarked;
    }
  },

  // ================= PROJECTS (Recipe execution) =================
  async getProjects(): Promise<Project[]> {
    if (this.isSupabaseActive() && supabase) {
      const { data: projectRows, error } = await supabase.from('projects').select('*');
      if (!error && projectRows && projectRows.length > 0) {
        const { data: phasesData } = await supabase.from('project_phases').select('*').order('position');
        const { data: tasksData } = await supabase.from('project_tasks').select('*').order('position');

        return projectRows.map(p => {
          const pPhases = (phasesData || []).filter(ph => ph.project_id === p.id);
          const phases: Phase[] = pPhases.map(ph => {
            const phTasks = (tasksData || []).filter(t => t.project_phase_id === ph.id);
            return {
              id: ph.id,
              title: ph.title,
              sourcePhaseId: ph.source_phase_id,
              position: ph.position,
              tasks: phTasks.map(t => ({
                id: t.id,
                title: t.title,
                completed: t.is_complete,
                sourceTaskId: t.source_task_id,
                position: t.position
              }))
            };
          });

          return {
            id: p.id,
            title: p.title,
            recipeId: p.recipe_id || '',
            recipeTitle: p.title,
            phases,
            createdAt: p.created_at,
            privacy: 'public'
          };
        });
      }
    }
    return getLocal<Project[]>(KEYS.PROJECTS, []);
  },

  async saveProjects(projects: Project[]): Promise<void> {
    setLocal(KEYS.PROJECTS, projects);
  },

  /**
   * Recipe -> Project: Real row copy inserting new projects, project_phases, and project_tasks rows
   */
  async createProjectFromRecipe(userId: string, recipe: Recipe): Promise<Project> {
    if (this.isSupabaseActive() && supabase) {
      // 1. Insert new projects row
      const { data: projectRow, error: pErr } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          recipe_id: recipe.id,
          title: recipe.title
        })
        .select()
        .single();

      if (pErr || !projectRow) {
        throw new Error(`Failed to create project: ${pErr?.message || 'Unknown error'}`);
      }

      const createdPhases: Phase[] = [];

      // 2. Real row copy of phases & tasks
      for (let pIndex = 0; pIndex < recipe.phases.length; pIndex++) {
        const rPhase = recipe.phases[pIndex];
        const { data: phaseRow, error: phErr } = await supabase
          .from('project_phases')
          .insert({
            project_id: projectRow.id,
            source_phase_id: rPhase.id || null,
            title: rPhase.title,
            position: rPhase.position ?? pIndex + 1,
            is_complete: false
          })
          .select()
          .single();

        if (phErr || !phaseRow) continue;

        const createdTasks: Task[] = [];
        for (let tIndex = 0; tIndex < rPhase.tasks.length; tIndex++) {
          const rTask = rPhase.tasks[tIndex];
          const { data: taskRow } = await supabase
            .from('project_tasks')
            .insert({
              project_phase_id: phaseRow.id,
              source_task_id: rTask.id || null,
              title: rTask.title,
              position: rTask.position ?? tIndex + 1,
              is_complete: false
            })
            .select()
            .single();

          if (taskRow) {
            createdTasks.push({
              id: taskRow.id,
              title: taskRow.title,
              completed: false,
              sourceTaskId: taskRow.source_task_id,
              position: taskRow.position
            });
          }
        }

        createdPhases.push({
          id: phaseRow.id,
          title: phaseRow.title,
          sourcePhaseId: phaseRow.source_phase_id,
          position: phaseRow.position,
          tasks: createdTasks
        });
      }

      const newProj: Project = {
        id: projectRow.id,
        title: projectRow.title,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        phases: createdPhases,
        createdAt: projectRow.created_at,
        privacy: 'public'
      };

      const existing = await this.getProjects();
      await this.saveProjects([newProj, ...existing]);
      return newProj;
    }

    // Local fallback
    const phases: Phase[] = recipe.phases.map((p, pIdx) => ({
      id: `phase-local-${pIdx}-${Date.now()}`,
      title: p.title,
      position: pIdx + 1,
      tasks: p.tasks.map((t, tIdx) => ({
        id: `task-local-${tIdx}-${Date.now()}`,
        title: t.title,
        completed: false,
        position: tIdx + 1
      }))
    }));

    const newProj: Project = {
      id: `project-${Date.now()}`,
      title: recipe.title,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      phases,
      createdAt: new Date().toISOString(),
      privacy: 'public'
    };

    const existing = await this.getProjects();
    await this.saveProjects([newProj, ...existing]);
    return newProj;
  },

  // ================= POSTS & MEDIA =================
  async getPosts(): Promise<FeedPost[]> {
    if (this.isSupabaseActive() && supabase) {
      const { data: postRows, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && postRows && postRows.length > 0) {
        const { data: mediaRows } = await supabase.from('post_media').select('*').order('position');
        const { data: feedbackRows } = await supabase.from('post_feedback').select('*');
        const { data: commentsRows } = await supabase.from('comments').select('*').order('created_at', { ascending: true });
        const { data: usersRows } = await supabase.from('users').select('*');

        const usersMap = new Map((usersRows || []).map(u => [u.id, u]));

        return postRows.map(p => {
          const author = usersMap.get(p.user_id);
          const pMedia = (mediaRows || []).filter(m => m.post_id === p.id);
          const pFeedback = (feedbackRows || []).filter(f => f.post_id === p.id);
          const pComments = (commentsRows || []).filter(c => c.post_id === p.id);

          // Calculate feedback counts from post_feedback rows (never counter increments)
          const gongs = {
            continue: pFeedback.filter(f => f.feedback_type === 'success').length,
            refine: pFeedback.filter(f => f.feedback_type === 'promise').length,
            reconsider: pFeedback.filter(f => f.feedback_type === 'potential').length
          };

          // Build post media items with dynamically resolved URLs
          const media: PostMediaItem[] = pMedia.map(m => ({
            id: m.id,
            postId: m.post_id,
            storageBucket: m.storage_bucket,
            storagePath: m.storage_path,
            mediaType: m.media_type,
            position: m.position,
            width: m.width,
            height: m.height,
            durationMs: m.duration_ms,
            resolvedUrl: getPublicMediaUrl(m.storage_bucket, m.storage_path)
          }));

          // First media resolved URL as primary image fallback
          const primaryImage = media.length > 0 ? media[0].resolvedUrl : undefined;

          // Build recursive nested comments tree
          const formattedComments = this.buildCommentsTree(pComments, usersMap);

          return {
            id: p.id,
            type: 'update_logged',
            userId: p.user_id,
            userName: author?.username || author?.public_id || 'Creator',
            username: author?.username,
            userAvatar: author?.avatar_url || getPublicMediaUrl('avatars', `${author?.public_id || p.user_id}/avatar.jpg`),
            timeString: new Date(p.created_at).toLocaleDateString(),
            title: p.description?.substring(0, 60) || 'Post Update',
            content: p.description || '',
            projectId: p.project_id,
            image: primaryImage,
            media,
            privacy: 'public',
            createdAt: p.created_at,
            gongs,
            comments: formattedComments
          };
        });
      }
    }
    return getLocal<FeedPost[]>(KEYS.POSTS, []);
  },

  async savePosts(posts: FeedPost[]): Promise<void> {
    setLocal(KEYS.POSTS, posts);
  },

  async addPost(post: FeedPost): Promise<void> {
    if (this.isSupabaseActive() && supabase) {
      const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      // 1. Sanitize & ensure valid post.id UUID
      if (!isUuid(post.id)) {
        post.id = crypto.randomUUID();
      }

      // 2. Sanitize & ensure valid user_id UUID
      const session = authService.getCurrentSession();
      const rawUserId = post.userId || session?.id;
      const validUserId = isUuid(rawUserId)
        ? rawUserId
        : (session?.id && isUuid(session.id) ? session.id : '4c0ab90e-6ec5-4a14-bb46-f10d4dc7bcb2');
      post.userId = validUserId;

      // Ensure user exists in Supabase 'users' table
      try {
        const { data: userRow } = await supabase.from('users').select('id').eq('id', validUserId).maybeSingle();
        if (!userRow) {
          await supabase.from('users').upsert({
            id: validUserId,
            public_id: session?.publicId || session?.username || validUserId,
            username: session?.username || session?.name?.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'creator',
            email: session?.email || 'user@gonnng.com',
            about: 'Process creator and workflow explorer.',
            profile_visibility: 'public'
          });
        }
      } catch (uErr) {
        console.warn('Note verifying user row in Supabase:', uErr);
      }

      // 3. Sanitize project_id UUID
      const rawProjectId = post.projectId || post.attachedId;
      let validProjectId: string | null = null;
      if (rawProjectId && isUuid(rawProjectId)) {
        try {
          const { data: projRow } = await supabase.from('projects').select('id').eq('id', rawProjectId).maybeSingle();
          if (projRow) {
            validProjectId = rawProjectId;
          } else {
            console.warn(`Project ID ${rawProjectId} not found in Supabase 'projects' table, setting project_id to null for post.`);
          }
        } catch (pErr) {
          console.warn('Note checking project existence in Supabase:', pErr);
        }
      }
      post.projectId = validProjectId || undefined;

      // 4. Create posts row FIRST in Supabase with correct database columns
      const { error: postErr } = await supabase.from('posts').insert({
        id: post.id,
        user_id: post.userId,
        project_id: validProjectId,
        description: post.content || post.description || post.title || 'Logged update'
      });

      if (postErr) {
        console.error('Failed to create post row in Supabase:', postErr);
      } else {
        console.log('Successfully created post row in Supabase posts table with ID:', post.id);
      }

      // 5. Upload media files directly to storage path {user_id}/{post_id}/{filename} in post-media bucket
      if (post.mediaFiles && post.mediaFiles.length > 0) {
        const { successful, failed } = await uploadService.uploadMultiplePostMedia(post.mediaFiles, post.id);
        if (failed.length > 0) {
          console.warn('Some media files failed to upload independently:', failed);
        }
        if (successful.length > 0) {
          post.media = successful.map(s => ({
            id: s.id,
            postId: post.id,
            storageBucket: s.storageBucket,
            storagePath: s.storagePath,
            mediaType: s.mediaType,
            position: s.position,
            resolvedUrl: s.publicUrl
          }));
          post.image = post.media[0]?.resolvedUrl;
          post.images = post.media.map(m => m.resolvedUrl!).filter(Boolean);
        }
      }
    }

    const existing = await this.getPosts();
    const updated = [post, ...existing];
    await this.savePosts(updated);
  },

  /**
   * Deletes a post and removes all associated storage objects under {user_id}/{post_id}/
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    // 1. Delete storage objects under {user_id}/{post_id}/ prefix
    await uploadService.deletePostStorageObjects(postId, userId);

    if (this.isSupabaseActive() && supabase) {
      // 2. Delete posts row (cascades to post_media, comments, post_feedback)
      const { error: deleteErr } = await supabase.from('posts').delete().eq('id', postId);
      if (deleteErr) {
        console.error('Failed to delete post row from Supabase:', deleteErr);
      }
    }

    // Update local cache
    const posts = await this.getPosts();
    const updated = posts.filter(p => p.id !== postId);
    await this.savePosts(updated);
  },

  /**
   * Post Feedback: UPSERT into post_feedback table with unique constraint on (post_id, user_id)
   * NO client-side counter increments!
   */
  async givePostFeedback(postId: string, userId: string, feedbackType: FeedbackType): Promise<{
    continue: number;
    refine: number;
    reconsider: number;
    userVoted: FeedbackType;
  }> {
    if (this.isSupabaseActive() && supabase) {
      const { error } = await supabase.from('post_feedback').upsert(
        {
          post_id: postId,
          user_id: userId,
          feedback_type: feedbackType
        },
        { onConflict: 'post_id, user_id' }
      );

      if (error) {
        console.error('Error upserting feedback:', error);
      }

      // Re-fetch all feedback rows for post to derive exact totals
      const { data: allFb } = await supabase.from('post_feedback').select('*').eq('post_id', postId);

      const fbList = allFb || [];
      return {
        continue: fbList.filter(f => f.feedback_type === 'success').length,
        refine: fbList.filter(f => f.feedback_type === 'promise').length,
        reconsider: fbList.filter(f => f.feedback_type === 'potential').length,
        userVoted: feedbackType
      };
    } else {
      // Local fallback using UPSERT logic in LocalStorage
      const localFb = getLocal<Array<{ postId: string; userId: string; feedbackType: FeedbackType }>>(KEYS.FEEDBACK, []);
      const idx = localFb.findIndex(f => f.postId === postId && f.userId === userId);

      if (idx >= 0) {
        localFb[idx].feedbackType = feedbackType;
      } else {
        localFb.push({ postId, userId, feedbackType });
      }
      setLocal(KEYS.FEEDBACK, localFb);

      const postFb = localFb.filter(f => f.postId === postId);
      return {
        continue: postFb.filter(f => f.feedbackType === 'success').length,
        refine: postFb.filter(f => f.feedbackType === 'promise').length,
        reconsider: postFb.filter(f => f.feedbackType === 'potential').length,
        userVoted: feedbackType
      };
    }
  },

  // ================= COMMENTS & SUB-COMMENTS =================
  async addComment(postId: string, userId: string, body: string, parentCommentId?: string): Promise<PostComment> {
    if (this.isSupabaseActive() && supabase) {
      const { data: commentRow, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          parent_comment_id: parentCommentId || null,
          body
        })
        .select()
        .single();

      if (error || !commentRow) {
        throw new Error(`Failed to add comment: ${error?.message || 'Unknown error'}`);
      }

      const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();

      return {
        id: commentRow.id,
        userId: commentRow.user_id,
        userName: user?.username || 'User',
        userAvatar: user?.avatar_url || getPublicMediaUrl('avatars', `${user?.public_id || userId}/avatar.jpg`),
        body: commentRow.body,
        content: commentRow.body,
        timeString: 'Just now',
        parentId: commentRow.parent_comment_id,
        createdAt: commentRow.created_at,
        children: []
      };
    } else {
      const posts = await this.getPosts();
      const newComment: PostComment = {
        id: `c-${Date.now()}`,
        userId,
        userName: 'You',
        userAvatar: '',
        body,
        content: body,
        timeString: 'Just now',
        parentId: parentCommentId || null,
        createdAt: new Date().toISOString(),
        children: []
      };

      const targetPost = posts.find(p => p.id === postId);
      if (targetPost) {
        targetPost.comments = targetPost.comments || [];
        targetPost.comments.push(newComment);
        await this.savePosts(posts);
      }
      return newComment;
    }
  },

  buildCommentsTree(commentsList: any[], usersMap: Map<string, any>): PostComment[] {
    const map = new Map<string, PostComment>();
    const roots: PostComment[] = [];

    commentsList.forEach(c => {
      const author = usersMap.get(c.user_id);
      const item: PostComment = {
        id: c.id,
        userId: c.user_id,
        userName: author?.username || 'Creator',
        userAvatar: author?.avatar_url || getPublicMediaUrl('avatars', `${author?.public_id || c.user_id}/avatar.jpg`),
        body: c.body,
        content: c.body,
        timeString: new Date(c.created_at).toLocaleTimeString(),
        parentId: c.parent_comment_id,
        createdAt: c.created_at,
        children: []
      };
      map.set(c.id, item);
    });

    map.forEach(item => {
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children!.push(item);
      } else {
        roots.push(item);
      }
    });

    return roots;
  },

  // ================= COLLECTIONS =================
  async getCollections(): Promise<Collection[]> {
    return getLocal<Collection[]>(KEYS.COLLECTIONS, []);
  },

  async saveCollections(collections: Collection[]): Promise<void> {
    setLocal(KEYS.COLLECTIONS, collections);
  }
};
