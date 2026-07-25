/// <reference types="vite/client" />
import { authService, UserSession } from './authService';

export interface UploadedFile {
  id: string;
  userId: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

const UPLOADS_STORAGE_KEY = 'gonnng_user_file_uploads';

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
      reason: 'File upload feature is currently disabled by configuration (VITE_ENABLE_FILE_UPLOADS=false).'
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

export const uploadService = {
  /**
   * Uploads a file for a logged in user and stores its metadata & base64 content
   */
  async uploadFile(file: File, maxSizeBytes = 10 * 1024 * 1024): Promise<UploadedFile> {
    const check = isFileUploadAllowed();
    if (!check.allowed || !check.user) {
      throw new Error(check.reason || 'Unauthorized file upload attempt.');
    }

    if (file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      throw new Error(`File size exceeds maximum allowed size of ${maxMb}MB.`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const dataUrl = reader.result as string;
          const newUpload: UploadedFile = {
            id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            userId: check.user!.id,
            filename: file.name,
            url: dataUrl,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
            uploadedAt: new Date().toISOString()
          };

          this.saveUploadRecord(newUpload);
          resolve(newUpload);
        } catch (err) {
          reject(new Error('Failed to process uploaded file data.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading input file.'));
      };

      reader.readAsDataURL(file);
    });
  },

  /**
   * Internal helper to persist upload metadata
   */
  saveUploadRecord(record: UploadedFile): void {
    try {
      const existingStr = localStorage.getItem(UPLOADS_STORAGE_KEY);
      const existing: UploadedFile[] = existingStr ? JSON.parse(existingStr) : [];
      existing.unshift(record);
      
      // Limit local storage to max 30 recent uploads to prevent exceeding localStorage quota
      const trimmed = existing.slice(0, 30);
      localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Could not persist upload record to localStorage quota:', e);
    }
  },

  /**
   * Retrieves all file uploads for the logged-in user
   */
  getUserUploads(userId?: string): UploadedFile[] {
    try {
      const targetUserId = userId || authService.getCurrentSession()?.id;
      if (!targetUserId) return [];

      const existingStr = localStorage.getItem(UPLOADS_STORAGE_KEY);
      if (!existingStr) return [];

      const allUploads: UploadedFile[] = JSON.parse(existingStr);
      return allUploads.filter(u => u.userId === targetUserId);
    } catch {
      return [];
    }
  },

  /**
   * Deletes a user upload record
   */
  deleteUpload(uploadId: string): void {
    try {
      const existingStr = localStorage.getItem(UPLOADS_STORAGE_KEY);
      if (!existingStr) return;

      const allUploads: UploadedFile[] = JSON.parse(existingStr);
      const updated = allUploads.filter(u => u.id !== uploadId);
      localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete upload:', e);
    }
  }
};
