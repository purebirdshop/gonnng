import React, { useState } from 'react';
import { Recipe, Creator, FeedPost, Project } from '../types';
import { 
  X, 
  Search, 
  UserPlus, 
  UserMinus, 
  Users, 
  ShieldCheck, 
  BookmarkCheck,
  BookOpen,
  FolderKanban,
  User,
  Bookmark
} from 'lucide-react';
import PrintPreviewModal, { PrintableItem } from './PrintPreviewModal';
import RecipeDetailModal from './RecipeDetailModal';
import { ProcessTile } from './SandEngine';
import { searchCategories } from '../data/categoriesData';
import { isUserInCircle } from '../utils/followUtils';
import { IconOnlySubButton, IconWithLabelButton } from './DesignSystemTiles';

interface SearchRecipesModalProps {
  onClose: () => void;
  recipes: Recipe[];
  creators: Creator[];
  communityRecipes: Recipe[];
  posts?: FeedPost[];
  projects?: Project[];
  savedRecipeIds?: string[];
  currentUser?: { id?: string; name?: string; avatarUrl?: string; avatar?: string };
  onSaveRecipe: (recipe: Recipe) => void;
  onForkRecipe: (recipe: Recipe) => void;
  onToggleSaveRecipe?: (recipeId: string, recipeObj?: Recipe) => void;
  onToggleFollowCreator: (creatorId: string) => void;
  onToggleCircleCreator: (creatorId: string) => void;
  onOpenCreatorProfile?: (creatorIdOrName: string) => void;
  onSelectProject?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  initialCategory?: string;
}

