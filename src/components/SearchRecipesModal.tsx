import React, { useState } from 'react';
import { Recipe, Creator } from '../types';
import { 
  X, 
  Search, 
  Sparkles, 
  Download, 
  GitFork, 
  UserPlus, 
  UserMinus, 
  Check, 
  Info, 
  Users, 
  ShieldCheck, 
  BookmarkCheck
} from 'lucide-react';

interface SearchRecipesModalProps {
  onClose: () => void;
  recipes: Recipe[];
  creators: Creator[];
  communityRecipes: Recipe[];
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
  onSaveRecipe,
  onForkRecipe,
  onToggleFollowCreator,
  onToggleCircleCreator
}: SearchRecipesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter community recipes based on search query and category
  const filteredRecipes = communityRecipes.filter(recipe => {
    const matchesSearch = 
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = 
      selectedCategory === 'all' || 
      recipe.category.toLowerCase() === selectedCategory.toLowerCase();
      
    return matchesSearch && matchesCategory;
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" id="search-modal-root">
      <div className="bg-[#151515] text-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-white/10 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-black p-5 flex justify-between items-center shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FF5C00] flex items-center justify-center text-black">
              <Search className="w-4 h-4 font-black" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold">Search Community Blueprints</h2>
              <p className="text-[10px] text-white/40 font-mono">Explore other creators' processes, follow them, or clone their recipes.</p>
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

        {/* Search Filter Controls Row */}
        <div className="bg-black/30 p-4 shrink-0 border-b border-white/10 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
            <input
              type="text"
              id="search-recipes-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs focus:outline-none focus:border-[#FF5C00] text-white placeholder-white/20"
              placeholder="Search by title, creator, tag (e.g. Art, Sourdough, Bruce)..."
            />
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['all', 'Practical', 'Creative', 'Humorous', 'Educational', 'Strategy'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer shrink-0 border ${
                  selectedCategory === cat 
                    ? 'bg-[#FF5C00] text-black border-[#FF5C00]' 
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Main Content (2-Column Grid if profile selected) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-6 min-h-0">
          
          {/* Left Column: Results List */}
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {filteredRecipes.map(recipe => {
                const creator = creators.find(c => c.id === recipe.authorId);
                const saved = isAlreadySaved(recipe.title);
                
                return (
                  <div 
                    key={recipe.id} 
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
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
                        <h4 className="text-sm font-bold text-white">{recipe.title}</h4>
                        <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{recipe.description}</p>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <p className="text-[9px] font-mono text-white/30 uppercase">Milestones ({recipe.phases.length})</p>
                        <div className="space-y-0.5">
                          {recipe.phases.slice(0, 2).map((p, idx) => (
                            <div key={idx} className="text-[11px] text-white/70 font-sans truncate flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-[#FF5C00]"></span>
                              {p.title}
                            </div>
                          ))}
                          {recipe.phases.length > 2 && (
                            <div className="text-[9px] text-white/40 font-mono pl-2">
                              + {recipe.phases.length - 2} more phases
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1 pt-1 flex-wrap">
                        {recipe.tags.map(tag => (
                          <span key={tag} className="text-[8px] font-mono bg-white/5 text-white/40 px-1.5 py-0.5 rounded-full border border-white/10">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3.5 mt-4 flex gap-2">
                      <button
                        onClick={() => handleSave(recipe)}
                        disabled={saved}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
                            <Download className="w-3 h-3" /> Save to Lib
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleFork(recipe)}
                        className="py-2 px-3 bg-[#FF5C00]/10 hover:bg-[#FF5C00]/20 border border-[#FF5C00]/25 text-[#FF5C00] rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Fork template and publish custom adaptation"
                      >
                        <GitFork className="w-3 h-3" /> Fork
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredRecipes.length === 0 && (
                <div className="col-span-2 text-center py-12 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-white/40 text-xs font-sans">No community blueprints found matching query.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Creator Profile Overlay Panel */}
          {selectedCreator && (
            <div className="w-full lg:w-80 bg-black/60 border border-white/10 rounded-2xl p-6 space-y-6 shrink-0 h-fit">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Creator Profile</span>
                <button 
                  onClick={() => setSelectedCreator(null)}
                  className="text-white/40 hover:text-white text-xs font-mono"
                >
                  ✕ Close
                </button>
              </div>

              <div className="text-center space-y-3">
                <img 
                  src={selectedCreator.avatarUrl} 
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
    </div>
  );
}
