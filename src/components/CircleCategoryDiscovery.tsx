import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Creator, Project, Recipe } from '../types';
import { isFollowingUser, isUserInCircle, getCircleOfUser } from '../utils/followUtils';
import { getCategoryByName, getCategoryGroup } from '../data/categoriesData';
import { getPublicMediaUrl } from '../services/uploadService';
import { 
  Palette, 
  Home, 
  Cpu, 
  Briefcase, 
  BookOpen, 
  Users, 
  X, 
  Check, 
  UserPlus, 
  ChevronRight,
  Sparkles,
  User
} from 'lucide-react';

export interface ParentCategoryTile {
  id: string;
  name: string;
  colorHex: string;
  description: string;
  icon: React.ElementType;
}

export const PARENT_CATEGORY_TILES: ParentCategoryTile[] = [
  {
    id: 'music-fine-art',
    name: 'Music & Fine Art',
    colorHex: '#c99bff',
    description: 'Painters, musicians, sculptors & visual artists',
    icon: Palette
  },
  {
    id: 'home-hobby',
    name: 'Home & Hobby',
    colorHex: '#c06a3f',
    description: 'Woodworking, gardening, culinary & DIY crafts',
    icon: Home
  },
  {
    id: 'industrial-tech',
    name: 'Industrial & Tech',
    colorHex: '#a9d86a',
    description: 'Developers, engineers, robotics & software builders',
    icon: Cpu
  },
  {
    id: 'marketing-business',
    name: 'Marketing & Business',
    colorHex: '#f2d28a',
    description: 'Founders, strategists, brand leads & marketers',
    icon: Briefcase
  },
  {
    id: 'ideas-storytelling',
    name: 'Ideas & Storytelling',
    colorHex: '#A99BFF',
    description: 'Writers, filmmakers, podcasters & game creators',
    icon: BookOpen
  }
];

interface CircleCategoryDiscoveryProps {
  currentUser?: Creator;
  creators: Creator[];
  projects: Project[];
  recipes?: Recipe[];
  onToggleFollow?: (creatorId: string) => void;
  onOpenCreatorProfile?: (userIdOrName: string) => void;
}

