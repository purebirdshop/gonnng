export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProfileVisibility = 'public' | 'internal' | 'private'
export type RecipeVisibility = 'private' | 'public'
export type MediaType = 'image' | 'video'
export type FeedbackType = 'success' | 'promise' | 'potential'
export type PermissionType = 'camera' | 'microphone' | 'file_access'
export type PermissionStatus = 'granted' | 'denied' | 'not_requested'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          public_id: string
          username: string
          first_name: string | null
          last_name: string | null
          email: string
          password_hash: string | null
          avatar_storage_path: string | null
          is_onboarded: boolean | null
          email_verified: boolean | null
          about: string | null
          profile_visibility: ProfileVisibility
          created_at: string
          updated_at?: string | null
        }
        Insert: {
          id?: string
          public_id: string
          username: string
          first_name?: string | null
          last_name?: string | null
          email: string
          password_hash?: string | null
          avatar_storage_path?: string | null
          is_onboarded?: boolean | null
          email_verified?: boolean | null
          about?: string | null
          profile_visibility?: ProfileVisibility
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          public_id?: string
          username?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          password_hash?: string | null
          avatar_storage_path?: string | null
          is_onboarded?: boolean | null
          email_verified?: boolean | null
          about?: string | null
          profile_visibility?: ProfileVisibility
          created_at?: string
          updated_at?: string | null
        }
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          visibility: RecipeVisibility
          forked_from_recipe_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          visibility?: RecipeVisibility
          forked_from_recipe_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          visibility?: RecipeVisibility
          forked_from_recipe_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recipe_phases: {
        Row: {
          id: string
          recipe_id: string
          title: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          title: string
          position: number
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          title?: string
          position?: number
          created_at?: string
        }
      }
      recipe_tasks: {
        Row: {
          id: string
          phase_id: string
          title: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          phase_id: string
          title: string
          position: number
          created_at?: string
        }
        Update: {
          id?: string
          phase_id?: string
          title?: string
          position?: number
          created_at?: string
        }
      }
      recipe_bookmarks: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          recipe_id: string | null
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id?: string | null
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string | null
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_phases: {
        Row: {
          id: string
          project_id: string
          source_phase_id: string | null
          title: string
          position: number
          is_complete: boolean
        }
        Insert: {
          id?: string
          project_id: string
          source_phase_id?: string | null
          title: string
          position: number
          is_complete?: boolean
        }
        Update: {
          id?: string
          project_id?: string
          source_phase_id?: string | null
          title?: string
          position?: number
          is_complete?: boolean
        }
      }
      project_tasks: {
        Row: {
          id: string
          project_phase_id: string
          source_task_id: string | null
          title: string
          position: number
          is_complete: boolean
        }
        Insert: {
          id?: string
          project_phase_id: string
          source_task_id?: string | null
          title: string
          position: number
          is_complete?: boolean
        }
        Update: {
          id?: string
          project_phase_id?: string
          source_task_id?: string | null
          title?: string
          position?: number
          is_complete?: boolean
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          description?: string | null
          created_at?: string
        }
      }
      post_media: {
        Row: {
          id: string
          post_id: string
          storage_bucket: string
          storage_path: string
          media_type: MediaType
          position: number
          width: number | null
          height: number | null
          duration_ms: number | null
        }
        Insert: {
          id?: string
          post_id: string
          storage_bucket: string
          storage_path: string
          media_type: MediaType
          position: number
          width?: number | null
          height?: number | null
          duration_ms?: number | null
        }
        Update: {
          id?: string
          post_id?: string
          storage_bucket?: string
          storage_path?: string
          media_type?: MediaType
          position?: number
          width?: number | null
          height?: number | null
          duration_ms?: number | null
        }
      }
      post_feedback: {
        Row: {
          id: string
          post_id: string
          user_id: string
          feedback_type: FeedbackType
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          feedback_type: FeedbackType
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          feedback_type?: FeedbackType
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          parent_comment_id: string | null
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          parent_comment_id?: string | null
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          parent_comment_id?: string | null
          body?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          followee_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          followee_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          followee_id?: string
          created_at?: string
        }
      }
      user_device_permissions: {
        Row: {
          id: string
          user_id: string
          device_id: string
          permission_type: PermissionType
          status: PermissionStatus
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          permission_type: PermissionType
          status?: PermissionStatus
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          permission_type?: PermissionType
          status?: PermissionStatus
          updated_at?: string
        }
      }
    }
    Views: {
      circles: {
        Row: {
          user_id: string | null
          circle_user_id: string | null
        }
      }
    }
  }
}
