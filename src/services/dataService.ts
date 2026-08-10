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
  Task,
  DirectMessage,
  MessageThread
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
  FOLLOWS: 'gonnng_follows',
  MESSAGES: 'gonnng_direct_messages'
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

export function toValidUuid(id: string): string {
  if (!id) return '00000000-0000-4000-8000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id.toLowerCase();
  }

  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < id.length; i++) {
    const code = id.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x811c9dc5);
  }
  let h3 = Math.imul(h1 ^ h2, 0x01000193);
  let h4 = Math.imul(h2 ^ h3, 0x811c9dc5);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const hex4 = (h4 >>> 0).toString(16).padStart(8, '0');

  const raw = (hex1 + hex2 + hex3 + hex4).slice(0, 32);

  const part1 = raw.slice(0, 8);
  const part2 = raw.slice(8, 12);
  const part3 = '4' + raw.slice(13, 16);
  const part4 = '8' + raw.slice(17, 20);
  const part5 = raw.slice(20, 32);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`.toLowerCase();
}

export const DEFAULT_RECIPES: Recipe[] = [];

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
          const avatarStoragePath = u.avatar_storage_path || u.avatar_path || '';
          const avatarUrl = avatarStoragePath
            ? getPublicMediaUrl('Gonnng', avatarStoragePath)
            : '';

          const resolvedName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.public_id || 'Creator';
          return {
            id: u.id,
            publicId: u.public_id,
            username: u.username,
            name: resolvedName,
            email: u.email,
            avatarUrl,
            avatarPath: avatarStoragePath,
            avatarStoragePath,
            bio: u.about,
            goals: u.goal || '',
            privacyDefault: (u.profile_visibility || u.privacy_default || 'public') as ProfileVisibility,
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
      if (!p) return p;
      const pUid = p.userId || (p as any).user_id;
      const isPostAuthor = pUid === updatedUser.id || (previousName && p.userName === previousName);
      if (isPostAuthor) {
        return {
          ...p,
          userName: updatedUser.name,
          userAvatar: updatedUser.avatarUrl
        };
      }
      return p;
    }).filter(Boolean);
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
      const storagePath = updatedUser.avatarPath || updatedUser.avatarStoragePath;
      const rawName = (updatedUser.name || '').trim();
      const spaceIdx = rawName.indexOf(' ');
      const firstName = spaceIdx === -1 ? rawName : rawName.substring(0, spaceIdx);
      const lastName = spaceIdx === -1 ? '' : rawName.substring(spaceIdx + 1).trim();

      const userPayload: any = {
        id: updatedUser.id,
        public_id: updatedUser.publicId,
        username: updatedUser.username || rawName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        first_name: firstName,
        last_name: lastName,
        email: updatedUser.email,
        about: updatedUser.bio || '',
        goal: updatedUser.goals || '',
        profile_visibility: updatedUser.privacyDefault || 'public'
      };

      if (storagePath) {
        userPayload.avatar_storage_path = storagePath;
      } else if (updatedUser.avatarUrl) {
        userPayload.avatar_storage_path = updatedUser.avatarUrl;
      } else {
        userPayload.avatar_storage_path = null;
      }

      const { error } = await supabase.from('users').upsert(userPayload, { onConflict: 'id' });
      if (error) console.error('Error updating user in Supabase:', error);

      // Also sync to creators table if present
      const creatorPayload: any = {
        id: updatedUser.id,
        public_id: updatedUser.publicId,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio || '',
        privacy_default: updatedUser.privacyDefault
      };
      if (storagePath) {
        creatorPayload.avatar_storage_path = storagePath;
      } else if (updatedUser.avatarUrl) {
        creatorPayload.avatar_storage_path = updatedUser.avatarUrl;
      } else {
        creatorPayload.avatar_storage_path = null;
      }
      try {
        await supabase.from('creators').upsert(creatorPayload, { onConflict: 'id' });
      } catch (e) {
        // Safe fallback
      }
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
    let dbRecipes: Recipe[] = [];
    if (this.isSupabaseActive() && supabase) {
      try {
        const { data: recipeRows, error } = await supabase.from('recipes').select('*');
        if (!error && recipeRows && recipeRows.length > 0) {
          const { data: phasesData } = await supabase.from('recipe_phases').select('*').order('position');
          const { data: tasksData } = await supabase.from('recipe_tasks').select('*').order('position');
          const { data: usersData } = await supabase.from('users').select('*');

          const usersMap = new Map((usersData || []).map(u => [u.id, u]));

          dbRecipes = recipeRows.map(r => {
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
              authorName: author ? (author.first_name || author.username || 'Creator') : 'Creator',
              authorUsername: author?.username,
              category: r.category || r.category_name || r.category_title || 'General',
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
      } catch (err) {
        console.warn('Error fetching recipes from Supabase:', err);
      }
    }

    const localRecipes = getLocal<Recipe[]>(KEYS.RECIPES, []);
    const combinedMap = new Map<string, Recipe>();

    localRecipes.forEach(r => combinedMap.set(r.id, r));
    dbRecipes.forEach(r => combinedMap.set(r.id, r));

    const finalRecipes = Array.from(combinedMap.values());
    setLocal(KEYS.RECIPES, finalRecipes);
    return finalRecipes;
  },

  async saveRecipe(recipe: Recipe, userId?: string): Promise<Recipe> {
    // 1. Update local storage
    const localRecipes = getLocal<Recipe[]>(KEYS.RECIPES, []);
    const existsLocally = localRecipes.some(r => r.id === recipe.id);
    const updatedLocal = existsLocally
      ? localRecipes.map(r => r.id === recipe.id ? recipe : r)
      : [recipe, ...localRecipes];
    setLocal(KEYS.RECIPES, updatedLocal);

    // 2. Write to Supabase if active
    if (this.isSupabaseActive() && supabase) {
      try {
        const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
        const authorId = userId || recipe.authorId;

        let existingDbId: string | null = null;
        if (isUuid(recipe.id)) {
          const { data: found } = await supabase.from('recipes').select('id').eq('id', recipe.id).maybeSingle();
          if (found) existingDbId = found.id;
        }

        if (existingDbId) {
          // Update existing recipe row
          await supabase.from('recipes').update({
            title: recipe.title,
            description: recipe.description || '',
            category: recipe.category || 'General',
            visibility: recipe.visibility || 'public',
            updated_at: new Date().toISOString()
          }).eq('id', existingDbId);

          if (recipe.phases) {
            for (let pIndex = 0; pIndex < recipe.phases.length; pIndex++) {
              const ph = recipe.phases[pIndex];
              let realPhaseId: string | null = null;

              if (isUuid(ph.id)) {
                const { data: foundPh } = await supabase.from('recipe_phases').select('id').eq('id', ph.id).maybeSingle();
                if (foundPh) {
                  realPhaseId = foundPh.id;
                  await supabase.from('recipe_phases').update({
                    title: ph.title,
                    position: ph.position ?? pIndex + 1
                  }).eq('id', realPhaseId);
                }
              }

              if (!realPhaseId) {
                const { data: newPhRow } = await supabase.from('recipe_phases').insert({
                  recipe_id: existingDbId,
                  title: ph.title,
                  position: ph.position ?? pIndex + 1
                }).select().single();
                if (newPhRow) {
                  realPhaseId = newPhRow.id;
                  ph.id = newPhRow.id;
                }
              }

              if (realPhaseId && ph.tasks) {
                for (let tIndex = 0; tIndex < ph.tasks.length; tIndex++) {
                  const t = ph.tasks[tIndex];
                  let realTaskId: string | null = null;

                  if (isUuid(t.id)) {
                    const { data: foundTk } = await supabase.from('recipe_tasks').select('id').eq('id', t.id).maybeSingle();
                    if (foundTk) {
                      realTaskId = foundTk.id;
                      await supabase.from('recipe_tasks').update({
                        title: t.title,
                        position: t.position ?? tIndex + 1
                      }).eq('id', realTaskId);
                    }
                  }

                  if (!realTaskId) {
                    const { data: newTkRow } = await supabase.from('recipe_tasks').insert({
                      phase_id: realPhaseId,
                      title: t.title,
                      position: t.position ?? tIndex + 1
                    }).select().single();
                    if (newTkRow) {
                      t.id = newTkRow.id;
                    }
                  }
                }
              }
            }
          }
        } else {
          // Insert new recipe row
          const insertPayload: any = {
            title: recipe.title,
            description: recipe.description || '',
            category: recipe.category || 'General',
            visibility: recipe.visibility || 'public'
          };
          if (authorId && isUuid(authorId)) {
            insertPayload.user_id = authorId;
          }
          if (isUuid(recipe.id)) {
            insertPayload.id = recipe.id;
          }
          if (recipe.forkedFrom && isUuid(recipe.forkedFrom)) {
            insertPayload.forked_from_recipe_id = recipe.forkedFrom;
          }

          const { data: newRecipeRow, error: rErr } = await supabase
            .from('recipes')
            .insert(insertPayload)
            .select()
            .single();

          if (!rErr && newRecipeRow) {
            recipe.id = newRecipeRow.id;
            recipe.authorId = newRecipeRow.user_id;

            if (recipe.phases) {
              for (let pIndex = 0; pIndex < recipe.phases.length; pIndex++) {
                const ph = recipe.phases[pIndex];
                const { data: newPhRow } = await supabase.from('recipe_phases').insert({
                  recipe_id: newRecipeRow.id,
                  title: ph.title,
                  position: ph.position ?? pIndex + 1
                }).select().single();

                if (newPhRow) {
                  ph.id = newPhRow.id;
                  if (ph.tasks) {
                    for (let tIndex = 0; tIndex < ph.tasks.length; tIndex++) {
                      const t = ph.tasks[tIndex];
                      const { data: newTkRow } = await supabase.from('recipe_tasks').insert({
                        phase_id: newPhRow.id,
                        title: t.title,
                        position: t.position ?? tIndex + 1
                      }).select().single();
                      if (newTkRow) {
                        t.id = newTkRow.id;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (dbErr) {
        console.error('Error saving recipe to Supabase:', dbErr);
      }
    }

    return recipe;
  },

  async saveRecipes(recipes: Recipe[], userId?: string): Promise<void> {
    setLocal(KEYS.RECIPES, recipes);
    if (this.isSupabaseActive() && supabase) {
      for (const recipe of recipes) {
        await this.saveRecipe(recipe, userId);
      }
    }
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

  async ensureUserExistsInSupabase(validUserId: string, userDetails?: Partial<Creator>): Promise<void> {
    if (!this.isSupabaseActive() || !supabase) return;
    try {
      const { data } = await supabase.from('users').select('id').eq('id', validUserId).maybeSingle();
      if (!data) {
        await supabase.from('users').upsert({
          id: validUserId,
          public_id: validUserId,
          username: userDetails?.username || `user_${validUserId.slice(0, 8)}`,
          first_name: userDetails?.name || 'User',
          last_name: ''
        }, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn('Error ensuring user in Supabase:', err);
    }
  },

  async ensureRecipeExistsInSupabase(validRecipeId: string, validUserId: string, recipeObj?: Partial<Recipe>): Promise<void> {
    if (!this.isSupabaseActive() || !supabase) return;
    try {
      const { data } = await supabase.from('recipes').select('id').eq('id', validRecipeId).maybeSingle();
      if (!data) {
        await supabase.from('recipes').upsert({
          id: validRecipeId,
          user_id: validUserId,
          title: recipeObj?.title || 'Saved Recipe',
          description: recipeObj?.description || '',
          category: recipeObj?.category || 'General',
          visibility: 'public'
        }, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn('Error ensuring recipe in Supabase:', err);
    }
  },

  /**
   * Recipe Bookmarks: row-per-user in recipe_bookmarks
   */
  async getUserSavedRecipeIds(userId: string): Promise<string[]> {
    const validUserId = toValidUuid(userId || '4c0ab90e-6ec5-4a14-bb46-f10d4dc7bcb2');
    let supabaseIds: string[] = [];
    if (this.isSupabaseActive() && supabase) {
      try {
        const { data, error } = await supabase
          .from('recipe_bookmarks')
          .select('recipe_id')
          .eq('user_id', validUserId);
        if (!error && data) {
          supabaseIds = data.map(b => b.recipe_id);
        }
      } catch (err) {
        console.warn('Error fetching bookmarks from Supabase:', err);
      }
    }

    const localBookmarks = getLocal<any[]>(KEYS.BOOKMARKS, []);
    const localIds = (Array.isArray(localBookmarks) ? localBookmarks : [])
      .filter(b => {
        if (!b) return false;
        if (typeof b === 'string') return true;
        const bUid = b.userId || (b as any).user_id;
        return !bUid || bUid === userId || bUid === validUserId;
      })
      .map(b => (typeof b === 'string' ? b : (b.recipeId || (b as any).recipe_id)))
      .filter(Boolean);

    const stringSaved = getLocal<string[]>('gonnng_recipe_bookmarks', []);

    const allKnownRecipes = await this.getRecipes();
    const uuidToOrigMap = new Map<string, string>();
    allKnownRecipes.forEach(r => {
      if (!r) return;
      uuidToOrigMap.set(toValidUuid(r.id), r.id);
      uuidToOrigMap.set(r.id, r.id);
    });

    const mappedSupabaseIds: string[] = [];
    supabaseIds.forEach(sid => {
      mappedSupabaseIds.push(sid);
      const orig = uuidToOrigMap.get(sid);
      if (orig) mappedSupabaseIds.push(orig);
    });

    const combined = Array.from(new Set([
      ...mappedSupabaseIds,
      ...localIds,
      ...(Array.isArray(stringSaved) ? stringSaved : [])
    ]));
    return combined;
  },

  async toggleBookmarkRecipe(userId: string, recipeId: string, recipeObj?: Recipe): Promise<boolean> {
    const validUserId = toValidUuid(userId || '4c0ab90e-6ec5-4a14-bb46-f10d4dc7bcb2');
    const validRecipeId = toValidUuid(recipeId);

    // 1. Local Storage synchronization
    const localBookmarks = getLocal<any[]>(KEYS.BOOKMARKS, []);
    const arr = Array.isArray(localBookmarks) ? localBookmarks : [];
    const idx = arr.findIndex(b => {
      if (!b) return false;
      if (typeof b === 'string') return b === recipeId || b === validRecipeId;
      const bUid = b.userId || (b as any).user_id;
      const bRId = b.recipeId || (b as any).recipe_id;
      return (!bUid || bUid === userId || bUid === validUserId) && (bRId === recipeId || bRId === validRecipeId);
    });
    let isNowBookmarked = false;

    if (idx >= 0) {
      arr.splice(idx, 1);
      isNowBookmarked = false;
    } else {
      arr.push({ userId, recipeId });
      if (recipeId !== validRecipeId) {
        arr.push({ userId: validUserId, recipeId: validRecipeId });
      }
      isNowBookmarked = true;
    }
    setLocal(KEYS.BOOKMARKS, arr);

    const stringBookmarkIds = arr
      .filter(b => {
        if (!b) return false;
        if (typeof b === 'string') return true;
        const bUid = b.userId || (b as any).user_id;
        return !bUid || bUid === userId || bUid === validUserId;
      })
      .map(b => (typeof b === 'string' ? b : (b.recipeId || (b as any).recipe_id)))
      .filter(Boolean);
    try {
      localStorage.setItem('gonnng_recipe_bookmarks', JSON.stringify(Array.from(new Set(stringBookmarkIds))));
    } catch {}

    // 2. Direct database writes to Supabase recipe_bookmarks table
    if (this.isSupabaseActive() && supabase) {
      try {
        await this.ensureUserExistsInSupabase(validUserId);
        await this.ensureRecipeExistsInSupabase(validRecipeId, validUserId, recipeObj);

        const { data: existing } = await supabase
          .from('recipe_bookmarks')
          .select('*')
          .eq('user_id', validUserId)
          .eq('recipe_id', validRecipeId)
          .maybeSingle();

        if (existing) {
          await supabase.from('recipe_bookmarks').delete().eq('id', existing.id);
        } else {
          await supabase.from('recipe_bookmarks').upsert(
            { user_id: validUserId, recipe_id: validRecipeId },
            { onConflict: 'user_id, recipe_id' }
          );
        }
      } catch (err) {
        console.warn('Supabase bookmark sync error:', err);
      }
    }

    return isNowBookmarked;
  },

  // ================= PROJECTS (Recipe execution) =================
  async getProjects(userId?: string): Promise<Project[]> {
    if (this.isSupabaseActive() && supabase) {
      let query = supabase.from('projects').select('*');
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data: projectRows, error } = await query;
      if (!error && projectRows) {
        if (projectRows.length === 0) return [];
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
            userId: p.user_id,
            title: p.title,
            recipeId: p.recipe_id || '',
            recipeTitle: p.title,
            category: p.category || 'General',
            phases,
            createdAt: p.created_at,
            privacy: 'public'
          };
        });
      }
    }
    const all = getLocal<Project[]>(KEYS.PROJECTS, []);
    const safeAll = Array.isArray(all) ? all.filter(Boolean) : [];
    if (userId) {
      return safeAll.filter(p => p && (!p.userId && !(p as any).user_id || p.userId === userId || (p as any).user_id === userId));
    }
    return safeAll;
  },

  async saveProjects(projects: Project[], userId?: string): Promise<void> {
    setLocal(KEYS.PROJECTS, projects);
    if (this.isSupabaseActive() && supabase) {
      for (const p of projects) {
        await this.updateProject(p, userId);
      }
    }
  },

  async updateProject(project: Project, userId?: string): Promise<Project> {
    // 1. Update in local storage
    const all = getLocal<Project[]>(KEYS.PROJECTS, []);
    const exists = all.some(p => p.id === project.id);
    const updatedAll = exists
      ? all.map(p => p.id === project.id ? project : p)
      : [project, ...all];
    setLocal(KEYS.PROJECTS, updatedAll);

    // 2. Update/Insert in Supabase if active
    if (this.isSupabaseActive() && supabase) {
      try {
        const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
        const ownerId = userId || project.userId;

        let existingDbId: string | null = null;
        if (isUuid(project.id)) {
          const { data: found } = await supabase.from('projects').select('id').eq('id', project.id).maybeSingle();
          if (found) existingDbId = found.id;
        }

        if (existingDbId) {
          // UPDATE existing project row
          await supabase.from('projects').update({
            title: project.title,
            category: project.category || 'General',
            updated_at: new Date().toISOString()
          }).eq('id', existingDbId);

          if (project.phases) {
            for (let pIndex = 0; pIndex < project.phases.length; pIndex++) {
              const ph = project.phases[pIndex];
              let realPhaseId: string | null = null;

              if (isUuid(ph.id)) {
                const { data: foundPh } = await supabase.from('project_phases').select('id').eq('id', ph.id).maybeSingle();
                if (foundPh) {
                  realPhaseId = foundPh.id;
                  await supabase.from('project_phases').update({
                    title: ph.title,
                    position: ph.position ?? pIndex + 1
                  }).eq('id', realPhaseId);
                }
              }

              if (!realPhaseId) {
                const { data: newPhRow } = await supabase.from('project_phases').insert({
                  project_id: existingDbId,
                  title: ph.title,
                  position: ph.position ?? pIndex + 1,
                  is_complete: false
                }).select().single();
                if (newPhRow) {
                  realPhaseId = newPhRow.id;
                  ph.id = newPhRow.id;
                }
              }

              if (realPhaseId && ph.tasks) {
                for (let tIndex = 0; tIndex < ph.tasks.length; tIndex++) {
                  const t = ph.tasks[tIndex];
                  let realTaskId: string | null = null;

                  if (isUuid(t.id)) {
                    const { data: foundTk } = await supabase.from('project_tasks').select('id').eq('id', t.id).maybeSingle();
                    if (foundTk) {
                      realTaskId = foundTk.id;
                      await supabase.from('project_tasks').update({
                        title: t.title,
                        position: t.position ?? tIndex + 1,
                        is_complete: Boolean(t.completed)
                      }).eq('id', realTaskId);
                    }
                  }

                  if (!realTaskId) {
                    const { data: newTkRow } = await supabase.from('project_tasks').insert({
                      project_phase_id: realPhaseId,
                      title: t.title,
                      position: t.position ?? tIndex + 1,
                      is_complete: Boolean(t.completed)
                    }).select().single();
                    if (newTkRow) {
                      t.id = newTkRow.id;
                    }
                  }
                }
              }
            }
          }
        } else {
          // INSERT new project row
          const insertPayload: any = {
            title: project.title,
            category: project.category || 'General',
            recipe_id: isUuid(project.recipeId) ? project.recipeId : null
          };
          if (ownerId && isUuid(ownerId)) {
            insertPayload.user_id = ownerId;
          }
          if (isUuid(project.id)) {
            insertPayload.id = project.id;
          }

          const { data: newProjRow, error: pErr } = await supabase
            .from('projects')
            .insert(insertPayload)
            .select()
            .single();

          if (!pErr && newProjRow) {
            project.id = newProjRow.id;
            if (newProjRow.user_id) project.userId = newProjRow.user_id;

            if (project.phases) {
              for (let pIndex = 0; pIndex < project.phases.length; pIndex++) {
                const ph = project.phases[pIndex];
                const { data: newPhRow } = await supabase.from('project_phases').insert({
                  project_id: newProjRow.id,
                  title: ph.title,
                  position: ph.position ?? pIndex + 1,
                  is_complete: false
                }).select().single();

                if (newPhRow) {
                  ph.id = newPhRow.id;
                  if (ph.tasks) {
                    for (let tIndex = 0; tIndex < ph.tasks.length; tIndex++) {
                      const t = ph.tasks[tIndex];
                      const { data: newTkRow } = await supabase.from('project_tasks').insert({
                        project_phase_id: newPhRow.id,
                        title: t.title,
                        position: t.position ?? tIndex + 1,
                        is_complete: Boolean(t.completed)
                      }).select().single();
                      if (newTkRow) {
                        t.id = newTkRow.id;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error updating project in Supabase:', err);
      }
    }

    return project;
  },

  /**
   * Custom Project creation with Title, Category, Cover Image, Phases & Steps, and Privacy
   */
  async createProject(
    userId: string,
    data: {
      title: string;
      category: string;
      imageUrl?: string;
      phases: Phase[];
      privacy?: ProfileVisibility;
      recipeId?: string;
      recipeTitle?: string;
    }
  ): Promise<Project> {
    const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
    const recipeId = data.recipeId || `custom-${Date.now()}`;
    const recipeTitle = data.recipeTitle || data.title;
    const category = data.category || 'General';
    const privacy = data.privacy || 'public';

    if (this.isSupabaseActive() && supabase) {
      const { data: projectRow, error: pErr } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          recipe_id: isUuid(recipeId) ? recipeId : null,
          title: data.title,
          category: category
        })
        .select()
        .single();

      if (!pErr && projectRow) {
        const createdPhases: Phase[] = [];
        for (let pIndex = 0; pIndex < data.phases.length; pIndex++) {
          const ph = data.phases[pIndex];
          const { data: phaseRow } = await supabase
            .from('project_phases')
            .insert({
              project_id: projectRow.id,
              title: ph.title,
              position: ph.position ?? pIndex + 1,
              is_complete: false
            })
            .select()
            .single();

          if (!phaseRow) continue;

          const createdTasks: Task[] = [];
          for (let tIndex = 0; tIndex < ph.tasks.length; tIndex++) {
            const t = ph.tasks[tIndex];
            const { data: taskRow } = await supabase
              .from('project_tasks')
              .insert({
                project_phase_id: phaseRow.id,
                title: t.title,
                position: t.position ?? tIndex + 1,
                is_complete: false
              })
              .select()
              .single();

            if (taskRow) {
              createdTasks.push({
                id: taskRow.id,
                title: taskRow.title,
                completed: false,
                position: taskRow.position
              });
            }
          }

          createdPhases.push({
            id: phaseRow.id,
            title: phaseRow.title,
            position: phaseRow.position,
            tasks: createdTasks
          });
        }

        const newProj: Project = {
          id: projectRow.id,
          title: projectRow.title,
          recipeId,
          recipeTitle,
          category,
          phases: createdPhases,
          createdAt: projectRow.created_at,
          privacy,
          progressPhotos: data.imageUrl
            ? [{ url: data.imageUrl, caption: 'Project Cover', date: new Date().toLocaleDateString() }]
            : []
        };

        const existing = await this.getProjects();
        await this.saveProjects([newProj, ...existing]);
        return newProj;
      }
    }

    // Local fallback
    const phases: Phase[] = data.phases.map((p, pIdx) => ({
      id: p.id || `phase-local-${pIdx}-${Date.now()}`,
      title: p.title,
      position: pIdx + 1,
      tasks: p.tasks.map((t, tIdx) => ({
        id: t.id || `task-local-${tIdx}-${Date.now()}`,
        title: t.title,
        completed: false,
        position: tIdx + 1
      }))
    }));

    const newProj: Project = {
      id: `project-${Date.now()}`,
      title: data.title,
      recipeId,
      recipeTitle,
      category,
      phases,
      createdAt: new Date().toISOString(),
      privacy,
      progressPhotos: data.imageUrl
        ? [{ url: data.imageUrl, caption: 'Project Cover', date: new Date().toLocaleDateString() }]
        : []
    };

    const existing = await this.getProjects();
    await this.saveProjects([newProj, ...existing]);
    return newProj;
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
          title: recipe.title,
          category: recipe.category || 'General'
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
        category: projectRow.category || recipe.category || 'General',
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

        return postRows
          .filter(Boolean)
          .map(p => {
            if (!p) return null;
            const author = usersMap.get(p.user_id);
            const pMedia = (mediaRows || []).filter(m => m && m.post_id === p.id);
            const pFeedback = (feedbackRows || []).filter(f => f && f.post_id === p.id);
            const pComments = (commentsRows || []).filter(c => c && c.post_id === p.id);

            // Calculate feedback counts from post_feedback rows (never counter increments)
            const gongs = {
              continue: pFeedback.filter(f => f && f.feedback_type === 'success').length,
              refine: pFeedback.filter(f => f && f.feedback_type === 'promise').length,
              reconsider: pFeedback.filter(f => f && f.feedback_type === 'potential').length
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

            const displayAuthorName = author?.username || author?.first_name || 'Creator';

            return {
              id: p.id,
              type: 'update_logged',
              userId: p.user_id,
              userName: displayAuthorName,
              username: displayAuthorName,
              userAvatar: author?.avatar_storage_path ? getPublicMediaUrl('Gonnng', author.avatar_storage_path) : '',
              timeString: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recently',
              title: p.description?.substring(0, 60),
              content: p.description,
              projectId: p.project_id,
              image: primaryImage,
              media,
              privacy: 'public',
              createdAt: p.created_at,
              gongs,
              comments: formattedComments
            };
          }).filter(Boolean) as FeedPost[];
      }
    }
    const localPosts = getLocal<FeedPost[]>(KEYS.POSTS, []);
    return (Array.isArray(localPosts) ? localPosts : []).filter(Boolean);
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
        const { data: userRow } = await supabase.from('users').select('id, email, about, profile_visibility').eq('id', validUserId).maybeSingle();
        if (!userRow) {
          const rawSessName = (session?.name).trim();
          const sSpaceIdx = rawSessName.indexOf(' ');
          const sFirstName = sSpaceIdx === -1 ? rawSessName : rawSessName.substring(0, sSpaceIdx);
          const sLastName = sSpaceIdx === -1 ? '' : rawSessName.substring(sSpaceIdx + 1).trim();

          await supabase.from('users').upsert({
            id: validUserId,
            public_id: session?.publicId || session?.username || validUserId,
            username: session?.username || rawSessName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            first_name: sFirstName,
            last_name: sLastName,
            email: userRow?.email || session?.email,
            about: userRow?.about,
            profile_visibility: userRow?.profile_visibility
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
        description: post.content || post.description || post.title
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
      const localFb = getLocal<any[]>(KEYS.FEEDBACK, []);
      const arr = Array.isArray(localFb) ? localFb : [];
      const idx = arr.findIndex(f => f && (f.postId || f.post_id) === postId && (f.userId || f.user_id) === userId);

      if (idx >= 0) {
        arr[idx].feedbackType = feedbackType;
        arr[idx].feedback_type = feedbackType;
      } else {
        arr.push({ postId, userId, feedbackType, post_id: postId, user_id: userId, feedback_type: feedbackType });
      }
      setLocal(KEYS.FEEDBACK, arr);

      const postFb = arr.filter(f => f && (f.postId || f.post_id) === postId);
      return {
        continue: postFb.filter(f => f && (f.feedbackType || f.feedback_type) === 'success').length,
        refine: postFb.filter(f => f && (f.feedbackType || f.feedback_type) === 'promise').length,
        reconsider: postFb.filter(f => f && (f.feedbackType || f.feedback_type) === 'potential').length,
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

      const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();

      return {
        id: commentRow.id,
        userId: commentRow.user_id,
        userName: user?.username || user?.first_name || 'Creator',
        userAvatar: user?.avatar_storage_path ? getPublicMediaUrl('Gonnng', user.avatar_storage_path) : '',
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

      const targetPost = posts.find(p => p && p.id === postId);
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

    (commentsList || []).forEach(c => {
      if (!c) return;
      const cUserId = c.user_id || c.userId;
      const author = usersMap.get(cUserId);
      const item: PostComment = {
        id: c.id,
        userId: cUserId,
        userName: author?.username || author?.first_name || c.userName || 'Creator',
        userAvatar: author?.avatar_storage_path ? getPublicMediaUrl('Gonnng', author.avatar_storage_path) : (c.userAvatar || ''),
        body: c.body || c.content || '',
        content: c.body || c.content || '',
        timeString: c.created_at ? new Date(c.created_at).toLocaleTimeString() : (c.timeString || 'Recently'),
        parentId: c.parent_comment_id || c.parentId || null,
        createdAt: c.created_at || c.createdAt || new Date().toISOString(),
        children: []
      };
      map.set(c.id, item);
    });

    map.forEach(item => {
      if (item && item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children!.push(item);
      } else if (item) {
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
  },

  // ================= APP UPDATES & USER READ STATUSES =================
  async getAppUpdates(): Promise<Array<{
    id: string;
    title: string;
    subtitle: string;
    details?: string;
    category: 'Platform Release' | 'Feature Launch' | 'Account Notice' | 'System Update' | 'Gonnng Announcement';
    timeString: string;
    timestamp: number;
  }>> {
    if (this.isSupabaseActive() && supabase) {
      const { data, error } = await supabase.from('app_updates').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(u => ({
          id: u.id,
          title: u.title,
          subtitle: u.subtitle,
          details: u.details || undefined,
          category: u.category as any,
          timeString: new Date(u.created_at).toLocaleDateString(),
          timestamp: new Date(u.created_at).getTime()
        }));
      }
    }
    return [
      {
        id: 'a0000001-0000-0000-0000-000000000001',
        title: 'SandEngine v2.4 Engine Core Active',
        subtitle: 'Multi-phase canvas timeline processing & sub-task tracking',
        details: 'We have deployed the latest version of SandEngine v2.4 offering low-latency canvas timeline rendering, responsive phase sub-task tracking, and print layout support for creative recipes.',
        category: 'Platform Release',
        timeString: '2d ago',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
      },
      {
        id: 'a0000002-0000-0000-0000-000000000002',
        title: 'Recipe Forking & Library Sync',
        subtitle: 'Instantly fork community recipes directly into your custom library',
        details: 'Creators can now fork any public recipe, adapt the sequence milestones to their project workflow, and bookmark recipes to their library.',
        category: 'Feature Launch',
        timeString: '5d ago',
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000
      }
    ];
  },

  async getUserUpdateReads(userId: string): Promise<Record<string, boolean>> {
    if (this.isSupabaseActive() && supabase) {
      const { data, error } = await supabase
        .from('user_update_reads')
        .select('item_id')
        .eq('user_id', userId);
      if (!error && data) {
        const readsMap: Record<string, boolean> = {};
        data.forEach(row => { readsMap[row.item_id] = true; });
        return readsMap;
      }
    }
    const localReads = getLocal<Record<string, boolean>>('gonnng_user_update_reads_' + userId, {});
    return localReads;
  },

  async markUpdateAsRead(userId: string, updateType: 'post_feedback' | 'follower' | 'app_info', itemId: string): Promise<void> {
    if (this.isSupabaseActive() && supabase) {
      await supabase.from('user_update_reads').upsert(
        {
          user_id: userId,
          update_type: updateType,
          item_id: itemId,
          read_at: new Date().toISOString()
        },
        { onConflict: 'user_id, item_id' }
      );
    }
    const key = 'gonnng_user_update_reads_' + userId;
    const localReads = getLocal<Record<string, boolean>>(key, {});
    localReads[itemId] = true;
    setLocal(key, localReads);
  },

  async getPostNotifications(userId: string): Promise<Array<{
    id: string;
    postId: string;
    postTitle: string;
    actorName: string;
    actorAvatar: string;
    actionType: 'comment' | 'gong_continue' | 'gong_refine' | 'gong_reconsider' | 'recipe_save' | 'recipe_fork';
    commentSnippet?: string;
    timeString: string;
    timestamp: number;
  }>> {
    if (this.isSupabaseActive() && supabase) {
      const { data, error } = await supabase
        .from('user_post_notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(row => ({
          id: row.notification_id,
          postId: row.post_id,
          postTitle: row.post_title,
          actorName: row.actor_name || 'Community Member',
          actorAvatar: row.actor_avatar || '',
          actionType: row.action_type as any,
          commentSnippet: row.comment_snippet || undefined,
          timeString: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(row.created_at).getTime()
        }));
      }
    }
    return [];
  },

  async getFollowerNotifications(userId: string): Promise<Array<{
    id: string;
    creatorId: string;
    actorName: string;
    actorAvatar: string;
    timeString: string;
    timestamp: number;
  }>> {
    if (this.isSupabaseActive() && supabase) {
      const { data, error } = await supabase
        .from('user_follower_notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(row => ({
          id: row.notification_id,
          creatorId: row.creator_id,
          actorName: row.actor_name || 'Creative Member',
          actorAvatar: row.actor_avatar || '',
          timeString: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(row.created_at).getTime()
        }));
      }
    }
    return [];
  },

  // ================= DIRECT MESSAGES (DATABASE & STORAGE) =================
  async getDirectMessages(currentUserId: string): Promise<Array<{
    id: string;
    senderId: string;
    recipientId: string;
    text: string;
    isRead: boolean;
    status?: 'pending' | 'accepted';
    postThumbnail?: string;
    postId?: string;
    createdAt: number;
    timestamp: string;
  }>> {
    const formatTime = (ms: number): string => {
      const diffSec = Math.floor((Date.now() - ms) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      return new Date(ms).toLocaleDateString();
    };

    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(currentUserId)}`);
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.messages)) {
          if (body.messages.length > 0) {
            setLocal(KEYS.MESSAGES, body.messages);
            return body.messages;
          }
        }
      }
    } catch {
      // Fallback
    }

    if (this.isSupabaseActive() && supabase) {
      try {
        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map(row => {
            const createdAt = new Date(row.created_at).getTime();
            return {
              id: row.id,
              senderId: row.sender_id,
              recipientId: row.recipient_id,
              text: row.text,
              isRead: Boolean(row.is_read),
              status: row.status || 'accepted',
              postThumbnail: row.post_thumbnail || undefined,
              postId: row.post_id || undefined,
              createdAt,
              timestamp: formatTime(createdAt)
            };
          });
        }
      } catch {
        // Fallback
      }
    }

    // Local Storage Fallback Store
    let rawMessages = getLocal<any[]>(KEYS.MESSAGES, []);
    if (!Array.isArray(rawMessages)) {
      rawMessages = [];
    }

    return rawMessages
      .filter(m => m && (m.senderId === currentUserId || m.recipientId === currentUserId || m.sender_id === currentUserId || m.recipient_id === currentUserId))
      .map(m => {
        const createdAt = typeof m.createdAt === 'number' ? m.createdAt : new Date(m.created_at || Date.now()).getTime();
        return {
          id: m.id || `msg-${Math.random().toString(36).substring(2, 8)}`,
          senderId: m.senderId || m.sender_id || 'user-current',
          recipientId: m.recipientId || m.recipient_id || currentUserId,
          text: m.text || '',
          isRead: Boolean(m.isRead ?? m.is_read),
          status: m.status || 'accepted',
          postThumbnail: m.postThumbnail || m.post_thumbnail,
          postId: m.postId || m.post_id,
          createdAt,
          timestamp: formatTime(createdAt)
        };
      });
  },

  async sendDirectMessage(
    senderId: string,
    recipientId: string,
    text: string,
    postThumbnail?: string,
    postId?: string,
    status: 'pending' | 'accepted' = 'accepted'
  ): Promise<DirectMessage> {
    const createdAt = Date.now();
    const formatTime = 'Just now';
    const cleanedText = String(text || '').trim().slice(0, 1400);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId,
          recipientId,
          text: cleanedText,
          postThumbnail,
          postId,
          status
        })
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.message) {
          const localMsgs = getLocal<any[]>(KEYS.MESSAGES, []);
          localMsgs.push(body.message);
          setLocal(KEYS.MESSAGES, localMsgs);
          return body.message;
        }
      }
    } catch {
      // Fallback
    }

    if (this.isSupabaseActive() && supabase) {
      try {
        const newRow: any = {
          sender_id: senderId,
          recipient_id: recipientId,
          text,
          is_read: true,
          post_thumbnail: postThumbnail || null,
          post_id: postId || null
        };

        const { data, error } = await supabase
          .from('direct_messages')
          .insert(newRow)
          .select('*')
          .single();

        if (!error && data) {
          return {
            id: data.id,
            senderId: data.sender_id,
            recipientId: data.recipient_id,
            text: data.text,
            isRead: Boolean(data.is_read),
            status: data.status || status,
            postThumbnail: data.post_thumbnail || undefined,
            postId: data.post_id || undefined,
            timestamp: formatTime,
            createdAt
          };
        }
      } catch {
        // Fallback
      }
    }

    // Local Storage Fallback Store
    const localMsgs = getLocal<any[]>(KEYS.MESSAGES, []);
    const newMsgObj = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId,
      recipientId,
      text,
      isRead: true,
      status,
      postThumbnail,
      postId,
      createdAt
    };
    localMsgs.push(newMsgObj);
    setLocal(KEYS.MESSAGES, localMsgs);

    return {
      id: newMsgObj.id,
      senderId,
      recipientId,
      text,
      isRead: true,
      status,
      postThumbnail,
      postId,
      timestamp: formatTime,
      createdAt
    };
  },

  async acceptMessageRequest(currentUserId: string, partnerId: string): Promise<void> {
    try {
      await fetch('/api/messages/accept', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId, partnerId })
      });
    } catch {
      // Fallback
    }

    if (this.isSupabaseActive() && supabase) {
      try {
        await supabase
          .from('direct_messages')
          .update({ status: 'accepted' })
          .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${currentUserId})`);
      } catch {
        // Ignore
      }
    }

    const localMsgs = getLocal<any[]>(KEYS.MESSAGES, []);
    if (Array.isArray(localMsgs)) {
      const updated = localMsgs.map(m => {
        const rId = m.recipientId || m.recipient_id;
        const sId = m.senderId || m.sender_id;
        if ((rId === currentUserId && sId === partnerId) || (rId === partnerId && sId === currentUserId)) {
          return { ...m, status: 'accepted' };
        }
        return m;
      });
      setLocal(KEYS.MESSAGES, updated);
    }
  },

  async declineMessageRequest(currentUserId: string, partnerId: string): Promise<void> {
    try {
      await fetch('/api/messages/decline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId, partnerId })
      });
    } catch {
      // Fallback
    }

    if (this.isSupabaseActive() && supabase) {
      try {
        await supabase
          .from('direct_messages')
          .delete()
          .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${currentUserId})`);
      } catch {
        // Ignore
      }
    }

    const localMsgs = getLocal<any[]>(KEYS.MESSAGES, []);
    if (Array.isArray(localMsgs)) {
      const updated = localMsgs.filter(m => {
        const rId = m.recipientId || m.recipient_id;
        const sId = m.senderId || m.sender_id;
        return !((rId === currentUserId && sId === partnerId) || (rId === partnerId && sId === currentUserId));
      });
      setLocal(KEYS.MESSAGES, updated);
    }
  },

  async markDirectMessagesAsRead(currentUserId: string, partnerId: string): Promise<void> {
    try {
      await fetch('/api/messages/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId, partnerId })
      });
    } catch {
      // Fallback
    }

    if (this.isSupabaseActive() && supabase) {
      try {
        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .eq('recipient_id', currentUserId)
          .eq('sender_id', partnerId);
      } catch {
        // Ignore
      }
    }

    const localMsgs = getLocal<any[]>(KEYS.MESSAGES, []);
    if (Array.isArray(localMsgs)) {
      const updated = localMsgs.map(m => {
        const rId = m.recipientId || m.recipient_id;
        const sId = m.senderId || m.sender_id;
        if (rId === currentUserId && sId === partnerId) {
          return { ...m, isRead: true, is_read: true };
        }
        return m;
      });
      setLocal(KEYS.MESSAGES, updated);
    }
  },

  async getDirectMessageThreads(currentUserId: string, creators: Creator[]): Promise<MessageThread[]> {
    const allMsgs = await this.getDirectMessages(currentUserId);
    
    // Group messages by target partner creator ID
    const threadsMap = new Map<string, DirectMessage[]>();

    allMsgs.forEach(m => {
      const partnerId = m.senderId === currentUserId ? m.recipientId : m.senderId;
      if (!partnerId) return;
      if (!threadsMap.has(partnerId)) {
        threadsMap.set(partnerId, []);
      }
      threadsMap.get(partnerId)!.push({
        id: m.id,
        senderId: m.senderId,
        recipientId: m.recipientId,
        text: m.text,
        timestamp: m.timestamp,
        createdAt: m.createdAt,
        isRead: m.isRead,
        postThumbnail: m.postThumbnail,
        postId: m.postId
      });
    });

    const threads: MessageThread[] = [];

    threadsMap.forEach((msgs, partnerId) => {
      // Sort messages within thread chronologically
      msgs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      const partnerCreator: Creator = creators.find(c =>
        c.id === partnerId ||
        c.username === partnerId ||
        c.name.toLowerCase() === partnerId.toLowerCase()
      ) || {
        id: partnerId,
        name: partnerId.startsWith('creator-') ? partnerId.replace('creator-', '').toUpperCase() : partnerId,
        username: partnerId,
        email: `${partnerId}@gonnng.com`,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerId)}&background=F59E0B&color=fff`,
        bio: 'Creative collaborator on Gonnng.',
        goals: 'Process engineering and community builds.',
        privacyDefault: 'public' as const,
        followersCount: 1,
        followingCount: 1,
        isFollowing: false
      };

      const unreadCount = msgs.filter(m => m.recipientId === currentUserId && !m.isRead).length;
      const lastMsg = msgs[msgs.length - 1];
      const lastUpdated = lastMsg ? (lastMsg.createdAt || Date.now()) : Date.now();

      threads.push({
        creator: partnerCreator,
        messages: msgs,
        lastUpdated,
        unreadCount
      });
    });

    // Sort threads by most recent activity
    threads.sort((a, b) => b.lastUpdated - a.lastUpdated);

    return threads;
  }
};

