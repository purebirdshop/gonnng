import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Creator, FeedPost, Project, Recipe } from '../types';
import PostTile from './PostTile';
import { getFollowersOfUser, getFollowingOfUser, getCircleOfUser, isFollowingUser, isFollowedByUser, isUserInCircle } from '../utils/followUtils';
import { User, Shield, Users, Save, Globe, Lock, Goal, BookOpen, Star, X, Search, UserPlus, UserCheck, Upload, File, LogOut, Camera, Image as ImageIcon, Disc3, Pencil, Octagon, ArrowUpRight, MessageSquare, CircleDotDashed, Album, Cookie, MessageSquareShare } from 'lucide-react';
import Feed from './Feed';
import FileUploadZone from './FileUploadZone';
import { UploadedFile, uploadService, getPublicMediaUrl } from '../services/uploadService';
import { permissionService } from '../services/permissionService';
import { PermissionType, PermissionStatus } from '../lib/database.types';
import { authService } from '../services/authService';

export interface AppPermissions {
  camera: boolean;
  microphone: boolean;
  files: boolean;
}

interface UserProfileProps {
  currentUser: Creator;
  onUpdateUser: (updated: Creator) => void | Promise<void>;
  allCreators: Creator[];
  onToggleFollowCreator: (id: string) => void;
  onToggleCircleCreator?: (id: string) => void;
  onOpenPhilosophy?: () => void;
  onOpenCreatorProfile?: (creatorId: string) => void;
  onSignOut?: () => void;
  onOpenCookiePreferences?: () => void;

  // Permissions State
  permissions?: AppPermissions;
  onUpdatePermissions?: (updated: AppPermissions) => void;

  // Settings Drawer State
  isSettingsDrawerOpen: boolean;
  setIsSettingsDrawerOpen: (open: boolean) => void;

  // Feed props for MINE filter feed in Profile
  posts: FeedPost[];
  onUpdatePostGong: (postId: string, gongType: 'continue' | 'refine' | 'reconsider') => void;
  onAddComment?: (postId: string, commentContent: string, parentId?: string, replyToUser?: string) => void;
  onToggleCommentHeart?: (postId: string, commentId: string) => void;
  setShowTutorial: (show: boolean) => void;

  // Superimposed Post from Updates
  superimposedPost?: FeedPost | null;
  onClearSuperimposedPost?: () => void;
  onOpenShareDrawer?: (post: FeedPost) => void;
  autoOpenCommentsPostId?: string | null;
  projects?: Project[];
  recipes?: Recipe[];
  onStartProject?: () => void;
  onCreateRecipe?: () => void;
}

