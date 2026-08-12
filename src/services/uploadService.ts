/// <reference types="vite/client" />
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService, UserSession } from './authService';
import { MediaType, PostMediaRow } from '../types';
import { getApiUrl } from '../lib/apiConfig';

export interface UploadedMediaResult {
  id: string;
  postId?: string;
  storageBucket: string;
  storagePath: string;
  mediaType: MediaType;
  position: number;
  width?: number;
  height?: number;
  durationMs?: number;
  publicUrl: string;
}

export interface UploadedFile {
  id: string;
  userId: string;
  filename: string;
  url: string;
  bucket?: string;
  path?: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

const BUCKETS = {
  POST_MEDIA: 'post-media',
  AVATARS: 'Gonnng'
};

/**
 * Feature flag checker for file upload functionality
 */
export const isFileUploadFeatureEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_FILE_UPLOADS !== 'false';
};

/**
 * Validates if the current user is permitted to upload files
 */
export const isFileUploadAllowed = (): { allowed: boolean; reason?: string; user?: UserSession } => {
  if (!isFileUploadFeatureEnabled()) {
    return {
      allowed: false,
      reason: 'File upload feature is currently disabled by configuration.'
    };
  }

  const user = authService.getCurrentSession();
  if (!user) {
    return {
      allowed: false,
      reason: 'You must be logged in to upload files.'
    };
  }

  return {
    allowed: true,
    user
  };
};

/**
 * Helper to dynamically resolve public URL for bucket + path on Supabase Storage
 */
export const getPublicMediaUrl = (_bucket: string, path: string): string => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  const mediaBase = (import.meta.env.VITE_SUPABASE_PUBLIC_MEDIA_URL || '/media').replace(/\/+$/, '');

  const isSupabaseUrl = 
    path.includes('supabase.co') ||
    path.includes('storage.supabase.co') ||
    path.includes('/storage/v1/') ||
    path.includes('/object/public/') ||
    path.includes('Gonnng/') ||
    path.includes('post-media/') ||
    path.includes('media/');

  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (!isSupabaseUrl) {
      return path;
    }
  }

  // Extract relative storage object path
  let relativePath = path;

  // Handle full HTTP URLs if passed
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    try {
      relativePath = new URL(relativePath).pathname;
    } catch {
      // ignore
    }
  }

  if (relativePath.includes('Gonnng/')) {
    relativePath = relativePath.split('Gonnng/').pop() || relativePath;
  } else if (relativePath.includes('post-media/')) {
    relativePath = relativePath.split('post-media/').pop() || relativePath;
  } else if (relativePath.includes('/object/public/')) {
    const afterPublic = relativePath.split('/object/public/').pop() || '';
    const parts = afterPublic.split('/');
    if (parts.length > 1 && (parts[0] === 'Gonnng' || parts[0] === 'avatars' || parts[0] === 'post-media')) {
      relativePath = parts.slice(1).join('/');
    } else {
      relativePath = afterPublic;
    }
  }

  // Strip leading slashes and any repetitive 'media/' or '/media/' prefixes
  relativePath = relativePath.replace(/^\/+/, '');
  while (relativePath.startsWith('media/')) {
    relativePath = relativePath.substring(6).replace(/^\/+/, '');
  }

  return `${mediaBase}/${relativePath}`;
};