export default function SearchRecipesModal({
  onClose,
  recipes,
  creators,
  communityRecipes,
  posts = [],
  projects = [],
  savedRecipeIds = [],
  currentUser,
  onSaveRecipe,
  onForkRecipe,
  onToggleSaveRecipe,
  onToggleFollowCreator,
  onToggleCircleCreator,
  onOpenCreatorProfile,
  onSelectProject,
  onEditProject,
  onDeleteProject,
  initialCategory = 'All',
}: SearchRecipesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printableItem, setPrintableItem] = useState<PrintableItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPreviewRecipe, setSelectedPreviewRecipe] = useState<Recipe | null>(null);
  const [unbookmarkRecipeTarget, setUnbookmarkRecipeTarget] = useState<{ id: string; title: string } | null>(null);

  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const categories = ['All', 'Users', 'Recipes', 'Projects'];

  const q = (searchQuery || '').toLowerCase().trim();

  // Filter Creators
  const filteredCreators = creators.filter(c => {
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.bio || '').toLowerCase().includes(q) ||
      (c.goals || '').toLowerCase().includes(q)
    );
  });

  // Filter & Sort Recipes Alphabetically according to visibility rules:
  // - Public: created by any user and marked public (or default)
  // - Internal: created by users in my circle and marked internal
  // - Private: ONLY visible to authenticated user who created it
  const matchedCategoryNames = q ? searchCategories(q).map(m => (m.category?.name || '').toLowerCase()) : [];

  const filteredRecipes = communityRecipes.filter(recipe => {
    const isAuthor = Boolean(
      recipe.authorId && currentUser?.id && recipe.authorId === currentUser.id
    );

    const vis = (recipe.visibility as string) || 'public';

    if (vis === 'private' && !isAuthor) {
      return false;
    }

    if (vis === 'internal' && !isAuthor) {
      const creator = creators.find(c => c.id === recipe.authorId || (c.name && recipe.authorName && c.name.toLowerCase() === recipe.authorName.toLowerCase()));
      const inCircle = creator
        ? creator.isInCircle || (currentUser && isUserInCircle(currentUser as any, creator.id, creators))
        : false;
      if (!inCircle) return false;
    }

    if (!q) return true;
    const catLower = (recipe.category || '').toLowerCase();
    const isCategoryMatch = catLower.includes(q) || matchedCategoryNames.includes(catLower);

    return (
      (recipe.title || '').toLowerCase().includes(q) ||
      (recipe.description || '').toLowerCase().includes(q) ||
      (recipe.authorName || '').toLowerCase().includes(q) ||
      isCategoryMatch ||
      (recipe.tags || []).some(t => (t || '').toLowerCase().includes(q))
    );
  }).sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));

  // Filter Projects
  const filteredProjects = projects.filter(project => {
    if (!q) return true;
    const catLower = (project.category || '').toLowerCase();
    const recipeTitleLower = (project.recipeTitle || '').toLowerCase();
    const titleLower = (project.title || '').toLowerCase();

    return (
      titleLower.includes(q) ||
      catLower.includes(q) ||
      recipeTitleLower.includes(q) ||
      (project.phases || []).some(ph =>
        (ph.title || '').toLowerCase().includes(q) ||
        (ph.tasks || []).some(t => (t.title || '').toLowerCase().includes(q))
      )
    );
  }).sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));

  // Filter Posts / Projects
  const filteredPosts = posts.filter(post => {
    if (!q) return true;
    const hashtagStr = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags || '';
    return (
      (post.title || '').toLowerCase().includes(q) ||
      (post.content || '').toLowerCase().includes(q) ||
      (post.userName || '').toLowerCase().includes(q) ||
      (hashtagStr || '').toLowerCase().includes(q)
    );
  });

  const isRecipeSavedInLib = (recipe: Recipe) => {
    return (savedRecipeIds || []).includes(recipe.id);
  };

  const handleToggleBookmark = (recipe: Recipe) => {
    const isSaved = isRecipeSavedInLib(recipe);
    if (isSaved) {
      setUnbookmarkRecipeTarget({ id: recipe.id, title: recipe.title });
    } else {
      if (onToggleSaveRecipe) {
        onToggleSaveRecipe(recipe.id, recipe);
      }
      setSuccessMessage(`Saved "${recipe.title}" to your library!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleFork = (recipe: Recipe) => {
    onForkRecipe(recipe);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto bg-gray-900/40 backdrop-blur-sm" id="search-modal-root">
      <div className="rounded-none sm:rounded-3xl w-full h-full sm:h-auto max-w-none sm:max-w-4xl overflow-hidden shadow-2xl border max-h-full sm:max-h-[90vh] flex flex-col bg-white text-gray-900 border-gray-200">
        
        {/* Modal Header in Deep Teal Light */}
        <div className="p-4 sm:p-5 flex flex-col gap-3 shrink-0 border-b border-[#0D9488]/20 bg-[#99F6E4] text-gray-900">
          {/* Top Row: Search Input + Close Button */}
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#0D9488]" />
              <input
                type="text"
                id="search-recipes-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#0D9488]/30 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#115E59] focus:ring-1 focus:ring-[#115E59] text-gray-900 placeholder-gray-500 shadow-sm"
                placeholder="Search by user, recipe title, project, tag (#creative, #recipe)..."
              />
            </div>
            <IconOnlySubButton
              id="close-search-btn"
              icon={X}
              onClick={onClose}
              title="Close Search Modal"
            />
          </div>

          {/* Options Row: All, Users, Recipes, Projects */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {categories.map((cat, cIdx) => (
              <button
                key={`search-tab-cat-${cat}-${cIdx}`}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shrink-0 border ${
                  selectedCategory === cat 
                    ? 'bg-[#115E59] text-white hover:text-white border-[#115E59] shadow-sm font-black' 
                    : 'bg-white/70 text-[#115E59] border-[#0D9488]/20 hover:bg-white hover:text-gray-900'
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
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F59E0B] uppercase">
                  <Users className="w-4 h-4" /> Users & Network ({filteredCreators.length})
                </div>
                {filteredCreators.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {filteredCreators.map((creator, idx) => (
                      <div 
                        key={`search-creator-${creator.id || idx}-${idx}`} 
                        className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-3 hover:border-white/20 transition-all cursor-pointer"
                        onClick={() => setSelectedCreator(creator)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {creator.avatarUrl && creator.avatarUrl.trim() !== '' ? (
                            <img 
                              src={creator.avatarUrl.trim()} 
                              alt={creator.name} 
                              className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                              <User className="w-5 h-5 text-white/70" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate flex items-center gap-1">
                              {creator.name}
                              {creator.isInCircle && <ShieldCheck className="w-3 h-3 text-[#F59E0B]" />}
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
                            creator.isFollowing ? 'bg-white/10 text-white' : 'bg-[#F59E0B] text-black font-black'
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
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F59E0B] uppercase">
                  <BookOpen className="w-4 h-4" /> Recipes & Blueprints ({filteredRecipes.length})
                </div>
                {filteredRecipes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRecipes.map((recipe, idx) => {
                      const isSaved = isRecipeSavedInLib(recipe);
                      const isAuthor = Boolean(
                        recipe.authorId && currentUser?.id && recipe.authorId === currentUser.id
                      );

                      return (
                        <ProcessTile
                          key={`search-recipe-${recipe.id || idx}-${idx}`}
                          type="recipe"
                          id={recipe.id}
                          title={recipe.title}
                          category={recipe.category}
                          authorName={recipe.authorName}
                          authorId={recipe.authorId}
                          phases={recipe.phases || []}
                          description={recipe.description}
                          forkedFrom={recipe.forkedFrom}
                          tags={recipe.tags || []}
                          isSaved={isSaved}
                          isAuthor={isAuthor}
                          onClickTile={() => setSelectedPreviewRecipe(recipe)}
                          onOpenCreatorProfile={onOpenCreatorProfile}
                          onToggleSaveRecipe={() => handleToggleBookmark(recipe)}
                          onExploreRecipe={() => setSelectedPreviewRecipe(recipe)}
                          onForkRecipe={() => handleFork(recipe)}
                          onStartRecipe={() => {
                            if (onSaveRecipe && !isSaved) {
                              onSaveRecipe(recipe);
                            }
                            setSelectedPreviewRecipe(recipe);
                          }}
                          onPrint={() => {
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
                        />
                      );
                    })}
                  </div>
                ) : (
                  (selectedCategory === 'Recipes' || selectedCategory === 'All') && (
                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-2xl text-xs text-gray-500 font-mono">
                      No recipes found matching query.
                    </div>
                  )
                )}
              </div>
            )}

            {/* 3. PROJECTS SECTION */}
            {(selectedCategory === 'All' || selectedCategory === 'Projects') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F59E0B] uppercase">
                  <FolderKanban className="w-4 h-4" /> Projects ({filteredProjects.length})
                </div>
                {filteredProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProjects.map((project, idx) => (
                      <ProcessTile
                        key={`search-project-${project.id || idx}-${idx}`}
                        type="project"
                        id={project.id}
                        title={project.title}
                        category={project.category}
                        recipeTitle={project.recipeTitle}
                        createdAt={project.createdAt}
                        phases={project.phases || []}
                        isCompleted={project.isCompleted}
                        onClickTile={() => {
                          if (onSelectProject) {
                            onSelectProject(project);
                            onClose();
                          }
                        }}
                        onEditProject={() => {
                          if (onEditProject) {
                            onEditProject(project);
                            onClose();
                          }
                        }}
                        onDeleteProject={() => {
                          if (onDeleteProject) {
                            onDeleteProject(project.id);
                          }
                        }}
                        onPrint={() => {
                          setPrintableItem({
                            id: project.id,
                            type: 'project',
                            title: project.title,
                            category: project.category,
                            phases: project.phases as any,
                          });
                          setPrintModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  selectedCategory === 'Projects' && filteredPosts.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl text-xs text-white/40 font-mono">
                      No projects found matching query.
                    </div>
                  )
                )}

                {/* Secondary: Community Posts & Updates matching query */}
                {filteredPosts.length > 0 && (
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-white/40 uppercase pt-2 border-t border-white/10">
                      Community Posts & Updates ({filteredPosts.length})
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredPosts.map((post, idx) => (
                        <div 
                          key={`search-post-${post.id || idx}-${idx}`} 
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
                  </div>
                )}
              </div>
            )}

            {/* End of Search Results */}

          </div>

          {/* Right Column: Dynamic Creator Profile Overlay Panel */}
          {selectedCreator && (
            <div className="w-full lg:w-80 bg-black/60 border border-white/10 rounded-2xl p-6 space-y-6 shrink-0 h-fit">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Creator Profile</span>
                <IconOnlySubButton
                  icon={X}
                  onClick={() => setSelectedCreator(null)}
                  title="Close Preview"
                />
              </div>

              <div className="text-center space-y-3">
                {selectedCreator.avatarUrl && selectedCreator.avatarUrl.trim() !== '' ? (
                  <img 
                    src={selectedCreator.avatarUrl.trim()} 
                    alt={selectedCreator.name} 
                    className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-[#F59E0B]/40 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto border-2 border-[#F59E0B]/40 shadow-md">
                    <User className="w-8 h-8 text-white/70" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white flex justify-center items-center gap-1.5">
                    {selectedCreator.name}
                    {selectedCreator.isInCircle && (
                      <ShieldCheck className="w-4 h-4 text-[#F59E0B]" title="In your network circle" />
                    )}
                  </h3>
                  <p className="text-[10px] font-mono text-white/40">{selectedCreator.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center border-y border-white/5 py-3">
                <div>
                  <div className="text-base font-bold font-mono text-[#F59E0B]">{selectedCreator.followersCount}</div>
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
                  <p className="text-xs text-white/80 font-sans leading-relaxed">
                    {selectedCreator.bio && selectedCreator.bio.trim() !== '' ? selectedCreator.bio : ""}
                  </p>
                </div>
                <div className="space-y-1">
                  <h5 className="text-[10px] font-mono text-white/40 uppercase font-bold">Focus Goals</h5>
                  <p className="text-xs text-white/70 font-mono leading-relaxed">
                    {selectedCreator.goals && selectedCreator.goals.trim() !== '' ? selectedCreator.goals : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <IconWithLabelButton
                  variant={selectedCreator.isFollowing ? "sub" : "primary"}
                  icon={selectedCreator.isFollowing ? UserMinus : UserPlus}
                  label={selectedCreator.isFollowing ? "UNFOLLOW" : "FOLLOW CREATOR"}
                  onClick={() => onToggleFollowCreator(selectedCreator.id)}
                  title="Toggle Follow Creator"
                  className="w-full"
                />

                <IconWithLabelButton
                  variant="sub"
                  icon={Users}
                  label={selectedCreator.isInCircle ? "REMOVE FROM CIRCLE" : "INVITE TO CIRCLE"}
                  onClick={() => onToggleCircleCreator(selectedCreator.id)}
                  title="Toggle Network Circle"
                  className="w-full"
                />
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

      {selectedPreviewRecipe && (
        <RecipeDetailModal
          recipe={selectedPreviewRecipe}
          onClose={() => setSelectedPreviewRecipe(null)}
          onStartRecipe={(rec) => {
            onSaveRecipe(rec);
            onClose();
          }}
          onForkRecipe={(rec) => {
            onForkRecipe(rec);
            onClose();
          }}
          onToggleSaveRecipe={(recId) => handleToggleBookmark(selectedPreviewRecipe)}
          onOpenCreatorProfile={(id) => {
            setSelectedPreviewRecipe(null);
            onClose();
            if (onOpenCreatorProfile) onOpenCreatorProfile(id);
          }}
          onPrintRecipe={(rec) => {
            setPrintableItem({
              id: rec.id,
              type: 'recipe',
              title: rec.title,
              description: rec.description,
              authorName: rec.authorName,
              category: rec.category,
              phases: rec.phases,
              tags: rec.tags,
              gongsCount: rec.gongsCount,
            });
            setPrintModalOpen(true);
          }}
        />
      )}

      {/* Unbookmark Confirmation Modal */}
      {unbookmarkRecipeTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181b] border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Bookmark className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Recipe from Library?</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Unbookmark Confirmation</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed font-sans">
              Are you sure you want to remove <strong className="text-white">"{unbookmarkRecipeTarget.title}"</strong> from your saved library?
            </p>

            <div className="flex justify-end items-center gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                id="cancel-unbookmark-btn"
                onClick={() => setUnbookmarkRecipeTarget(null)}
                className="px-4 py-2 text-xs font-mono font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-unbookmark-btn"
                onClick={() => {
                  const targetId = unbookmarkRecipeTarget.id;
                  if (onToggleSaveRecipe) {
                    onToggleSaveRecipe(targetId);
                  }
                  setSuccessMessage(`Removed "${unbookmarkRecipeTarget.title}" from your saved library.`);
                  setTimeout(() => setSuccessMessage(null), 3000);
                  setUnbookmarkRecipeTarget(null);
                }}
                className="px-4 py-2 text-xs font-mono font-bold text-black bg-[#F59E0B] hover:bg-[#FF751A] rounded-xl transition-all cursor-pointer shadow-md"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
