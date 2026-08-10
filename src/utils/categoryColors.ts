import { getCategoryByName, PARENT_CATEGORY_GROUPS } from '../data/categoriesData';

export interface ColorCollection {
  name: string;
  ultraLight: string;
  soft: string;
  light: string;
  primary: string;
  dark: string;
}

// Shady Crust Dark for primary black text
export const SHADY_CRUST_DARK = '#18181B';

export const COLOR_COLLECTIONS: Record<string, ColorCollection> = {
  'Light Mayo': {
    name: 'Light Mayo',
    ultraLight: '#FFFDF2',
    soft: '#FFF6D6',
    light: '#FFEAA8',
    primary: '#E5B83B',
    dark: '#664C0A',
  },
  'Shady Crust': {
    name: 'Shady Crust',
    ultraLight: '#F4F4F5',
    soft: '#A1A1AA',
    light: '#71717A',
    primary: '#27272A',
    dark: '#18181B',
  },
  'Juicy Purple': {
    name: 'Juicy Purple',
    ultraLight: '#FAF5FF',
    soft: '#F3E8FF',
    light: '#E9D5FF',
    primary: '#C99BFF',
    dark: '#581C87',
  },
  'Bacon Brown': {
    name: 'Bacon Brown',
    ultraLight: '#FDF8F5',
    soft: '#F9EBE3',
    light: '#F2D2C2',
    primary: '#C06A3F',
    dark: '#5C2B14',
  },
  'Crunchy Green': {
    name: 'Crunchy Green',
    ultraLight: '#F7FCEE',
    soft: '#ECF8D7',
    light: '#D7F0AE',
    primary: '#A9D86A',
    dark: '#365314',
  },
  'Bready Beige': {
    name: 'Bready Beige',
    ultraLight: '#FFFDF5',
    soft: '#FFF7DC',
    light: '#FCEBB9',
    primary: '#F2D28A',
    dark: '#714B00',
  },
  'Jammy Blue': {
    name: 'Jammy Blue',
    ultraLight: '#F0F8FF',
    soft: '#E0F2FE',
    light: '#BAE6FD',
    primary: '#82C9FF',
    dark: '#0369A1',
  },
  'Tomato Pink': {
    name: 'Tomato Pink',
    ultraLight: '#FFF5F3',
    soft: '#FFE6E2',
    light: '#FFC9BF',
    primary: '#FF9A84',
    dark: '#991B1B',
  },
  'Figgish Indigo': {
    name: 'Figgish Indigo',
    ultraLight: '#F5F3FF',
    soft: '#EDE9FE',
    light: '#DDD6FE',
    primary: '#A99BFF',
    dark: '#3730A3',
  },
  'Gonnng Gold': {
    name: 'Gonnng Gold',
    ultraLight: '#FFF8EB',
    soft: '#FEF3C7',
    light: '#FDE68A',
    primary: '#F59E0B',
    dark: '#7C2D12',
  },
  'Deep Teal': {
    name: 'Deep Teal',
    ultraLight: '#F0FDFA',
    soft: '#CCFBF1',
    light: '#99F6E4',
    primary: '#0D9488',
    dark: '#115E59',
  },
};

/**
 * Maps a category or parent category name to its Parent Category Color Collection.
 * Defaults to 'Light Mayo' if unknown or 'General'.
 */
export function getCategoryColorCollection(categoryName?: string): ColorCollection {
  if (!categoryName || categoryName.trim().toLowerCase() === 'general' || categoryName.trim().toLowerCase() === 'all') {
    return COLOR_COLLECTIONS['Light Mayo'];
  }

  const cleanName = categoryName.trim();

  // 1. Direct Parent Category Group check
  const directGroup = PARENT_CATEGORY_GROUPS.find(
    g => g.name.toLowerCase() === cleanName.toLowerCase() || g.colorName.toLowerCase() === cleanName.toLowerCase()
  );
  if (directGroup && COLOR_COLLECTIONS[directGroup.colorName]) {
    return COLOR_COLLECTIONS[directGroup.colorName];
  }

  // 2. Lookup category item in CATEGORIES_DATA
  const catItem = getCategoryByName(cleanName);
  if (catItem && catItem.colorName && COLOR_COLLECTIONS[catItem.colorName]) {
    return COLOR_COLLECTIONS[catItem.colorName];
  }

  // 3. Fallback
  return COLOR_COLLECTIONS['Light Mayo'];
}
