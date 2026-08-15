import { Recipe, Creator, FeedPost, Collection, Project } from '../types';

export const GONNNG_OFFICIAL_ID = '69c27a22-f1f4-4946-b26c-f8f165fdc4fa';

export const GONNNG_OFFICIAL_CREATOR: Creator = {
  id: GONNNG_OFFICIAL_ID,
  publicId: 'GONNNG',
  username: 'gonnng',
  name: 'Gonnng',
  email: 'hello@gonnng.com',
  avatarUrl: '',
  bio: 'Official Gonnng guides, processes, and recipes.',
  goals: 'Empower creators to document, improve, and finish their ideas.',
  privacyDefault: 'public',
  followersCount: 0,
  followingCount: 0,
  followerIds: [],
  followingIds: []
};

export const BLT_RECIPE_ID = 'recipe-make-a-delicious-blt';

export const BLT_RECIPE: Recipe = {
  id: BLT_RECIPE_ID,
  publicId: 'REC-BLT-01',
  title: 'Make a Delicious BLT',
  description: "It's time to make a Delicious BLT. Learn how to collect ingredients, prepare, assemble, and enjoy.",
  authorId: GONNNG_OFFICIAL_ID,
  authorName: 'Gonnng',
  authorUsername: 'gonnng',
  category: 'Culinary',
  tags: ['BLT', 'Sandwich', 'Culinary', 'Recipe'],
  visibility: 'public',
  isCustom: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  phases: [
    {
      id: 'phase-blt-1',
      title: "I'ts time to make a Delicious BLT",
      position: 1,
      tasks: [
        {
          id: 'task-blt-1-1',
          title: 'Sign up for Gonnng to track my BLT recipe',
          position: 1,
          completed: false
        }
      ]
    },
    {
      id: 'phase-blt-2',
      title: 'Collect the ingredients',
      position: 2,
      tasks: [
        {
          id: 'task-blt-2-1',
          title: 'Not too much bacon',
          position: 1,
          completed: false
        },
        {
          id: 'task-blt-2-2',
          title: 'Use the crisp lettuce',
          position: 2,
          completed: false
        },
        {
          id: 'task-blt-2-3',
          title: 'Only use excellent tomatoes',
          position: 3,
          completed: false
        },
        {
          id: 'task-blt-2-4',
          title: 'Use your favorite mayonnaise',
          position: 4,
          completed: false
        },
        {
          id: 'task-blt-2-5',
          title: 'Skip over the fancy bread',
          position: 5,
          completed: false
        }
      ]
    },
    {
      id: 'phase-blt-3',
      title: 'Prepare the ingredients',
      position: 3,
      tasks: [
        {
          id: 'task-blt-3-1',
          title: 'Season the Tomatoes',
          position: 1,
          completed: false
        },
        {
          id: 'task-blt-3-2',
          title: 'Cook the Bacon Flat and Crisp',
          position: 2,
          completed: false
        },
        {
          id: 'task-blt-3-3',
          title: 'Toast the Bread...in Bacon Fat',
          position: 3,
          completed: false
        }
      ]
    },
    {
      id: 'phase-blt-4',
      title: 'Assemble the sandwich',
      position: 4,
      tasks: [
        {
          id: 'task-blt-4-1',
          title: 'Layer Carefully',
          position: 1,
          completed: false
        },
        {
          id: 'task-blt-4-2',
          title: 'Triangles Taste Better',
          position: 2,
          completed: false
        },
        {
          id: 'task-blt-4-3',
          title: "Don't Mess With It",
          position: 3,
          completed: false
        }
      ]
    },
    {
      id: 'phase-blt-5',
      title: 'Enjoy!',
      position: 5,
      tasks: [
        {
          id: 'task-blt-5-1',
          title: 'Take a bite and enjoy this delicious sandwich!',
          position: 1,
          completed: false
        }
      ]
    }
  ]
};