export default function CircleCategoryDiscovery({
  currentUser,
  creators = [],
  projects = [],
  recipes = [],
  onToggleFollow,
  onOpenCreatorProfile
}: CircleCategoryDiscoveryProps) {
  const [selectedCategoryTile, setSelectedCategoryTile] = useState<ParentCategoryTile | null>(null);

  if (!currentUser) return null;

  // 1. Trigger Condition: Calculate confirmed circle size (mutual follows only)
  const confirmedCircle = getCircleOfUser(currentUser, creators);
  const confirmedCircleCount = confirmedCircle.length;

  // If confirmed circle count is 3 or more, category tiles are not shown
  if (confirmedCircleCount >= 3) {
    return null;
  }

  // Helper to match a project's or recipe's category to the selected parent category tile
  const matchesCategory = (itemCategory?: string, targetParentName?: string): boolean => {
    if (!targetParentName) return false;
    if (!itemCategory || itemCategory.trim() === '') return false;

    const normItem = itemCategory.trim().toLowerCase();
    const normTarget = targetParentName.trim().toLowerCase();

    // Direct match
    if (normItem === normTarget) return true;

    // Check via categoriesData helper
    const catItem = getCategoryByName(itemCategory);
    if (catItem && catItem.parentCategory) {
      const parentNorm = catItem.parentCategory.trim().toLowerCase();
      if (parentNorm === normTarget) return true;
      if (normTarget === 'ideas & storytelling' && (parentNorm.includes('design') || parentNorm.includes('film'))) {
        return true;
      }
    }

    const group = getCategoryGroup(itemCategory);
    if (group && group.name) {
      const groupNorm = group.name.trim().toLowerCase();
      if (groupNorm === normTarget) return true;
      if (normTarget === 'ideas & storytelling' && (groupNorm.includes('design') || groupNorm.includes('film'))) {
        return true;
      }
    }

    // Partial word checks
    const targetParts = normTarget.split('&').map(p => p.trim().toLowerCase());
    for (const part of targetParts) {
      if (part.length > 2 && normItem.includes(part)) return true;
    }

    // Keyword domain fallbacks
    if (normTarget.includes('music') && (normItem.includes('art') || normItem.includes('fine') || normItem.includes('paint') || normItem.includes('song') || normItem.includes('sculpt'))) return true;
    if (normTarget.includes('home') && (normItem.includes('wood') || normItem.includes('garden') || normItem.includes('diy') || normItem.includes('cook') || normItem.includes('bake') || normItem.includes('craft') || normItem.includes('hobby'))) return true;
    if (normTarget.includes('tech') && (normItem.includes('code') || normItem.includes('software') || normItem.includes('app') || normItem.includes('hardware') || normItem.includes('robot') || normItem.includes('ai') || normItem.includes('dev'))) return true;
    if (normTarget.includes('market') && (normItem.includes('business') || normItem.includes('brand') || normItem.includes('sale') || normItem.includes('found') || normItem.includes('strat'))) return true;
    if (normTarget.includes('story') && (normItem.includes('write') || normItem.includes('book') || normItem.includes('film') || normItem.includes('pod') || normItem.includes('media') || normItem.includes('game') || normItem.includes('design'))) return true;

    return false;
  };

  // Build top 5 user list for the selected category modal
  const getCategoryUsers = (tile: ParentCategoryTile) => {
    const matchedUsersMap = new Map<string, {
      creator: Creator;
      latestActivity: {
        type: 'Project' | 'Recipe' | 'Goal';
        title: string;
        createdAt: string;
      };
    }>();

    const isEligibleUser = (c: Creator) => {
      if (!c || !c.id) return false;
      if (currentUser && (c.id === currentUser.id || (currentUser.publicId && c.publicId === currentUser.publicId))) return false;
      if (currentUser && isUserInCircle(currentUser, c.id, creators)) return false;
      return true;
    };

    // 1. Scan projects for users with projects under this parent category
    (projects || []).forEach(p => {
      if (!p) return;
      const pUserId = p.userId || (p as any).user_id;
      if (!pUserId) return;

      const catToTest = p.category || p.recipeTitle || '';
      if (!matchesCategory(catToTest, tile.name)) return;

      const creator = creators.find(c => c && (c.id === pUserId || (c.publicId && c.publicId === pUserId)));
      if (!creator || !isEligibleUser(creator)) return;

      const dateStr = p.createdAt || new Date().toISOString();
      const timestamp = new Date(dateStr).getTime() || 0;
      const existing = matchedUsersMap.get(creator.id);

      if (!existing || timestamp > new Date(existing.latestActivity.createdAt).getTime()) {
        matchedUsersMap.set(creator.id, {
          creator,
          latestActivity: {
            type: 'Project',
            title: p.title || p.recipeTitle || 'Project',
            createdAt: dateStr
          }
        });
      }
    });

    // 2. Scan recipes for users who created/started recipes under this parent category
    (recipes || []).forEach(r => {
      if (!r) return;
      const rAuthorId = r.authorId || (r as any).user_id || (r as any).author_id;
      if (!rAuthorId) return;

      const catToTest = r.category || '';
      if (!matchesCategory(catToTest, tile.name)) return;

      const creator = creators.find(c => c && (c.id === rAuthorId || (c.publicId && c.publicId === rAuthorId)));
      if (!creator || !isEligibleUser(creator)) return;

      const dateStr = r.createdAt || new Date().toISOString();
      const timestamp = new Date(dateStr).getTime() || 0;
      const existing = matchedUsersMap.get(creator.id);

      if (!existing || timestamp > new Date(existing.latestActivity.createdAt).getTime()) {
        matchedUsersMap.set(creator.id, {
          creator,
          latestActivity: {
            type: 'Recipe',
            title: r.title || 'Recipe Blueprint',
            createdAt: dateStr
          }
        });
      }
    });

    // 3. Fallback: If we have fewer than 5 users, include other active creators whose goals/bio match or general creators
    if (matchedUsersMap.size < 5) {
      creators.forEach(c => {
        if (!isEligibleUser(c)) return;
        if (matchedUsersMap.has(c.id)) return;

        const goalsOrBio = `${c.goals || ''} ${c.bio || ''}`;
        if (matchesCategory(goalsOrBio, tile.name) || matchedUsersMap.size < 5) {
          matchedUsersMap.set(c.id, {
            creator: c,
            latestActivity: {
              type: 'Goal',
              title: c.goals || `${tile.name} Creator`,
              createdAt: new Date().toISOString()
            }
          });
        }
      });
    }

    // Sort by latest activity timestamp descending
    const sortedList = Array.from(matchedUsersMap.values()).sort((a, b) => {
      const tA = new Date(a.latestActivity.createdAt).getTime() || 0;
      const tB = new Date(b.latestActivity.createdAt).getTime() || 0;
      return tB - tA;
    });

    // Return the top 5 suggested users
    return sortedList.slice(0, 5);
  };

  const categoryUsers = selectedCategoryTile ? getCategoryUsers(selectedCategoryTile) : [];

  return (
    <div className="w-full mt-6 sm:mt-8 mb-6 text-gray-900">
      {/* Banner Card Container */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-300/80 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        {/* Ambient Background Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-gray-900">
              Explore Creators by Categories they love
            </h3>
            <p className="text-xs text-gray-600 mt-0.5 max-w-xl">
              Click on a category below to discover creators who recently started projects or recipes on a topic you love. Mutual follows will build your Circle.
            </p>
          </div>
        </div>

        {/* 5 Parent Category Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PARENT_CATEGORY_TILES.map((tile, tIdx) => {
            const IconComponent = tile.icon;
            return (
              <motion.button
                key={`circle-cat-tile-${tile.id || tIdx}-${tIdx}`}
                type="button"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategoryTile(tile)}
                className="flex flex-col justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all text-left cursor-pointer group relative overflow-hidden"
              >
                {/* Accent Color Bar */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5" 
                  style={{ backgroundColor: tile.colorHex }} 
                />

                <div>
                  <div className="flex items-center justify-between mb-3 pt-1">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${tile.colorHex}25`, color: tile.colorHex }}
                    >
                      <IconComponent className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </div>

                  <h4 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-[#F59E0B] transition-colors">
                    {tile.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">
                    {tile.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono font-bold text-gray-600 group-hover:text-gray-900">
                  <span>Browse Creators</span>
                  <span className="text-[#F59E0B]">→</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Category Discovery Modal */}
      <AnimatePresence>
        {selectedCategoryTile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-gray-900/50 backdrop-blur-sm">
            <div 
              className="absolute inset-0" 
              onClick={() => setSelectedCategoryTile(null)} 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl z-10 overflow-hidden border border-gray-200 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: `${selectedCategoryTile.colorHex}25`, color: selectedCategoryTile.colorHex }}
                  >
                    {React.createElement(selectedCategoryTile.icon, { className: 'w-5 h-5 stroke-[2.2]' })}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-gray-900 leading-tight">
                      {selectedCategoryTile.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      5 creators who recently started a Project or Recipe here
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCategoryTile(null)}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal User List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {categoryUsers.length > 0 ? (
                  categoryUsers.map(({ creator, latestActivity }, idx) => {
                    const isFollowing = isFollowingUser(currentUser, creator.id, creators);
                    const avatarUrl = creator.avatarUrl ? getPublicMediaUrl('Gonnng', creator.avatarUrl) : '';

                    return (
                      <div
                        key={`circle-creator-${creator.id || idx}-${idx}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-all shadow-2xs"
                      >
                        {/* Avatar & User Details */}
                        <div 
                          className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 group"
                          onClick={() => {
                            setSelectedCategoryTile(null);
                            onOpenCreatorProfile?.(creator.id);
                          }}
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={creator.name}
                              className="w-11 h-11 rounded-full object-cover shrink-0 border border-gray-200 shadow-2xs group-hover:opacity-90"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-500">
                              <User className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-gray-900 truncate group-hover:underline">
                                {creator.name}
                              </h4>
                              {creator.username && (
                                <span className="text-xs font-mono text-gray-400 truncate">
                                  @{creator.username}
                                </span>
                              )}
                            </div>

                            {/* Context: Most Recent Project or Recipe Started */}
                            <p className="text-xs text-gray-600 truncate mt-0.5 flex items-center gap-1">
                              <span className="text-[#F59E0B] font-semibold font-mono text-[11px]">
                                Latest {latestActivity.type}:
                              </span>
                              <span className="font-medium text-gray-800 truncate">
                                "{latestActivity.title}"
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* State-Aware Follow Button */}
                        <button
                          type="button"
                          onClick={() => onToggleFollow?.(creator.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                            isFollowing
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 font-medium'
                              : 'bg-[#F59E0B] text-black hover:bg-[#ff701a] font-black shadow-sm'
                          }`}
                        >
                          {isFollowing ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-gray-600" />
                              <span>Requested</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-gray-200"
                      style={{ backgroundColor: `${selectedCategoryTile.colorHex}15`, color: selectedCategoryTile.colorHex }}
                    >
                      <Users className="w-7 h-7 stroke-[2]" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1 max-w-xs">
                      No creators found for {selectedCategoryTile.name}
                    </h4>
                    <p className="text-xs text-gray-500 max-w-xs mt-1">
                      Start a project in this category to share your work and attract fellow creators to your Circle.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-gray-100 bg-gray-50/80 text-center text-[11px] text-gray-500 font-mono">
                Mutual follows automatically add creators to your Circle.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

