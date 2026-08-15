import React, { useState } from 'react';
import { 
  BookHeart, 
  BookmarkCheck, 
  Bookmark, 
  BookOpenText, 
  UtensilsCrossed, 
  BookPlus, 
  SquarePen, 
  Shredder, 
  Printer, 
  NotebookText 
} from 'lucide-react';
import { 
  getCategoryColorCollection, 
  COLOR_COLLECTIONS, 
  ColorCollection, 
  SHADY_CRUST_DARK 
} from '../utils/categoryColors';

// ==========================================
// 1. CATEGORY BADGE
// ==========================================
export interface CategoryBadgeProps {
  category?: string;
  collection?: ColorCollection;
  className?: string;
}

export function CategoryBadge({ category, collection, className = '' }: CategoryBadgeProps) {
  const colors = collection || getCategoryColorCollection(category);
  const displayText = (category || 'GENERAL').toUpperCase();

  return (
    <span
      className={`inline-block border font-mono text-[10px] font-bold uppercase tracking-wider truncate max-w-full px-[6px] py-[4px] rounded-[3px] select-none ${className}`}
      style={{
        backgroundColor: colors.light,
        borderColor: colors.primary,
        color: colors.dark,
      }}
      title={displayText}
    >
      {displayText}
    </span>
  );
}

// ==========================================
// ==========================================
// 2. ICON ONLY PRIMARY BUTTON
// ==========================================
export interface IconOnlyButtonProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  onClick?: (e: React.MouseEvent) => void;
  collection?: ColorCollection;
  title?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function IconOnlyPrimaryButton({
  icon: Icon,
  onClick,
  title,
  id,
  disabled = false,
  className = '',
}: IconOnlyButtonProps) {
  const goldColors = COLOR_COLLECTIONS['Gonnng Gold'];
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      id={id}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={title}
      aria-label={title}
      className={`w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-[18px] flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-amber-300/40 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        backgroundColor: isHovered ? goldColors.light : goldColors.soft,
        borderRadius: '18px',
      }}
    >
      <Icon className="w-[20px] h-[20px] shrink-0" style={{ color: goldColors.dark }} />
    </button>
  );
}

// ==========================================
// 3. ICON ONLY TILE BUTTON
// ==========================================
export function IconOnlyTileButton({
  icon: Icon,
  onClick,
  collection,
  title,
  id,
  disabled = false,
  className = '',
}: IconOnlyButtonProps) {
  const colors = collection || COLOR_COLLECTIONS['Light Mayo'];
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      id={id}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={title}
      aria-label={title}
      className={`w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-[18px] flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        backgroundColor: isHovered ? colors.light : colors.soft,
      }}
    >
      <Icon className="w-[20px] h-[20px] shrink-0" style={{ color: colors.dark }} />
    </button>
  );
}

