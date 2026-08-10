import React from 'react';
import { Recipe, Creator } from '../types';
import { RecipeExploreModal } from './ExploreModals';

export interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
  onStartRecipe?: (recipe: Recipe) => void;
  onForkRecipe?: (recipe: Recipe) => void;
  onEditRecipe?: (recipe: Recipe) => void;
  onUpdateRecipe?: (recipe: Recipe) => void;
  isSaved?: boolean;
  onToggleSaveRecipe?: (recipeId: string, recipeObj?: Recipe) => void;
  onPrintRecipe?: (recipe: Recipe) => void;
  currentUser?: { id?: string; name?: string; avatarUrl?: string; avatar?: string };
  creator?: Creator;
  onOpenCreatorProfile?: (creatorIdOrName: string) => void;
  initialEditMode?: boolean;
}

export default function RecipeDetailModal({
  recipe,
  onClose,
  onStartRecipe,
  onForkRecipe,
  onEditRecipe,
  onUpdateRecipe,
  isSaved = false,
  onToggleSaveRecipe,
  currentUser,
  onOpenCreatorProfile,
  initialEditMode = false
}: RecipeDetailModalProps) {
  return (
    <RecipeExploreModal
      recipe={recipe}
      isOpen={Boolean(recipe)}
      onClose={onClose}
      onUpdateRecipe={(updated) => {
        if (onUpdateRecipe) {
          onUpdateRecipe(updated);
        }
      }}
      onDeleteRecipe={() => {}}
      onStartProjectFromRecipe={onStartRecipe}
      onForkRecipe={onForkRecipe}
      isSaved={isSaved}
      onToggleSaveRecipe={onToggleSaveRecipe}
      onOpenCreatorProfile={onOpenCreatorProfile}
      currentUser={currentUser}
      initialEditMode={initialEditMode}
    />
  );
}
