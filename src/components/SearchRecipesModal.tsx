import React, { useState } from 'react';
import { Recipe, Creator, FeedPost } from '../types';
import { 
  X, 
  Search, 
  Download, 
  GitFork, 
  UserPlus, 
  UserMinus, 
  Check, 
  Users, 
  ShieldCheck, 
  BookmarkCheck,
  Hash,
  BookOpen,
  FolderKanban,
  PrinterCheck
} from 'lucide-react';
import PrintPreviewModal, { PrintableItem } from './PrintPreviewModal';

interface SearchRecipesModalProps {
  onClose: () => void;
  recipes: Recipe[];
  creators: Creator[];
  communityRecipes: Recipe[];
  posts?: FeedPost[];
  onSaveRecipe: (recipe: Recipe) => void;
  onForkRecipe: (recipe: Recipe) => void;
  onToggleFollowCreator: (creatorId: string) => void;
  onToggleCircleCreator: (creatorId: string) => void;
}

export default function SearchRecipesModal({
  onClose,
  recipes,
  creators,
  communityRecipes,
  posts = [],
  onSaveRecipe,
  onForkRecipe,
  onToggleFollowCreator,
  onToggleCircleCreator,
}: SearchRecipesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printableItem, setPrintableItem] = useState<PrintableItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const categories = ['All', 'Users', 'Hashtags', 'Recipes', 'Projects'];

  const q = searchQuery.toLowerCase().trim();

  // Filter Creators
  const filteredCreators = creators.filter(c => {
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.bio.toLowerCase().includes(q) ||
      c.goals.toLowerCase().includes(q)
    );
  });

  // Filter Recipes
  const filteredRecipes = communityRecipes.filter(recipe => {
    if (!q) return true;
    return (
      recipe.title.toLowerCase().includes(q) ||
      recipe.description.toLowerCase().includes(q) ||
      recipe.authorName.toLowerCase().includes(q) ||
      recipe.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  // Filter Posts / Projects
  const filteredPosts = posts.filter(post => {
    if (!q) return true;
    const hashtagStr = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags || '';
    return (
      post.title.toLowerCase().includes(q) ||
      post.content.toLowerCase().includes(q) ||
      post.userName.toLowerCase().includes(q) ||
      hashtagStr.toLowerCase().includes(q)
    );
  });

  // Filter Hashtags
  const hashtagPosts = posts.filter(p => {
    if (!p.hashtags) return false;
    const hstr = Array.isArray(p.hashtags) ? p.hashtags.join(' ') : p.hashtags;
    if (!q) return hstr.length > 0;
    return hstr.toLowerCase().includes(q.replace('#', ''));
  });

  const isAlreadySaved = (recipeTitle: string) => {
    return recipes.some(r => r.title.toLowerCase() === recipeTitle.toLowerCase());
  };

  const handleSave = (recipe: Recipe) => {
    if (isAlreadySaved(recipe.title)) {
      setSuccessMessage(`"${recipe.title}" is already in your library.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    onSaveRecipe(recipe);
    setSuccessMessage(`Successfully saved "${recipe.title}" to your library!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleFork = (recipe: Recipe) => {
    onForkRecipe(recipe);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-gray-900/40 backdrop-blur-sm" id="search-modal-root">
      <div className="rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border max-h-[90vh] flex flex-col bg-white text-gray-900 border-gray-200">
        
        {/* Modal Header */}
        <div className="p-5 flex justify-between items-center shrink-0 border-b bg-gray-50 border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FF5C00] flex items-center justify-center text-black">
              <Search className="w-4 h-4 font-black" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold">Search Circle & Community</h2>
              <p className="text-[10px] text-white/40 font-mono">Search users, recipes, project posts, and hashtags.</p>
            </div>
          </div>
          <button 
            id="close-search-btn"
            onClick={onClose} 
            className="p-1.5 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5 text-white/60 hover:text-white" />
          </button>
        </div>

        {/* Search Input & Category Option Buttons */}
        <div className="bg-black/30 p-4 shrink-0 border-b border-white/10 space-y-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
            <input
              type="text"
              id="search-recipes-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs focus:outline-none focus:border-[#FF5C00] text-white placeholder-white/20"
              placeholder="Search by user, recipe title, project, tag (#creative, #recipe)..."
            />
          </div>
          
          {/* Options below the search text box */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shrink-0 border ${
                  selectedCategory === cat 
                    ? 'bg-[#FF5C00] text-black border-[#FF5C00] shadow-sm font-black' 
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-6 min-h-0">
          
          {/* Left Column: Search Results */}
          <div className="flex-1 space-y-6 overflow-y-auto pr-1">
            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* 1. USERS SECTION */}
            {(selectedCategory === 'All' || selectedCategory === 'Users') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF5C00] uppercase">
                  <Users className="w-4 h-4" /> Users & Network ({filteredCreators.length})
                </div>
                {filteredCreators.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {filteredCreators.map(creator => (
                      <div 
                        key={creator.id} 
                        className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-3 hover:border-white/20 transition-all cursor-pointer"
                        onClick={() => setSelectedCreator(creator)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={creator.avatarUrl && creator.avatarUrl.trim() !== '' ? creator.avatarUrl.trim() : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'} 
                            alt={creator.name} 
                            className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate flex items-center gap-1">
                              {creator.name}
                              {creator.isInCircle && <ShieldCheck className="w-3 h-3 text-[#FF5C00]" />}
                            </h4>
                            <p className="text-[10px] font-mono text-white/40 truncate">{creator.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFollowCreator(creator.id);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all shrink-0 ${
                            creator.isFollowing ? 'bg-white/10 text-white' : 'bg-[#FF5C00] text-black font-black'
                          }`}
                        >
                          {creator.isFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  selectedCategory === 'Users' && (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl text-xs text-white/40">
                      No users found matching query.
                    </div>
                  )
                )}
              </div>
            )}

            {/* 2. RECIPES SECTION */}
            {(selectedCategory === 'All' || selectedCategory === 'Recipes') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF5C00] uppercase">
                  <BookOpen className="w-4 h-4" /> Recipes & Blueprints ({filteredRecipes.length})
                </div>
                {filteredRecipes.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredRecipes.map(recipe => {
                      const creator = creators.find(c => c.id === recipe.authorId);
                      const saved = isAlreadySaved(recipe.title);
                      
                      return (
                        <div 
                          key={recipe.id} 
                          className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-start">
                              <span className="bg-white/10 text-white/60 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded">
                                {recipe.category}
                              </span>
                              
                              <button
                                onClick={() => {
                                  if (creator) setSelectedCreator(creator);
                                }}
                                className="text-[10px] text-[#FF5C00] hover:underline font-mono"
                              >
                                @{recipe.authorName.split(' ')[0].toLowerCase()}
                              </button>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-white">{recipe.title}</h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPrintableItem({
                                      id: recipe.id,
                                      type: 'recipe',
                                      title: recipe.title,
                                      description: recipe.description,
                                      authorName: recipe.authorName,
                                      category: recipe.category,
                                      phases: recipe.phases,
                                      tags: recipe.tags,
                                      gongsCount: recipe.gongsCount,
                                    });
                                    setPrintModalOpen(true);
                                  }}
                                  className="p-1 bg-white/5 hover:bg-[#FF5C00] text-white/70 hover:text-black rounded-md transition-all cursor-pointer flex items-center justify-center border border-white/10 shrink-0"
                                  title="Printable Copy"
                                >
                                  <PrinterCheck className="w-3.5 h-3.5 stroke-[2]" />
                                </button>
                              </div>
                              <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{recipe.description}</p>
                            </div>

                            <div className="flex gap-1 pt-1 flex-wrap">
                              {recipe.tags.map(tag => (
                                <span key={tag} className="text-[8px] font-mono bg-white/5 text-white/40 px-1.5 py-0.5 rounded-full border border-white/10">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-3 mt-3 flex gap-2">
                            <button
                              onClick={() => handleSave(recipe)}
                              disabled={saved}
                              className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                saved 
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                  : 'bg-white/10 hover:bg-[#FF5C00] hover:text-black text-white'
                              }`}
                            >
                              {saved ? (
                                <>
                                  <Check className="w-3 h-3" /> Saved
                                </>
                              ) : (
                                <>
                                  <Download className="w-3 h-3" /> Save
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleFork(recipe)}
                              className="py-1.5 px-3 bg-[#FF5C00]/10 hover:bg-[#FF5C00]/20 border border-[#FF5C00]/25 text-[#FF5C00] rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Fork template"
                            >
                              <GitFork className="w-3 h-3" /> Fork
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  selectedCategory === 'Recipes' && (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl text-xs text-white/40">
                      No recipes found matching query.
                    </div>
                  )
                )}
              </div>
            )}

            {/* 3. PROJECTS SECTION */}
            {(selectedCategory === 'All' || selectedCategory === 'Projects') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF5C00] uppercase">
                  <FolderKanban className="w-4 h-4" /> Projects & Posts ({filteredPosts.length})
                </div>
                {filteredPosts.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredPosts.map(post => (
                      <div 
                        key={post.id} 
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          {post.image && (
                            <img 
                              src={post.image} 
                              alt={post.title} 
                              className="w-full h-28 object-cover rounded-xl border border-white/10" 
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <h4 className="text-xs font-bold text-white line-clamp-1">{post.title}</h4>
                          <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">{post.content}</p>
                          <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-1">
                            <span>By {post.userName}</span>
                            <span>{post.timeString}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  selectedCategory === 'Projects' && (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl text-xs text-white/40">
                      No project posts found matching query.
                    </div>
                  )
                )}
              </div>
            )}

            {/* 4. HASHTAGS SECTION */}
            {(selectedCategory === 'Hashtags') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF5C00] uppercase">
                  <Hash className="w-4 h-4" /> Hashtag Items ({hashtagPosts.length})
                </div>
                {hashtagPosts.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {hashtagPosts.map(post => (
                      <div 
                        key={post.id} 
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between text-[#FF5C00] font-mono text-xs font-bold">
                          <span>
                            {Array.isArray(post.hashtags) 
                              ? post.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')
                              : post.hashtags}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">{post.title}</h4>
                        <p className="text-xs text-white/60 line-clamp-2">{post.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl text-xs text-white/40">
                    No posts or recipes found matching hashtags.
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Dynamic Creator Profile Overlay Panel */}
          {selectedCreator && (
            <div className="w-full lg:w-80 bg-black/60 border border-white/10 rounded-2xl p-6 space-y-6 shrink-0 h-fit">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Creator Profile</span>
                <button 
                  onClick={() => setSelectedCreator(null)}
                  className="text-white/40 hover:text-white text-xs font-mono cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="text-center space-y-3">
                <img 
                  src={selectedCreator.avatarUrl && selectedCreator.avatarUrl.trim() !== '' ? selectedCreator.avatarUrl.trim() : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'} 
                  alt={selectedCreator.name} 
                  className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-[#FF5C00]/40 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-base font-bold text-white flex justify-center items-center gap-1.5">
                    {selectedCreator.name}
                    {selectedCreator.isInCircle && (
                      <ShieldCheck className="w-4 h-4 text-[#FF5C00]" title="In your network circle" />
                    )}
                  </h3>
                  <p className="text-[10px] font-mono text-white/40">{selectedCreator.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center border-y border-white/5 py-3">
                <div>
                  <div className="text-base font-bold font-mono text-[#FF5C00]">{selectedCreator.followersCount}</div>
                  <div className="text-[9px] font-mono text-white/40 uppercase">Followers</div>
                </div>
                <div>
                  <div className="text-base font-bold font-mono text-white">{selectedCreator.followingCount}</div>
                  <div className="text-[9px] font-mono text-white/40 uppercase">Following</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <h5 className="text-[10px] font-mono text-white/40 uppercase font-bold">Creator Bio</h5>
                  <p className="text-xs text-white/80 font-sans leading-relaxed">{selectedCreator.bio}</p>
                </div>
                <div className="space-y-1">
                  <h5 className="text-[10px] font-mono text-white/40 uppercase font-bold">Focus Goals</h5>
                  <p className="text-xs text-white/70 font-mono leading-relaxed">{selectedCreator.goals}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onToggleFollowCreator(selectedCreator.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedCreator.isFollowing 
                      ? 'bg-white/10 hover:bg-red-500 hover:text-white text-white border border-white/10' 
                      : 'bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black'
                  }`}
                >
                  {selectedCreator.isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" /> Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Follow Creator
                    </>
                  )}
                </button>

                <button
                  onClick={() => onToggleCircleCreator(selectedCreator.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedCreator.isInCircle 
                      ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/30' 
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  {selectedCreator.isInCircle ? 'Remove from Circle' : 'Invite to Circle'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-black p-4 text-center text-[10px] font-mono text-white/40 border-t border-white/10">
          The sum of parts • Double click saves instantly to Process Blueprint Library.
        </div>

      </div>

      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        item={printableItem}
      />
    </div>
  );
}