export default function UserProfile({ 
  currentUser, 
  onUpdateUser, 
  allCreators, 
  onToggleFollowCreator,
  onToggleCircleCreator,
  onOpenPhilosophy,
  onOpenCreatorProfile,
  onSignOut,
  onOpenCookiePreferences,
  permissions,
  onUpdatePermissions,
  isSettingsDrawerOpen,
  setIsSettingsDrawerOpen,
  posts,
  onUpdatePostGong,
  onAddComment,
  onToggleCommentHeart,
  setShowTutorial,
  superimposedPost,
  onClearSuperimposedPost,
  onOpenShareDrawer,
  autoOpenCommentsPostId,
  projects = [],
  recipes = [],
  onStartProject,
  onCreateRecipe
}: UserProfileProps) {
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [goals, setGoals] = useState(currentUser.goals);
  const [privacy, setPrivacy] = useState<"public" | "internal" | "private">(currentUser.privacyDefault || 'public');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Sync profile form state when currentUser or settings drawer state changes
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setBio(currentUser.bio || '');
      setGoals(currentUser.goals || '');
      setPrivacy(currentUser.privacyDefault || 'public');
      setAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser, isSettingsDrawerOpen]);

  // Device permissions table state
  const [detailedPermissions, setDetailedPermissions] = useState<Record<PermissionType, PermissionStatus>>({
    camera: permissions?.camera ? 'granted' : 'not_requested',
    microphone: permissions?.microphone ? 'granted' : 'not_requested',
    file_access: permissions?.files ? 'granted' : 'not_requested'
  });

  const [permissionGuidanceModal, setPermissionGuidanceModal] = useState<{
    isOpen: boolean;
    type: PermissionType;
    title: string;
    message: string;
  } | null>(null);

  // Flow 3: On settings drawer open / mount, run silent checkPermissionStatus for live status
  React.useEffect(() => {
    if (isSettingsDrawerOpen && currentUser?.id) {
      permissionService.getProfileSettingsPermissions(currentUser.id).then(statusMap => {
        setDetailedPermissions(statusMap);
        if (onUpdatePermissions) {
          onUpdatePermissions({
            camera: statusMap.camera === 'granted',
            microphone: statusMap.microphone === 'granted',
            files: statusMap.file_access === 'granted'
          });
        }
      }).catch(() => {});
    }
  }, [isSettingsDrawerOpen, currentUser?.id]);

  // Flow 4: Handle permission toggle interaction per strict requirements
  const handleTogglePermission = async (type: PermissionType) => {
    if (!currentUser?.id) return;

    const currentStatus = detailedPermissions[type] || 'not_requested';

    if (currentStatus === 'not_requested') {
      // Toggling ON from not_requested -> Call requestPermission(type)
      const result = await permissionService.requestPermission(type);
      await permissionService.upsertPermission(currentUser.id, type, result);
      setDetailedPermissions(prev => ({ ...prev, [type]: result }));

      const isGranted = result === 'granted';
      const updatedCamera = type === 'camera' ? isGranted : detailedPermissions.camera === 'granted';
      const updatedMicrophone = type === 'microphone' ? isGranted : detailedPermissions.microphone === 'granted';
      const updatedFiles = type === 'file_access' ? isGranted : detailedPermissions.file_access === 'granted';

      if (onUpdatePermissions) {
        onUpdatePermissions({
          camera: updatedCamera,
          microphone: updatedMicrophone,
          files: updatedFiles
        });
      }

      if (result === 'denied') {
        setPermissionGuidanceModal({
          isOpen: true,
          type,
          title: `Permission Denied`,
          message: `Device permission for ${type.replace('_', ' ')} was denied in the dialog.`
        });
      }
    } else if (currentStatus === 'denied') {
      // Toggling ON when denied -> Do NOT call requestPermission. Deep-link / guide to OS settings
      setPermissionGuidanceModal({
        isOpen: true,
        type,
        title: `Enable Permission in Device Settings`,
        message: `Permission for ${type.replace('_', ' ')} is currently denied at the OS/browser level. Calling request permission cannot re-prompt a denied permission. Please enable it in your device or browser settings.`
      });
    } else if (currentStatus === 'granted') {
      // Toggling OFF when granted -> Cannot revoke OS-level grant. Show guidance, do NOT write denied to DB
      setPermissionGuidanceModal({
        isOpen: true,
        type,
        title: `Disable Permission in Device Settings`,
        message: `To revoke ${type.replace('_', ' ')} access, please disable it in your device or browser settings. Upon returning to Gonnng, the status will automatically update.`
      });
    }
  };

  // Followers / Following / Circle Modal State
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [modalTab, setModalTab] = useState<'circle' | 'followers' | 'following'>('circle');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [modalSnapshotIds, setModalSnapshotIds] = useState<string[] | null>(null);

  // Snapshot list when modal opens or tab changes so unfollowed users stay in list for safety/re-following
  React.useEffect(() => {
    if (showUserListModal) {
      const list = modalTab === 'circle' 
        ? getCircleOfUser(currentUser, allCreators)
        : modalTab === 'following'
        ? getFollowingOfUser(currentUser, allCreators)
        : getFollowersOfUser(currentUser, allCreators);
      setModalSnapshotIds(list.map(c => c.id));
    } else {
      setModalSnapshotIds(null);
    }
  }, [showUserListModal, modalTab]);

  // Comment Modal State for superimposed post
  const [commentModalPost, setCommentModalPost] = useState<FeedPost | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [replyingToComment, setReplyingToComment] = useState<{ id: string; userName: string } | null>(null);

  React.useEffect(() => {
    if (autoOpenCommentsPostId) {
      const match = posts.find(p => p.id === autoOpenCommentsPostId) || (superimposedPost?.id === autoOpenCommentsPostId ? superimposedPost : null);
      if (match) {
        setCommentModalPost(match);
      }
    }
  }, [autoOpenCommentsPostId, superimposedPost, posts]);

  const [isSaving, setIsSaving] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    let finalAvatarUrl = avatarUrl;
    let finalAvatarPath = currentUser.avatarPath || currentUser.avatarStoragePath || '';

    try {
      if (selectedAvatarFile) {
        setIsUploadingAvatar(true);
        try {
          const uploaded = await uploadService.uploadAvatar(selectedAvatarFile);
          finalAvatarUrl = uploaded.publicUrl || uploaded.url || finalAvatarUrl;
          finalAvatarPath = uploaded.path;
          setAvatarUrl(finalAvatarUrl);
        } catch (uploadErr) {
          console.error('Failed to upload avatar during configuration save:', uploadErr);
        } finally {
          setIsUploadingAvatar(false);
          setSelectedAvatarFile(null);
        }
      }

      await onUpdateUser({
        ...currentUser,
        name,
        bio,
        goals,
        privacyDefault: privacy,
        avatarUrl: finalAvatarUrl,
        avatarPath: finalAvatarPath,
        avatarStoragePath: finalAvatarPath
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save profile configuration:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const followersList = getFollowersOfUser(currentUser, allCreators);
  const followingList = getFollowingOfUser(currentUser, allCreators);
  const circleList = getCircleOfUser(currentUser, allCreators);

  const liveTabList = modalTab === 'circle' ? circleList : modalTab === 'following' ? followingList : followersList;

  const currentTabList = (showUserListModal && modalSnapshotIds !== null)
    ? modalSnapshotIds.map(id => allCreators.find(c => c.id === id)).filter((c): c is Creator => Boolean(c))
    : liveTabList;

  const displayedModalCreators = currentTabList.filter(c => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    const handle = (c.username || c.name.toLowerCase().replace(/\s+/g, '')).toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.bio && c.bio.toLowerCase().includes(q)) || handle.includes(q);
  });

  return (
    <div 
      className="max-w-4xl mx-auto text-white px-0 w-full min-w-0 h-[calc(100vh-130px)] sm:h-auto overflow-y-scroll sm:overflow-visible snap-y snap-mandatory scroll-smooth sm:scroll-auto no-scrollbar space-y-0 sm:space-y-6" 
      id="profile-scroll-container"
    >
      {/* Superimposed Post Modal Overlay from Updates / Shared Messages */}
      {superimposedPost && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-0 sm:p-6 overflow-y-auto bg-gray-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full h-full sm:h-auto max-w-none sm:max-w-2xl max-h-full sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-[#F59E0B] space-y-4 my-auto relative bg-white text-gray-900"
            id="superimposed-post-container"
          >
            {/* Header Badge & Icon-only Close Action */}
            <div className="flex items-center justify-between pb-2 border-b border-[#F59E0B]/30 bg-[#F59E0B]/15 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
                <span className="text-xs font-mono font-black text-[#F59E0B] uppercase tracking-wider">
                  LINKED UPDATE POST
                </span>
                <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">
                  • gonnng.com/g/{superimposedPost.id}
                </span>
              </div>

              {onClearSuperimposedPost && (
                <button
                  type="button"
                  onClick={onClearSuperimposedPost}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg cursor-pointer transition-colors flex items-center justify-center"
                  title="Close Post Modal"
                  aria-label="Close Post Modal"
                >
                  <X className="w-4 h-4 text-[#F59E0B]" />
                </button>
              )}
            </div>

            <PostTile
              post={superimposedPost}
              currentUser={currentUser}
              allCreators={allCreators}
              onUpdatePostGong={onUpdatePostGong}
              onOpenComments={(p) => setCommentModalPost(p)}
              onOpenShareDrawer={onOpenShareDrawer}
              onOpenCreatorProfile={onOpenCreatorProfile}
              onSelectPostDetails={(p) => setCommentModalPost(p)}
              isSuperimposed={true}
              onClearSuperimposedPost={onClearSuperimposedPost}
            />
          </motion.div>
        </div>
      )}

      {/* Header Visual Panel - Full Screen First Tile on Mobile for Sticky Scroll */}
      <div 
        className="snap-start snap-always w-full h-[calc(100vh-140px)] sm:h-auto shrink-0 flex flex-col justify-between border px-0 pt-3 pb-[18px] relative mb-0 rounded-none bg-white border-gray-200 text-gray-900 shadow-sm"
        id="profile-first-tile"
      >
        {/* Top Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5 min-w-0 w-full pl-4 pb-3">
          <div className="w-28 h-28 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-display font-bold shadow-lg border-4 relative overflow-hidden shrink-0 mx-auto sm:mx-0 bg-gray-200 border-gray-300 text-gray-800">
            {currentUser.avatarUrl && currentUser.avatarUrl.trim() !== '' ? (
              <img src={getPublicMediaUrl('Gonnng', currentUser.avatarUrl.trim())} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-14 h-14 sm:w-10 sm:h-10 text-gray-600" />
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-display font-black truncate text-gray-900">
                {currentUser.name}
              </h2>
              <button
                type="button"
                id="profile-share-btn"
                onClick={() => {
                  if (onOpenShareDrawer) {
                    onOpenShareDrawer({
                      id: currentUser.id,
                      type: 'update_logged',
                      userId: currentUser.id,
                      title: `${currentUser.name}'s Profile`,
                      content: currentUser.bio || 'Gonnng Creator Profile',
                      userName: currentUser.name,
                      userAvatar: currentUser.avatarUrl,
                      timeString: 'Active now',
                      privacy: currentUser.privacyDefault,
                      gongs: { continue: 0, refine: 0, reconsider: 0 }
                    });
                  }
                }}
                className="p-1.5 bg-[#F59E0B] hover:bg-[#FF751A] text-black rounded-xl transition-all shadow cursor-pointer shrink-0"
                title="Share Profile"
              >
                <MessageSquareShare className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
            <p className="text-xs font-mono truncate text-gray-600">
              @{currentUser.name.toLowerCase().replace(/\s+/g, '')} • {currentUser.email}
            </p>
          </div>
        </div>

        {/* Middle Section: Bio & Goal */}
        <div 
          onClick={() => setIsSettingsDrawerOpen(true)}
          className="my-auto py-4 space-y-3 border p-4 mx-3 mb-3 rounded-2xl bg-gray-50 border-gray-200 text-gray-800 cursor-pointer hover:bg-gray-100/80 transition-colors"
          title="Click to edit profile bio and goals"
        >
          <p className="text-xs leading-relaxed italic text-gray-800">
            "{currentUser.bio && currentUser.bio.trim() !== '' ? currentUser.bio : ""}"
          </p>
          <div className="text-[11px] font-mono pt-2 border-t flex items-center gap-1.5 border-gray-200 text-gray-600">
            <Goal className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Current Goal: <strong className="font-sans text-gray-900">{currentUser.goals && currentUser.goals.trim() !== '' ? currentUser.goals : ""}</strong></span>
          </div>
        </div>

        {/* Bottom Section: Followers/Following/Circle Stats & Privacy */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-3 border-t w-full border-gray-200">
          <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto px-0">
            <button
              type="button"
              id="profile-circle-btn"
              onClick={() => {
                setModalTab('circle');
                setUserSearchQuery('');
                setShowUserListModal(true);
              }}
              className="text-[10px] leading-[10px] font-mono transition-all cursor-pointer group flex items-center gap-1.5 px-3.5 py-2 rounded-xl border active:scale-95 bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
              title="Click to view My Circle"
            >
              <strong className="font-sans text-sm group-hover:text-[#F59E0B] transition-colors text-gray-900">{circleList.length}</strong> MY CIRCLE
            </button>
            <button
              type="button"
              id="profile-followers-btn"
              onClick={() => {
                setModalTab('followers');
                setUserSearchQuery('');
                setShowUserListModal(true);
              }}
              className="text-[10px] leading-[10px] font-mono transition-all cursor-pointer group flex items-center gap-1.5 px-3.5 py-2 rounded-xl border active:scale-95 bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
              title="Click to view Followers"
            >
              <strong className="font-sans text-sm group-hover:text-[#F59E0B] transition-colors text-gray-900">{followersList.length}</strong> FOLLOWERS
            </button>
            <button
              type="button"
              id="profile-following-btn"
              onClick={() => {
                setModalTab('following');
                setUserSearchQuery('');
                setShowUserListModal(true);
              }}
              className="text-[10px] leading-[10px] font-mono transition-all cursor-pointer group flex items-center gap-1.5 px-3.5 py-2 rounded-xl border active:scale-95 bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
              title="Click to view Following"
            >
              <strong className="font-sans text-sm group-hover:text-[#F59E0B] transition-colors text-gray-900">{followingList.length}</strong> FOLLOWING
            </button>
          </div>

          <div className="flex items-center gap-2 border px-3 py-2 rounded-xl bg-gray-50 border-gray-200 text-gray-700">
            <Shield className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="text-[10px] font-mono uppercase">
              <strong className="text-[#F59E0B] font-sans">{privacy}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Feed Component with MINE filter applied */}
      <div className="space-y-4">
        <Feed 
          posts={posts}
          currentUserId={currentUser.id}
          currentUser={currentUser}
          creators={allCreators}
          projects={projects}
          recipes={recipes}
          filter="private"
          isEmbedded={true}
          onUpdatePostGong={onUpdatePostGong}
          onAddComment={onAddComment}
          onToggleCommentHeart={onToggleCommentHeart}
          onOpenCreatorProfile={onOpenCreatorProfile}
          onOpenShareDrawer={onOpenShareDrawer}
          onStartProject={onStartProject}
          onCreateRecipe={onCreateRecipe}
        />
      </div>
      {/* Followers & Following User List Modal */}
      <AnimatePresence>
        {showUserListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="rounded-none sm:rounded-3xl p-5 sm:p-6 w-full h-full sm:h-auto max-w-none sm:max-w-md shadow-2xl flex flex-col max-h-full sm:max-h-[85vh] space-y-4 border bg-white border-gray-200 text-gray-900"
            >
              {/* Modal Header with Tabs */}
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-1 sm:gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    id="modal-tab-circle-btn"
                    onClick={() => {
                      setModalTab('circle');
                      setUserSearchQuery('');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      modalTab === 'circle'
                        ? 'bg-[#F59E0B] text-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    My Circle ({circleList.length})
                  </button>
                  <button
                    type="button"
                    id="modal-tab-followers-btn"
                    onClick={() => {
                      setModalTab('followers');
                      setUserSearchQuery('');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      modalTab === 'followers'
                        ? 'bg-[#F59E0B] text-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Followers ({followersList.length})
                  </button>
                  <button
                    type="button"
                    id="modal-tab-following-btn"
                    onClick={() => {
                      setModalTab('following');
                      setUserSearchQuery('');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      modalTab === 'following'
                        ? 'bg-[#F59E0B] text-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Following ({followingList.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUserListModal(false)}
                  className="p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full text-xs font-mono cursor-pointer transition-colors"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar inside Modal */}
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder={`Search ${modalTab}...`}
                  className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#F59E0B]"
                />
                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUserSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* User List Container */}
              <div className="overflow-y-auto flex-1 space-y-2 pr-1 max-h-[400px]">
                {displayedModalCreators.length > 0 ? (
                  displayedModalCreators.map((creator) => {
                    const isMe = creator.id === currentUser.id;
                    const amIFollowing = isFollowingUser(currentUser, creator.id, allCreators);
                    const doesUserFollowMe = isFollowedByUser(currentUser, creator.id, allCreators);
                    const isMutualCircle = amIFollowing && doesUserFollowMe;

                    return (
                      <div
                        key={creator.id}
                        className="bg-white/5 border border-white/10 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                      >
                        <div 
                          onClick={() => {
                            setShowUserListModal(false);
                            onOpenCreatorProfile?.(creator.id);
                          }}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-all group"
                          title={`View ${creator.name}'s profile`}
                        >
                          <img
                            src={getPublicMediaUrl('Gonnng', creator.avatarUrl)}
                            alt={creator.name}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-white/10 shrink-0 ${
                              amIFollowing ? 'ring-2 ring-[#F59E0B] ring-offset-1 ring-offset-[#141414]' : ''
                            }`}
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-white truncate group-hover:underline">{creator.name}</h4>
                              {isMe && (
                                <span className="text-[9px] font-mono font-bold bg-white/20 text-white border border-white/30 px-1.5 py-0.2 rounded-full">
                                  You
                                </span>
                              )}
                              {!isMe && isMutualCircle && (
                                <span className="text-[9px] font-mono font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 px-1.5 py-0.2 rounded-full">
                                  In Circle
                                </span>
                              )}
                              {!isMe && !amIFollowing && doesUserFollowMe && (
                                <span className="text-[9px] font-mono text-white/60 bg-white/10 px-1.5 py-0.2 rounded-full">
                                  Follows you
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-white/50 truncate">
                              @{creator.username || creator.name.toLowerCase().replace(/\s+/g, '')}
                            </p>
                          </div>
                        </div>

                        {!isMe ? (
                          <button
                            type="button"
                            onClick={() => onToggleFollowCreator(creator.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                              isMutualCircle
                                ? 'bg-[#F59E0B]/20 hover:bg-red-500/20 text-[#F59E0B] hover:text-red-400 border border-[#F59E0B]/40 hover:border-red-500/30'
                                : amIFollowing
                                ? 'bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10 hover:border-red-500/30'
                                : doesUserFollowMe
                                ? 'bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black shadow-sm'
                                : 'bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black shadow-sm'
                            }`}
                          >
                            {isMutualCircle ? (
                              <>
                                <CircleDotDashed className="w-3 h-3 text-[#F59E0B]" /> Circle
                              </>
                            ) : amIFollowing ? (
                              <>
                                <UserCheck className="w-3 h-3" /> Following
                              </>
                            ) : doesUserFollowMe ? (
                              <>
                                <UserPlus className="w-3 h-3" /> Follow Back
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" /> Follow
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-white/40 italic px-2">Account</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-white/40 text-xs font-sans space-y-2">
                    <p>
                      {userSearchQuery
                        ? `No ${modalTab === 'circle' ? 'circle members' : modalTab} matching "${userSearchQuery}"`
                        : modalTab === 'circle'
                        ? 'No members in your circle yet. Mutual followers automatically belong to your circle!'
                        : modalTab === 'following'
                        ? "You aren't following any creators yet."
                        : 'No followers found.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/10 text-center text-[10px] text-white/40 font-mono">
                Showing {displayedModalCreators.length} {modalTab}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Settings Slide-out Drawer */}
      <AnimatePresence>
        {isSettingsDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40 backdrop-blur-sm">
            {/* Backdrop click overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsDrawerOpen(false)}
              className="absolute inset-0 cursor-pointer"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative border-l w-full max-w-md h-full overflow-y-auto p-5 sm:p-6 space-y-6 shadow-2xl z-10 flex flex-col justify-between bg-white border-gray-200 text-gray-900"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#F59E0B]" /> Profile Settings
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsSettingsDrawerOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  {/* Space at top of drawer for updating Profile Image */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3.5">
                    <label className="block text-xs font-mono text-[#F59E0B] uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#F59E0B]" /> Update Profile Picture
                    </label>

                    <div className="flex items-center gap-4">
                      <div className="relative group shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#F59E0B] flex items-center justify-center font-display font-bold text-2xl shadow-md bg-gray-200 text-gray-800">
                          {avatarUrl && avatarUrl.trim() !== '' ? (
                            <img src={getPublicMediaUrl('Gonnng', avatarUrl.trim())} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-gray-600" />
                          )}
                        </div>
                        <label 
                          htmlFor="avatar-file-input" 
                          className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                          title="Upload new profile picture"
                        >
                          <Camera className="w-5 h-5" />
                        </label>
                        <input 
                          type="file" 
                          id="avatar-file-input" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarFileSelect}
                        />
                      </div>

                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <label 
                            htmlFor="avatar-file-input"
                            className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {selectedAvatarFile ? 'Photo Selected ✓' : isUploadingAvatar ? 'Uploading...' : 'Choose File'}
                          </label>
                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setAvatarUrl('');
                                onUpdateUser({ ...currentUser, avatarUrl: '' });
                              }}
                              className="text-[11px] text-red-400 hover:underline font-mono"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div>
                          <input
                            type="text"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="Or paste image URL or path (/media/...)"
                            className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white/80 focus:outline-none focus:border-[#F59E0B]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Your Full Name</label>
                      <input
                        type="text"
                        id="drawer-profile-name-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#F59E0B] font-sans font-medium text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Short Creative Biography</label>
                      <textarea
                        value={bio}
                        id="drawer-profile-bio-textarea"
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#F59E0B] font-sans text-white/80 leading-relaxed"
                        placeholder="click here to enter"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Goal className="w-3.5 h-3.5 text-white/40" /> Current Ultimate Project Goal
                      </label>
                      <input
                        type="text"
                        value={goals}
                        id="drawer-profile-goals-input"
                        onChange={(e) => setGoals(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#F59E0B] font-sans text-white font-medium"
                        placeholder="click here to enter"
                      />
                    </div>
                  </div>

                  {/* Privacy Default Controller */}
                  <div className="space-y-3 pt-2 w-full min-w-0">
                    <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">
                      Privacy Control Panel (Default for New Postings)
                    </label>
                    
                    <div className="flex flex-col gap-3 w-full min-w-0">
                      <div
                        id="drawer-privacy-public-opt"
                        onClick={() => setPrivacy('public')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 sm:gap-4 min-w-0 w-full ${
                          privacy === 'public'
                            ? 'bg-white/10 border-[#F59E0B] text-[#F59E0B] shadow-md'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        <Globe className={`w-5 h-5 shrink-0 ${privacy === 'public' ? 'text-[#F59E0B]' : 'text-white/40'}`} />
                        <div className="text-left min-w-0 flex-1">
                          <span className="text-xs font-sans font-bold block text-white">Public</span>
                          <span className="text-[10px] font-mono text-white/50 block break-words">Global Feed - viewable by everyone in the community</span>
                        </div>
                      </div>

                      <div
                        id="drawer-privacy-internal-opt"
                        onClick={() => setPrivacy('internal')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 sm:gap-4 min-w-0 w-full ${
                          privacy === 'internal'
                            ? 'bg-white/10 border-[#F59E0B] text-[#F59E0B] shadow-md'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        <CircleDotDashed className={`w-5 h-5 shrink-0 ${privacy === 'internal' ? 'text-[#F59E0B]' : 'text-white/40'}`} />
                        <div className="text-left min-w-0 flex-1">
                          <span className="text-xs font-sans font-bold block text-white">Internal</span>
                          <span className="text-[10px] font-mono text-white/50 block break-words">Circle Only - shared only with your followers & circle members</span>
                        </div>
                      </div>

                      <div
                        id="drawer-privacy-private-opt"
                        onClick={() => setPrivacy('private')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 sm:gap-4 min-w-0 w-full ${
                          privacy === 'private'
                            ? 'bg-white/10 border-[#F59E0B] text-[#F59E0B] shadow-md'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        <Album className={`w-5 h-5 shrink-0 ${privacy === 'private' ? 'text-[#F59E0B]' : 'text-white/40'}`} />
                        <div className="text-left min-w-0 flex-1">
                          <span className="text-xs font-sans font-bold block text-white">Private</span>
                          <span className="text-[10px] font-mono text-white/50 block break-words">Personal Log - strictly private, only you can see and track this</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Device & Hardware Permissions Management */}
                  <div id="permissions-section" className="space-y-3 pt-3 border-t border-white/10 w-full min-w-0 bg-[#F59E0B]/5 p-4 rounded-2xl border border-[#F59E0B]/20">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#F59E0B]" /> Device Permissions
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Active
                      </span>
                    </div>

                    <p className="text-xs text-white/70 font-sans leading-relaxed">
                      Manage Gonnng's access permissions to your device camera, microphone, and file storage for recording progress shots and uploading attachments.
                    </p>

                    <div className="space-y-2 pt-1">
                      {/* Camera Toggle */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2.5">
                          <Camera className="w-4 h-4 text-[#F59E0B]" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white block">Camera Access</span>
                              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                                detailedPermissions.camera === 'granted'
                                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                  : detailedPermissions.camera === 'denied'
                                  ? 'text-red-400 bg-red-500/10 border-red-500/30'
                                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                              }`}>
                                {detailedPermissions.camera}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-white/50 block">Allow Gonnng to take progress photos</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="toggle-camera-permission-btn"
                          onClick={() => handleTogglePermission('camera')}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            detailedPermissions.camera === 'granted' ? 'bg-[#F59E0B]' : 'bg-white/20'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                            detailedPermissions.camera === 'granted' ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>

                      {/* Microphone Toggle */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2.5">
                          <Disc3 className="w-4 h-4 text-[#F59E0B]" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white block">Microphone Access</span>
                              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                                detailedPermissions.microphone === 'granted'
                                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                  : detailedPermissions.microphone === 'denied'
                                  ? 'text-red-400 bg-red-500/10 border-red-500/30'
                                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                              }`}>
                                {detailedPermissions.microphone}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-white/50 block">Allow Gonnng to record video audio</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="toggle-microphone-permission-btn"
                          onClick={() => handleTogglePermission('microphone')}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            detailedPermissions.microphone === 'granted' ? 'bg-[#F59E0B]' : 'bg-white/20'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                            detailedPermissions.microphone === 'granted' ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>

                      {/* Files Access Toggle */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2.5">
                          <File className="w-4 h-4 text-[#F59E0B]" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white block">Device File Access</span>
                              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                                detailedPermissions.file_access === 'granted'
                                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                  : detailedPermissions.file_access === 'denied'
                                  ? 'text-red-400 bg-red-500/10 border-red-500/30'
                                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                              }`}>
                                {detailedPermissions.file_access}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-white/50 block">Allow Gonnng to upload images/videos</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="toggle-files-permission-btn"
                          onClick={() => handleTogglePermission('file_access')}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            detailedPermissions.file_access === 'granted' ? 'bg-[#F59E0B]' : 'bg-white/20'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                            detailedPermissions.file_access === 'granted' ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* User File Storage & Upload Vault */}
                  <div className="space-y-3 pt-3 border-t border-white/10 w-full min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#F59E0B]" /> User File Vault & Uploads
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Feature Flagged
                      </span>
                    </div>

                    <p className="text-xs text-white/60 font-sans">
                      Upload and manage media files, avatars, or reference documents tied to your account.
                    </p>

                    <FileUploadZone
                      label="Upload Avatar or Project Assets"
                      accept="image/*,video/*,application/pdf"
                      onFileUploaded={(file: UploadedFile) => {
                        if (file.mimeType.startsWith('image/')) {
                          onUpdateUser({
                            ...currentUser,
                            avatarUrl: file.url
                          });
                        }
                      }}
                    />
                  </div>

                  {/* Tutorial Sandbox and Account Level inside Profile Settings Drawer */}
                  <div className="space-y-4 pt-4 border-t border-white/10 w-full min-w-0">
                    <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-wider">System & Account Overview</h4>
                    
                    <div className="grid grid-cols-1 gap-3 w-full min-w-0">
                      {/* Tutorial Sandbox Shortcut Block */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 w-full min-w-0">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-mono font-bold text-[#F59E0B] uppercase">Tutorial Sandbox</h5>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed font-sans">
                          Review the Gonnng "Sum of parts" philosophy by resetting the universal Sandwich tutorial playground.
                        </p>
                        <button
                          id="reset-tutorial-shortcut-drawer"
                          type="button"
                          onClick={() => {
                            setShowTutorial(true);
                            setIsSettingsDrawerOpen(false);
                          }}
                          className="text-xs font-bold text-[#F59E0B] underline hover:text-[#FF751A] cursor-pointer text-left pt-1 block"
                        >
                          Launch Tutorial Engine →
                        </button>
                      </div>

                      {/* Account Level Block */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 w-full min-w-0">
                        <h5 className="text-xs font-mono font-bold text-[#F59E0B] uppercase flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#F59E0B]" /> Account Level
                        </h5>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5 text-[#F59E0B]">
                            <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                            <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                            <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                          </div>
                          <span className="text-xs font-sans font-bold text-white">Gonnng Master level 3</span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed font-sans">
                          As you complete recipes, track collections, and give reality-checks to friends, your account gains status indicators!
                        </p>
                        {onOpenPhilosophy && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenPhilosophy();
                              setIsSettingsDrawerOpen(false);
                            }}
                            className="w-full mt-2 py-2 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            🔔 Feedback Manual
                          </button>
                        )}
                      </div>

                      {/* Privacy & Cookie Preferences Block */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 w-full min-w-0">
                        <h5 className="text-xs font-mono font-bold text-[#F59E0B] uppercase flex items-center gap-1.5">
                          <Cookie className="w-3.5 h-3.5 text-[#F59E0B]" /> Privacy & Cookie Preferences
                        </h5>
                        <p className="text-xs text-white/60 leading-relaxed font-sans">
                          Manage your visitor cookie consent, tracking settings, and governance choices.
                        </p>
                        {onOpenCookiePreferences && (
                          <button
                            id="profile-settings-cookie-prefs-btn"
                            type="button"
                            onClick={() => {
                              onOpenCookiePreferences();
                              setIsSettingsDrawerOpen(false);
                            }}
                            className="w-full mt-2 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Cookie className="w-4 h-4 text-[#F59E0B]" /> Manage Cookie Preferences
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-white/10 w-full min-w-0">
                    {isSaved ? (
                      <span className="text-emerald-400 font-mono text-xs font-bold animate-pulse text-center">
                        ✓ Profile settings saved successfully!
                      </span>
                    ) : (
                      <span className="text-white/40 text-xs text-center">Unsaved changes will be lost on refresh.</span>
                    )}
                    <button
                      type="submit"
                      id="drawer-save-profile-btn"
                      disabled={isSaving}
                      className="w-full justify-center px-6 py-3 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black rounded-xl text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Disc3 className="w-4 h-4 animate-spin" /> Saving Configuration...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save Configuration
                        </>
                      )}
                    </button>

                    {/* Sign Out Action Button at Bottom of Drawer */}
                    <div className="pt-3 border-t border-white/10 mt-2">
                      <button
                        type="button"
                        id="drawer-sign-out-btn"
                        onClick={() => {
                          authService.logout();
                          setIsSettingsDrawerOpen(false);
                          if (onSignOut) {
                            onSignOut();
                          } else {
                            window.location.reload();
                          }
                        }}
                        className="w-full justify-center px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comments Modal for Superimposed or Profile Post */}
      <AnimatePresence>
        {commentModalPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full h-full sm:h-auto max-w-none sm:max-w-lg max-h-full sm:max-h-[85vh] rounded-none sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-2xl border bg-white border-gray-200 text-gray-900"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="text-base font-display font-bold truncate">
                    Comments on "{commentModalPost.title}"
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCommentModalPost(null)}
                  className="p-1.5 rounded-full transition-colors cursor-pointer hover:bg-gray-100 text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List of comments */}
              <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1">
                {(() => {
                  const allComments = commentModalPost.comments || [];
                  if (allComments.length === 0) {
                    return (
                      <div className="text-center py-8 text-xs font-sans text-gray-500">
                        No comments yet. Leave constructive feedback!
                      </div>
                    );
                  }

                  // Sort comments strictly per User Rules:
                  // 1. Reply to my comment: my comment + reply at top
                  // 2. Comment on my post: new comments at top
                  // 3. Otherwise: order of most recent
                  const sortedComments = [...allComments].filter(Boolean).sort((a, b) => {
                    if (!a || !b) return 0;
                    const aUid = a.userId || (a as any).user_id;
                    const bUid = b.userId || (b as any).user_id;
                    const postAuthorUid = commentModalPost?.userId || (commentModalPost as any)?.user_id;

                    const aIsMyCommentOrReplyToMe = 
                      (aUid === currentUser.id && allComments.some(c => c && (c.parentId === a.id || c.replyToUser === currentUser.name))) ||
                      a.replyToUser === currentUser.name ||
                      (a.content && a.content.toLowerCase().includes(`@${currentUser.name?.toLowerCase()}`));

                    const bIsMyCommentOrReplyToMe = 
                      (bUid === currentUser.id && allComments.some(c => c && (c.parentId === b.id || c.replyToUser === currentUser.name))) ||
                      b.replyToUser === currentUser.name ||
                      (b.content && b.content.toLowerCase().includes(`@${currentUser.name?.toLowerCase()}`));

                    if (aIsMyCommentOrReplyToMe && !bIsMyCommentOrReplyToMe) return -1;
                    if (!aIsMyCommentOrReplyToMe && bIsMyCommentOrReplyToMe) return 1;

                    if (postAuthorUid === currentUser.id) {
                      const aIsOther = aUid !== currentUser.id;
                      const bIsOther = bUid !== currentUser.id;
                      if (aIsOther && !bIsOther) return -1;
                      if (!aIsOther && bIsOther) return 1;
                    }

                    return 0;
                  });

                  return sortedComments.map(c => (
                    <div key={c.id} className="p-3 border rounded-2xl space-y-1.5 bg-gray-50 border-gray-200 text-gray-900">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <img src={c.userAvatar} alt={c.userName} className="w-5 h-5 rounded-full object-cover" />
                          <span className="text-xs font-bold">{c.userName}</span>
                          {c.replyToUser && (
                            <span className="text-[10px] font-mono text-[#F59E0B]">
                              replying to @{c.replyToUser}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-gray-500">• {c.timeString}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onToggleCommentHeart) onToggleCommentHeart(commentModalPost.id, c.id);
                            setCommentModalPost(prev => prev ? {
                              ...prev,
                              comments: prev.comments?.map(item => item.id === c.id ? { ...item, isHearted: !item.isHearted, heartCount: item.isHearted ? (item.heartCount || 1) - 1 : (item.heartCount || 0) + 1 } : item)
                            } : null);
                          }}
                          className={`text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                            c.isHearted ? 'text-red-500 font-bold' : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          ♥ {c.heartCount || 0}
                        </button>
                      </div>
                      <p className="text-xs font-sans pl-7 text-gray-700">{c.content}</p>
                      
                      <div className="pl-7 pt-1 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setReplyingToComment({ id: c.id, userName: c.userName })}
                          className="text-[10px] font-mono text-[#F59E0B] hover:underline cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Replying banner indicator */}
              {replyingToComment && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl mb-2 text-xs text-[#F59E0B] font-mono">
                  <span>Replying to @{replyingToComment.userName}</span>
                  <button type="button" onClick={() => setReplyingToComment(null)} className="hover:text-gray-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Comment input form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!commentInput.trim()) return;
                  const finalContent = replyingToComment ? `@${replyingToComment.userName} ${commentInput.trim()}` : commentInput.trim();
                  if (onAddComment) {
                    onAddComment(commentModalPost.id, finalContent, replyingToComment?.id, replyingToComment?.userName);
                    setCommentModalPost(prev => prev ? {
                      ...prev,
                      comments: [
                        ...(prev.comments || []),
                        {
                          id: `c-${Date.now()}`,
                          userId: currentUser.id,
                          userName: currentUser.name,
                          userAvatar: currentUser.avatarUrl,
                          content: finalContent,
                          parentId: replyingToComment?.id,
                          replyToUser: replyingToComment?.userName,
                          timeString: 'Just now',
                          heartCount: 0,
                          isHearted: false
                        }
                      ]
                    } : null);
                  }
                  setCommentInput('');
                  setReplyingToComment(null);
                }}
                className="pt-3 border-t flex gap-2 border-gray-200"
              >
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add constructive comment..."
                  className="flex-1 px-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#F59E0B] bg-gray-100 border-gray-300 text-gray-900"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#FF751A] disabled:opacity-40 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  Send
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Device OS Settings Guidance Modal */}
      <AnimatePresence>
        {permissionGuidanceModal?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full h-full sm:h-auto max-w-none sm:max-w-md max-h-full sm:max-h-[85vh] rounded-none sm:rounded-3xl p-6 bg-slate-900 border border-white/10 shadow-2xl space-y-4 text-white relative overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setPermissionGuidanceModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
                  <Shield className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#F59E0B] uppercase tracking-wider block">
                    OS Permission Management
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {permissionGuidanceModal.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-white/80 leading-relaxed font-sans bg-white/5 p-4 rounded-2xl border border-white/10">
                {permissionGuidanceModal.message}
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Deep link / settings guidance
                    if (navigator.permissions && (navigator as any).userAgent) {
                      // Attempt window focus/settings or guide user
                    }
                    setPermissionGuidanceModal(null);
                  }}
                  className="w-full py-2.5 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

