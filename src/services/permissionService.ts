import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PermissionType, PermissionStatus } from '../lib/database.types';

export interface UserDevicePermissionRecord {
  id: string;
  user_id: string;
  device_id: string;
  permission_type: PermissionType;
  status: PermissionStatus;
  updated_at: string;
}

const DEVICE_ID_KEY = 'gonnng_device_id';
const LOCAL_PERMISSIONS_KEY = 'gonnng_device_permissions';

/**
 * Stable device identifier generated once per app install/browser and persisted in local storage.
 */
export function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return 'dev-browser-default';
  }
}

/**
 * Reads local cached permission records
 */
function getLocalPermissionsMap(): Record<string, PermissionStatus> {
  try {
    const raw = localStorage.getItem(LOCAL_PERMISSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves local cached permission status
 */
function setLocalPermissionStatus(userId: string, type: PermissionType, status: PermissionStatus): void {
  try {
    const map = getLocalPermissionsMap();
    const key = `${userId}:${type}`;
    map[key] = status;
    localStorage.setItem(LOCAL_PERMISSIONS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to store local device permission status:', e);
  }
}

export const permissionService = {
  getDeviceId(): string {
    return getOrCreateDeviceId();
  },

  /**
   * 1. checkPermissionStatus(type) — Silent query of current OS/browser permission state.
   * NEVER shows a system dialog. Safe to call anytime.
   */
  async checkPermissionStatus(type: PermissionType): Promise<PermissionStatus> {
    try {
      if (typeof navigator === 'undefined') return 'not_requested';

      if (type === 'camera' || type === 'microphone') {
        const permName = type as unknown as PermissionName;
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const status = await navigator.permissions.query({ name: permName });
            if (status.state === 'granted') return 'granted';
            if (status.state === 'denied') return 'denied';
            if (status.state === 'prompt') return 'not_requested';
          } catch {
            // Permission query for camera/mic not supported by all browsers (e.g. Firefox/Safari)
          }
        }
        return 'not_requested';
      }

      if (type === 'file_access') {
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const status = await navigator.permissions.query({ name: 'file-system' as any });
            if (status.state === 'granted') return 'granted';
            if (status.state === 'denied') return 'denied';
          } catch {
            // Fallback for file access permission on web
          }
        }
        return 'granted';
      }

      return 'not_requested';
    } catch {
      return 'not_requested';
    }
  },

  /**
   * 2. requestPermission(type) — Triggers actual OS system dialog asking user to grant/deny.
   * ONLY call this when checkPermissionStatus or stored row says 'not_requested'.
   */
  async requestPermission(type: PermissionType): Promise<PermissionStatus> {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        return 'denied';
      }

      if (type === 'camera') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          return 'granted';
        } catch (err: any) {
          console.warn('Camera request permission result: denied', err);
          return 'denied';
        }
      }

      if (type === 'microphone') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          return 'granted';
        } catch (err: any) {
          console.warn('Microphone request permission result: denied', err);
          return 'denied';
        }
      }

      if (type === 'file_access') {
        return 'granted';
      }

      return 'denied';
    } catch {
      return 'denied';
    }
  },

  /**
   * Retrieves stored permission status for (userId, deviceId, type) from DB or local cache
   */
  async getStoredPermission(userId: string, type: PermissionType): Promise<PermissionStatus | null> {
    const deviceId = this.getDeviceId();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_device_permissions')
          .select('status')
          .eq('user_id', userId)
          .eq('device_id', deviceId)
          .eq('permission_type', type)
          .maybeSingle();

        if (!error && data) {
          return data.status as PermissionStatus;
        }
      } catch (e) {
        console.warn('Supabase user_device_permissions fetch note:', e);
      }
    }

    const localMap = getLocalPermissionsMap();
    const key = `${userId}:${type}`;
    return localMap[key] || null;
  },

  /**
   * Upserts permission status into user_device_permissions table & local cache
   */
  async upsertPermission(userId: string, type: PermissionType, status: PermissionStatus): Promise<void> {
    const deviceId = this.getDeviceId();
    setLocalPermissionStatus(userId, type, status);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('user_device_permissions')
          .upsert(
            {
              user_id: userId,
              device_id: deviceId,
              permission_type: type,
              status,
              updated_at: new Date().toISOString()
            },
            {
              onConflict: 'user_id,device_id,permission_type'
            }
          );
      } catch (e) {
        console.warn('Failed to upsert user_device_permissions in Supabase:', e);
      }
    }
  },

  /**
   * Flow 1: Login / Cold Start
   * On login and cold app open, performs SILENT checks (checkPermissionStatus)
   * or loads stored permission records.
   * NEVER calls requestPermission(type) on cold start/login!
   */
  async onLoginOrColdStart(userId: string): Promise<Record<PermissionType, PermissionStatus>> {
    const types: PermissionType[] = ['camera', 'microphone', 'file_access'];
    const results: Record<PermissionType, PermissionStatus> = {
      camera: 'not_requested',
      microphone: 'not_requested',
      file_access: 'not_requested'
    };

    for (const type of types) {
      const stored = await this.getStoredPermission(userId, type);
      const liveStatus = await this.checkPermissionStatus(type);

      if (stored && stored !== 'not_requested') {
        const finalStatus = (liveStatus === 'granted' || liveStatus === 'denied') ? liveStatus : stored;
        results[type] = finalStatus;
      } else if (liveStatus !== 'not_requested') {
        results[type] = liveStatus;
        await this.upsertPermission(userId, type, liveStatus);
      } else {
        // Leave as 'not_requested'. Do NOT trigger OS getUserMedia prompt on cold start!
        results[type] = 'not_requested';
      }
    }

    return results;
  },

  /**
   * Flow 2: Sync on App Foreground / Resume
   * Runs checkPermissionStatus silently for all 3 types and updates stale rows.
   * NEVER calls requestPermission.
   */
  async onForegroundSync(userId: string): Promise<Record<PermissionType, PermissionStatus>> {
    const types: PermissionType[] = ['camera', 'microphone', 'file_access'];
    const results: Record<PermissionType, PermissionStatus> = {
      camera: 'not_requested',
      microphone: 'not_requested',
      file_access: 'not_requested'
    };

    for (const type of types) {
      const stored = await this.getStoredPermission(userId, type);
      const liveStatus = await this.checkPermissionStatus(type);

      if (liveStatus !== 'not_requested' && liveStatus !== stored) {
        await this.upsertPermission(userId, type, liveStatus);
        results[type] = liveStatus;
      } else {
        results[type] = stored || 'not_requested';
      }
    }

    return results;
  },

  /**
   * Flow 3: Read permissions for current device for Profile Settings
   */
  async getProfileSettingsPermissions(userId: string): Promise<Record<PermissionType, PermissionStatus>> {
    const types: PermissionType[] = ['camera', 'microphone', 'file_access'];
    const results: Record<PermissionType, PermissionStatus> = {
      camera: 'not_requested',
      microphone: 'not_requested',
      file_access: 'not_requested'
    };

    for (const type of types) {
      // Run silent check first to reflect live truth
      const liveStatus = await this.checkPermissionStatus(type);
      const stored = await this.getStoredPermission(userId, type);

      if (liveStatus !== 'not_requested') {
        if (liveStatus !== stored) {
          await this.upsertPermission(userId, type, liveStatus);
        }
        results[type] = liveStatus;
      } else {
        results[type] = stored || 'not_requested';
      }
    }

    return results;
  }
};