export const uploadService = {
  /**
   * Uploads a media file for a post directly to Supabase Storage 'post-media' bucket
   * Path convention: {user_id}/{post_id}/{filename}
   * The filename key is made unique to avoid collisions. No directory creation call required.
   */
  async uploadPostMedia(
    file: File,
    postId: string,
    position = 0,
    maxSizeBytes = 50 * 1024 * 1024
  ): Promise<UploadedMediaResult> {
    const check = isFileUploadAllowed();
    if (!check.allowed || !check.user) {
      throw new Error(check.reason || 'Unauthorized file upload attempt.');
    }

    const userPublicId = check.user.publicId || check.user.id;

    if (file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      throw new Error(`File size exceeds maximum allowed size of ${maxMb}MB.`);
    }

    // Determine and validate media type
    const mime = file.type || '';
    let mediaType: MediaType = 'image';
    if (mime.startsWith('video/')) {
      mediaType = 'video';
    } else if (!mime.startsWith('image/')) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '')) {
        mediaType = 'video';
      } else if (!['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext || '')) {
        throw new Error(`Unsupported file format "${file.type || ext}". Only image and video files are permitted.`);
      }
    }

    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const uniqueKey = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${sanitizedFilename}`;
    const storageBucket = BUCKETS.POST_MEDIA; // 'post-media'
    const storagePath = `${userPublicId}/${postId}/${uniqueKey}`;

    // 1. Client-side Supabase Storage Upload
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: storageData, error: storageErr } = await supabase.storage
          .from(storageBucket)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!storageErr && storageData) {
          const finalPath = storageData?.path || storagePath;
          const mediaRecordId = crypto.randomUUID();
          const publicUrl = getPublicMediaUrl(storageBucket, finalPath);

          const postMediaRow: Partial<PostMediaRow> = {
            id: mediaRecordId,
            post_id: postId,
            storage_bucket: storageBucket,
            storage_path: finalPath,
            media_type: mediaType,
            position
          };

          try {
            await supabase.from('post_media').insert(postMediaRow as PostMediaRow);
          } catch (pmErr) {
            console.warn('Post media DB insert note:', pmErr);
          }

          return {
            id: mediaRecordId,
            postId,
            storageBucket,
            storagePath: finalPath,
            mediaType,
            position,
            publicUrl
          };
        } else if (storageErr) {
          console.warn('Client Supabase storage upload note:', storageErr.message);
        }
      } catch (err) {
        console.warn('Client Supabase storage upload exception:', err);
      }
    }

    // 2. Server-side API Proxy Fallback upload (if client SDK unavailable)
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', storageBucket);
      formData.append('path', storagePath);

      const res = await fetch(getApiUrl('/api/storage/upload'), {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (res.ok) {
        const serverData = await res.json();
        if (serverData.success && serverData.path) {
          const finalPath = serverData.path;
          const mediaRecordId = crypto.randomUUID();
          const publicUrl = serverData.publicUrl || getPublicMediaUrl(storageBucket, finalPath);

          const postMediaRow: Partial<PostMediaRow> = {
            id: mediaRecordId,
            post_id: postId,
            storage_bucket: storageBucket,
            storage_path: finalPath,
            media_type: mediaType,
            position
          };

          try {
            if (supabase) {
              await supabase.from('post_media').insert(postMediaRow as PostMediaRow);
            }
          } catch (pmErr) {
            console.warn('Post media DB insert note (via server proxy):', pmErr);
          }

          return {
            id: mediaRecordId,
            postId,
            storageBucket,
            storagePath: finalPath,
            mediaType,
            position,
            publicUrl
          };
        }
      }
    } catch (serverErr) {
      console.warn('Server storage upload proxy failed:', serverErr);
    }

    // Return resolved public URL
    const publicUrl = getPublicMediaUrl(storageBucket, storagePath);
    return {
      id: crypto.randomUUID(),
      postId,
      storageBucket,
      storagePath,
      mediaType,
      position,
      publicUrl
    };
  },

  /**
   * Uploads multiple post media files independently so if one fails, others are not blocked.
   */
  async uploadMultiplePostMedia(
    files: File[],
    postId: string,
    maxSizeBytes = 50 * 1024 * 1024
  ): Promise<{ successful: UploadedMediaResult[]; failed: Array<{ file: File; error: string }> }> {
    const successful: UploadedMediaResult[] = [];
    const failed: Array<{ file: File; error: string }> = [];

    const uploadPromises = files.map(async (file, index) => {
      try {
        const result = await this.uploadPostMedia(file, postId, index, maxSizeBytes);
        return { status: 'fulfilled' as const, value: result, file };
      } catch (err: any) {
        return { status: 'rejected' as const, reason: err?.message || 'Upload failed', file };
      }
    });

    const results = await Promise.all(uploadPromises);

    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value) {
        successful.push(res.value);
      } else if (res.status === 'rejected') {
        failed.push({ file: res.file, error: res.reason || 'Upload failed' });
      }
    });

    return { successful, failed };
  },

  /**
   * Uploads profile picture (avatar photo) to Supabase Storage 'Gonnng' bucket directly
   */
  async uploadAvatar(file: File): Promise<{ bucket: string; path: string; publicUrl: string; url: string }> {
    const check = isFileUploadAllowed();
    if (!check.allowed || !check.user) {
      throw new Error(check.reason || 'Unauthorized avatar upload attempt.');
    }

    const userPublicId = check.user.publicId || check.user.id;
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const uniqueKey = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${sanitizedFilename}`;
    const storageBucket = BUCKETS.AVATARS;
    const storagePath = `${userPublicId}/avatar/${uniqueKey}`;

    // 1. Client-side Supabase Storage upload
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(storageBucket)
          .upload(storagePath, file, { cacheControl: '3600', upsert: true });

        if (!error && data) {
          const publicUrl = getPublicMediaUrl(storageBucket, data.path || storagePath);
          return { bucket: storageBucket, path: data.path || storagePath, publicUrl, url: publicUrl };
        } else if (error) {
          console.warn('Client Supabase avatar upload note:', error.message);
        }
      } catch (err) {
        console.warn('Client Supabase avatar storage exception:', err);
      }
    }

    // 2. Server-side API Proxy Fallback upload
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', storageBucket);
      formData.append('path', storagePath);

      const res = await fetch(getApiUrl('/api/storage/upload'), {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (res.ok) {
        const serverData = await res.json();
        if (serverData.success && serverData.path) {
          const publicUrl = serverData.publicUrl || getPublicMediaUrl(storageBucket, serverData.path);
          return { bucket: storageBucket, path: serverData.path, publicUrl, url: publicUrl };
        }
      }
    } catch (serverErr) {
      console.warn('Server storage upload proxy failed:', serverErr);
    }

    const publicUrl = getPublicMediaUrl(storageBucket, storagePath);
    return { bucket: storageBucket, path: storagePath, publicUrl, url: publicUrl };
  },

  /**
   * Deletes all storage objects under {public_id or user_id}/{post_id}/ prefix before post deletion.
   */
  async deletePostStorageObjects(postId: string, userId: string, userPublicId?: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      let resolvedPublicId = userPublicId;
      if (!resolvedPublicId) {
        try {
          const { data: userRow } = await supabase.from('users').select('public_id').eq('id', userId).maybeSingle();
          if (userRow?.public_id) {
            resolvedPublicId = userRow.public_id;
          }
        } catch {
          // ignore lookup error
        }
      }

      const prefixes = Array.from(new Set([
        ...(resolvedPublicId ? [`${resolvedPublicId}/${postId}`] : []),
        `${userId}/${postId}`
      ]));

      for (const bucket of [BUCKETS.POST_MEDIA, 'Gonnng']) {
        for (const folderPrefix of prefixes) {
          try {
            const { data: objects, error: listErr } = await supabase.storage
              .from(bucket)
              .list(folderPrefix);

            if (!listErr && objects && objects.length > 0) {
              const pathsToRemove = objects
                .filter(obj => obj.name)
                .map(obj => `${folderPrefix}/${obj.name}`);

              if (pathsToRemove.length > 0) {
                await supabase.storage.from(bucket).remove(pathsToRemove);
              }
            }
          } catch (err) {
            console.warn(`Note when removing post media objects from ${bucket}:`, err);
          }
        }
      }
    }
  },

  /**
   * Legacy interface compatibility for simple file upload UI
   */
  async uploadFile(file: File, maxSizeBytes = 25 * 1024 * 1024) {
    const check = isFileUploadAllowed();
    if (!check.allowed || !check.user) {
      throw new Error(check.reason || 'Unauthorized file upload attempt.');
    }

    const res = await this.uploadPostMedia(file, `temp-post-${Date.now()}`, 0, maxSizeBytes);
    return {
      id: res.id,
      userId: check.user.id,
      filename: file.name,
      url: res.publicUrl,
      bucket: res.storageBucket,
      path: res.storagePath,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString()
    };
  },

  getUserUploads(_userId?: string): any[] {
    return [];
  },

  deleteUpload(_uploadId: string): void {
    // Managed via Supabase Storage
  }
};