// ==========================================
// 4. ICON ONLY SUB BUTTON (SECONDARY)
// ==========================================
export function IconOnlySubButton({
  icon: Icon,
  onClick,
  collection,
  title,
  id,
  disabled = false,
  className = '',
}: IconOnlyButtonProps) {
  const colors = collection || COLOR_COLLECTIONS['Light Mayo'];
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      id={id}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={title}
      aria-label={title}
      className={`w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-[18px] flex items-center justify-center transition-colors cursor-pointer shrink-0 bg-transparent disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        backgroundColor: isHovered ? colors.light : 'transparent',
      }}
    >
      <Icon className="w-[20px] h-[20px] shrink-0" style={{ color: colors.dark }} />
    </button>
  );
}

// ==========================================
// 5. ICON WITH LABEL BUTTON
// ==========================================
export interface IconWithLabelButtonProps {
  variant?: 'primary' | 'tile' | 'sub' | 'shady' | 'tomato';
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  collection?: ColorCollection;
  title?: string;
  id?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  mobileIconOnly?: boolean;
}

export function IconWithLabelButton({
  variant = 'primary',
  icon: Icon,
  label,
  onClick,
  collection,
  title,
  id,
  disabled = false,
  type = 'button',
  className = '',
  mobileIconOnly = false,
}: IconWithLabelButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const goldColors = COLOR_COLLECTIONS['Gonnng Gold'];
  const tomatoColors = COLOR_COLLECTIONS['Tomato Pink'];
  const catColors = collection || COLOR_COLLECTIONS['Light Mayo'];

  let bg = goldColors.soft;
  let bgHover = goldColors.light;
  let textColor = goldColors.dark;
  let borderRadius = 'rounded-[8px]';
  let borderStyle = 'border border-amber-300/40';

  if (variant === 'primary') {
    bg = goldColors.soft;
    bgHover = goldColors.light;
    textColor = goldColors.dark;
    borderRadius = 'rounded-[8px]';
    borderStyle = 'border border-amber-300/40';
  } else if (variant === 'tile') {
    bg = catColors.soft;
    bgHover = catColors.light;
    textColor = catColors.dark;
    borderRadius = 'rounded-[18px]';
    borderStyle = 'border border-transparent';
  } else if (variant === 'sub') {
    bg = 'transparent';
    bgHover = catColors.light;
    textColor = catColors.dark;
    borderRadius = 'rounded-[18px]';
    borderStyle = 'border border-transparent';
  } else if (variant === 'shady') {
    bg = '#F4F4F5';
    bgHover = '#E4E4E7';
    textColor = '#18181B';
    borderRadius = 'rounded-[8px]';
    borderStyle = 'border border-[#D4D4D8]';
  } else if (variant === 'tomato') {
    bg = tomatoColors.soft;
    bgHover = tomatoColors.light;
    textColor = tomatoColors.dark;
    borderRadius = 'rounded-[8px]';
    borderStyle = 'border border-red-200';
  }

  const radiusClass = mobileIconOnly ? `rounded-[18px] sm:${borderRadius}` : borderRadius;
  const dimensionClass = mobileIconOnly ? 'w-[44px] min-w-[44px] sm:w-auto px-0 sm:px-[12px]' : 'px-[12px]';

  return (
    <button
      type={type}
      id={id}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={title || label}
      aria-label={title || label}
      className={`h-[44px] min-h-[44px] ${dimensionClass} py-[4px] inline-flex items-center justify-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${radiusClass} ${borderStyle} ${className}`}
      style={{
        backgroundColor: isHovered ? bgHover : bg,
        color: textColor,
      }}
    >
      {Icon && <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: textColor }} />}
      <span className={`${mobileIconOnly ? 'hidden sm:inline' : ''} truncate`}>{label}</span>
    </button>
  );
}

// Shared Phase Item interface
export interface PhaseTask {
  id?: string;
  title?: string;
  completed: boolean;
}

export interface PhaseItem {
  id?: string;
  title: string;
  tasks: PhaseTask[];
}

// ==========================================
// 4. RECIPE TILE
// ==========================================
export interface RecipeTileProps {
  id: string;
  title: string;
  category?: string;
  authorName?: string;
  authorId?: string;
  phases?: PhaseItem[];
  isSaved?: boolean;
  isAuthor?: boolean;
  onClickTile?: () => void;
  onOpenCreatorProfile?: (authorIdOrName: string) => void;
  onToggleSaveRecipe?: (recipeId: string) => void;
  onEditRecipe?: () => void;
  onForkRecipe?: () => void;
  onStartRecipe?: () => void;
  className?: string;
}

export function RecipeTile({
  id,
  title,
  category,
  authorName,
  authorId,
  phases = [],
  isSaved = false,
  isAuthor = false,
  onClickTile,
  onOpenCreatorProfile,
  onToggleSaveRecipe,
  onEditRecipe,
  onForkRecipe,
  onStartRecipe,
  className = '',
}: RecipeTileProps) {
  const colors = getCategoryColorCollection(category);
  const goldColors = COLOR_COLLECTIONS['Gonnng Gold'];

  return (
    <div
      id={`recipe-tile-${id}`}
      onClick={onClickTile}
      className={`p-4 rounded-[12px] border transition-all cursor-pointer flex flex-col justify-between space-y-3.5 shadow-sm hover:shadow-md h-full min-h-[290px] w-full ${className}`}
      style={{
        backgroundColor: colors.ultraLight,
        borderColor: colors.dark,
      }}
    >
      <div className="space-y-3">
        {/* TOP BAR */}
        <div className="flex justify-between items-center gap-2">
          <CategoryBadge category={category || 'GENERAL'} collection={colors} />
          
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {isAuthor ? (
              <IconOnlySubButton
                id={`recipe-author-heart-${id}`}
                icon={BookHeart}
                collection={colors}
                title="Recipe Created by You"
              />
            ) : isSaved ? (
              <IconOnlyTileButton
                id={`recipe-bookmark-saved-${id}`}
                icon={BookmarkCheck}
                collection={colors}
                title="Bookmarked in Library (Click to remove)"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSaveRecipe) onToggleSaveRecipe(id);
                }}
              />
            ) : (
              <IconOnlySubButton
                id={`recipe-bookmark-add-${id}`}
                icon={Bookmark}
                collection={colors}
                title="Bookmark Recipe"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSaveRecipe) onToggleSaveRecipe(id);
                }}
              />
            )}
          </div>
        </div>

        {/* RECIPE TITLE */}
        <div className="w-full min-w-0">
          <h5 
            className="text-sm font-bold leading-snug w-full truncate text-ellipsis overflow-hidden whitespace-nowrap"
            title={title || 'Untitled Recipe'}
            style={{ color: SHADY_CRUST_DARK }}
          >
            {title || 'Untitled Recipe'}
          </h5>

          {/* CREATED BY */}
          <p className="text-[11px] font-sans font-medium mt-1" style={{ color: colors.dark }}>
            Created by:{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenCreatorProfile && (authorId || authorName)) {
                  onOpenCreatorProfile(authorId || authorName || '');
                }
              }}
              className="font-bold hover:underline cursor-pointer transition-colors"
              style={{ color: colors.dark }}
            >
              {authorName || 'Anonymous'}
            </button>
          </p>
        </div>

        {/* PERCENTAGE BAR (100% full for recipes) */}
        <div 
          className="w-full h-[6px] border rounded-[3px] overflow-hidden"
          style={{
            borderColor: colors.primary,
            backgroundColor: colors.primary,
          }}
        >
          <div 
            className="h-full w-full rounded-[3px]"
            style={{ backgroundColor: colors.primary }}
          />
        </div>

        {/* RECIPE CONTENTS PREVIEW */}
        <div className="space-y-1.5 pt-0.5">
          <p 
            className="text-[10px] font-mono uppercase tracking-wider font-bold"
            style={{ color: SHADY_CRUST_DARK }}
          >
            IN THIS RECIPE...
          </p>
          
          <div className="space-y-1">
            {phases.slice(0, 3).map((ph, phIdx) => (
              <div 
                key={ph.id ? `rec-phase-${ph.id}` : `rec-phase-${id}-${phIdx}`} 
                className="flex justify-between items-center text-xs text-black"
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <span className="shrink-0">•</span>
                  <span 
                    className="truncate font-sans font-normal"
                    style={{ color: SHADY_CRUST_DARK }}
                  >
                    {ph.title}
                  </span>
                </div>
                <span 
                  className="text-xs font-mono font-bold shrink-0"
                  style={{ color: colors.dark }}
                >
                  {ph.tasks ? ph.tasks.length : 0}
                </span>
              </div>
            ))}

            {phases.length > 3 && (
              <p 
                className="text-xs font-mono pl-3 pt-0.5 font-bold"
                style={{ color: SHADY_CRUST_DARK }}
              >
                ...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ACTIONS BAR */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/10">
        {/* Lower Left */}
        <div className="shrink-0">
          {isAuthor ? (
            <IconOnlySubButton
              id={`edit-recipe-${id}`}
              icon={BookOpenText}
              collection={colors}
              title="Edit Recipe Blueprint"
              onClick={(e) => {
                e.stopPropagation();
                if (onEditRecipe) onEditRecipe();
              }}
            />
          ) : (
            <div className="w-[44px] h-[44px]" />
          )}
        </div>

        {/* Lower Right */}
        <div className="flex items-center gap-2 shrink-0">
          <IconOnlySubButton
            id={`fork-recipe-${id}`}
            icon={UtensilsCrossed}
            collection={goldColors}
            title="Fork / Copy Recipe"
            onClick={(e) => {
              e.stopPropagation();
              if (onForkRecipe) onForkRecipe();
            }}
          />
          <IconOnlyTileButton
            id={`start-recipe-${id}`}
            icon={BookPlus}
            collection={goldColors}
            title="Start Project from Recipe"
            onClick={(e) => {
              e.stopPropagation();
              if (onStartRecipe) onStartRecipe();
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. PROJECT TILE
// ==========================================
export interface ProjectTileProps {
  id: string;
  title: string;
  category?: string;
  createdAt?: string | number;
  phases?: PhaseItem[];
  progress?: number;
  isCompleted?: boolean;
  onClickTile?: () => void;
  onEditProject?: () => void;
  onDeleteProject?: () => void;
  onPrint?: () => void;
  onCompleteProject?: () => void;
  className?: string;
}

export function ProjectTile({
  id,
  title,
  category,
  createdAt,
  phases = [],
  progress,
  isCompleted = false,
  onClickTile,
  onEditProject,
  onDeleteProject,
  onPrint,
  onCompleteProject,
  className = '',
}: ProjectTileProps) {
  const colors = getCategoryColorCollection(category);
  const tomatoColors = COLOR_COLLECTIONS['Tomato Pink'];
  const goldColors = COLOR_COLLECTIONS['Gonnng Gold'];

  // Calculate total vs completed tasks
  let totalTasks = 0;
  let completedTasks = 0;

  phases.forEach((ph) => {
    if (ph.tasks) {
      totalTasks += ph.tasks.length;
      completedTasks += ph.tasks.filter((t) => t.completed).length;
    }
  });

  const calculatedProgress = progress !== undefined 
    ? progress 
    : (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);

  const formattedDate = createdAt 
    ? new Date(createdAt).toLocaleDateString() 
    : 'N/A';

  return (
    <div
      id={`project-tile-${id}`}
      onClick={onClickTile}
      className={`p-4 rounded-[12px] border transition-all cursor-pointer flex flex-col justify-between space-y-3.5 shadow-sm hover:shadow-md h-full min-h-[290px] w-full ${className}`}
      style={{
        backgroundColor: colors.ultraLight,
        borderColor: colors.dark,
      }}
    >
      <div className="space-y-3">
        {/* TOP BAR */}
        <div className="flex justify-between items-center gap-2">
          <CategoryBadge category={category || 'GENERAL'} collection={colors} />

          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <IconOnlyTileButton
              id={`edit-project-${id}`}
              icon={SquarePen}
              collection={colors}
              title="Edit Project"
              onClick={(e) => {
                e.stopPropagation();
                if (onEditProject) onEditProject();
              }}
            />
          </div>
        </div>

        {/* PROJECT TITLE */}
        <div className="w-full min-w-0">
          <h5 
            className="text-sm font-bold leading-snug w-full truncate text-ellipsis overflow-hidden whitespace-nowrap"
            title={title || 'Untitled Project'}
            style={{ color: SHADY_CRUST_DARK }}
          >
            {title || 'Untitled Project'}
          </h5>

          {/* CREATED DATE */}
          <p className="text-[11px] font-sans font-medium mt-1" style={{ color: colors.dark }}>
            Created: {formattedDate}
          </p>
        </div>

        {/* PERCENTAGE BAR */}
        <div 
          className="w-full h-[6px] border rounded-[3px] overflow-hidden"
          style={{
            borderColor: colors.primary,
            backgroundColor: colors.ultraLight,
          }}
        >
          <div 
            className="h-full rounded-[3px] transition-all duration-300"
            style={{
              width: `${calculatedProgress}%`,
              backgroundColor: colors.primary,
            }}
          />
        </div>

        {/* PROJECT CONTENTS PREVIEW */}
        <div className="space-y-1.5 pt-0.5">
          <p 
            className="text-[10px] font-mono uppercase tracking-wider font-bold"
            style={{ color: SHADY_CRUST_DARK }}
          >
            IN THIS PROJECT...
          </p>

          <div className="space-y-1">
            {phases.slice(0, 3).map((ph, phIdx) => {
              const phTotal = ph.tasks ? ph.tasks.length : 0;
              const phDone = ph.tasks ? ph.tasks.filter((t) => t.completed).length : 0;

              return (
                <div 
                  key={ph.id ? `proj-phase-${ph.id}` : `proj-phase-${id}-${phIdx}`} 
                  className="flex justify-between items-center text-xs text-black"
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="shrink-0">•</span>
                    <span 
                      className="truncate font-sans font-normal"
                      style={{ color: SHADY_CRUST_DARK }}
                    >
                      {ph.title}
                    </span>
                  </div>
                  <span 
                    className="text-xs font-mono font-bold shrink-0"
                    style={{ color: colors.dark }}
                  >
                    {phDone}/{phTotal}
                  </span>
                </div>
              );
            })}

            {phases.length > 3 && (
              <p 
                className="text-xs font-mono pl-3 pt-0.5 font-bold"
                style={{ color: SHADY_CRUST_DARK }}
              >
                ...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ACTIONS BAR */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/10">
        {/* Lower Left */}
        <div className="shrink-0">
          <IconOnlySubButton
            id={`delete-project-${id}`}
            icon={Shredder}
            collection={tomatoColors}
            title="Delete Project"
            onClick={(e) => {
              e.stopPropagation();
              if (onDeleteProject) onDeleteProject();
            }}
          />
        </div>

        {/* Lower Right */}
        <div className="flex items-center gap-2 shrink-0">
          <IconOnlyTileButton
            id={`complete-project-${id}`}
            icon={NotebookText}
            collection={goldColors}
            title="Complete Project"
            onClick={(e) => {
              e.stopPropagation();
              if (onCompleteProject) onCompleteProject();
              else if (onClickTile) onClickTile();
            }}
          />
        </div>
      </div>
    </div>
  );
}