export function createBLTProjectForUser(userId: string): Project {
  return {
    id: `project-blt-${userId || 'new-user'}`,
    userId: userId || 'user-current',
    title: 'Make a Delicious BLT',
    recipeId: BLT_RECIPE.id,
    recipeTitle: BLT_RECIPE.title,
    category: BLT_RECIPE.category || 'Culinary',
    createdAt: new Date().toISOString(),
    privacy: 'public',
    phases: [
      {
        id: `phase-blt-1-${userId}`,
        title: "I'ts time to make a Delicious BLT",
        position: 1,
        sourcePhaseId: 'phase-blt-1',
        tasks: [
          {
            id: `task-blt-1-1-${userId}`,
            title: 'Sign up for Gonnng to track my BLT recipe',
            completed: false,
            position: 1,
            sourceTaskId: 'task-blt-1-1'
          }
        ]
      },
      {
        id: `phase-blt-2-${userId}`,
        title: 'Collect the ingredients',
        position: 2,
        sourcePhaseId: 'phase-blt-2',
        tasks: [
          {
            id: `task-blt-2-1-${userId}`,
            title: 'Not too much bacon',
            completed: false,
            position: 1,
            sourceTaskId: 'task-blt-2-1'
          },
          {
            id: `task-blt-2-2-${userId}`,
            title: 'Use the crisp lettuce',
            completed: false,
            position: 2,
            sourceTaskId: 'task-blt-2-2'
          },
          {
            id: `task-blt-2-3-${userId}`,
            title: 'Only use excellent tomatoes',
            completed: false,
            position: 3,
            sourceTaskId: 'task-blt-2-3'
          },
          {
            id: `task-blt-2-4-${userId}`,
            title: 'Use your favorite mayonnaise',
            completed: false,
            position: 4,
            sourceTaskId: 'task-blt-2-4'
          },
          {
            id: `task-blt-2-5-${userId}`,
            title: 'Skip over the fancy bread',
            completed: false,
            position: 5,
            sourceTaskId: 'task-blt-2-5'
          }
        ]
      },
      {
        id: `phase-blt-3-${userId}`,
        title: 'Prepare the ingredients',
        position: 3,
        sourcePhaseId: 'phase-blt-3',
        tasks: [
          {
            id: `task-blt-3-1-${userId}`,
            title: 'Season the Tomatoes',
            completed: false,
            position: 1,
            sourceTaskId: 'task-blt-3-1'
          },
          {
            id: `task-blt-3-2-${userId}`,
            title: 'Cook the Bacon Flat and Crisp',
            completed: false,
            position: 2,
            sourceTaskId: 'task-blt-3-2'
          },
          {
            id: `task-blt-3-3-${userId}`,
            title: 'Toast the Bread...in Bacon Fat',
            completed: false,
            position: 3,
            sourceTaskId: 'task-blt-3-3'
          }
        ]
      },
      {
        id: `phase-blt-4-${userId}`,
        title: 'Assemble the sandwich',
        position: 4,
        sourcePhaseId: 'phase-blt-4',
        tasks: [
          {
            id: `task-blt-4-1-${userId}`,
            title: 'Layer Carefully',
            completed: false,
            position: 1,
            sourceTaskId: 'task-blt-4-1'
          },
          {
            id: `task-blt-4-2-${userId}`,
            title: 'Triangles Taste Better',
            completed: false,
            position: 2,
            sourceTaskId: 'task-blt-4-2'
          },
          {
            id: `task-blt-4-3-${userId}`,
            title: "Don't Mess With It",
            completed: false,
            position: 3,
            sourceTaskId: 'task-blt-4-3'
          }
        ]
      },
      {
        id: `phase-blt-5-${userId}`,
        title: 'Enjoy!',
        position: 5,
        sourcePhaseId: 'phase-blt-5',
        tasks: [
          {
            id: `task-blt-5-1-${userId}`,
            title: 'Take a bite and enjoy this delicious sandwich!',
            completed: false,
            position: 1,
            sourceTaskId: 'task-blt-5-1'
          }
        ]
      }
    ]
  };
}

export const INITIAL_RECIPES: Recipe[] = [BLT_RECIPE];
export const COMMUNITY_RECIPES: Recipe[] = [BLT_RECIPE];
export const INITIAL_CREATORS: Creator[] = [GONNNG_OFFICIAL_CREATOR];
export const INITIAL_COLLECTIONS: Collection[] = [];
export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_FEED_POSTS: FeedPost[] = [];
