export interface CategoryItem {
  id: string;
  name: string;
  synonyms: string[];
}

export interface CategoryMatch {
  category: CategoryItem;
  matchedBy: 'name' | 'synonym';
  matchedTerm?: string;
  score: number;
}

export const CATEGORIES_DATA: CategoryItem[] = [
  { id: 'cat-1', name: '3D Art', synonyms: ['3D rendering', 'CGI art', 'digital sculpture', '3D visuals'] },
  { id: 'cat-2', name: '3D Modeling', synonyms: ['CAD modeling', 'mesh modeling', 'Blender modeling', '3D asset creation'] },
  { id: 'cat-3', name: 'Animation', synonyms: ['motion design', '2D animation', 'cartooning', 'animator'] },
  { id: 'cat-4', name: 'App Design', synonyms: ['mobile app design', 'app UI design', 'application design'] },
  { id: 'cat-5', name: 'Architecture', synonyms: ['architectural design', 'building design', 'architect'] },
  { id: 'cat-6', name: 'Art Direction', synonyms: ['creative lead', 'visual direction', 'art director'] },
  { id: 'cat-7', name: 'Branding', synonyms: ['brand identity', 'logo design', 'brand strategy'] },
  { id: 'cat-8', name: 'Calligraphy', synonyms: ['hand lettering', 'script writing', 'lettering art'] },
  { id: 'cat-9', name: 'Cinematography', synonyms: ['camera work', 'director of photography', 'film photography'] },
  { id: 'cat-10', name: 'Code Development', synonyms: ['coding', 'software development', 'app building'] },
  { id: 'cat-11', name: 'Coloring', synonyms: ['digital coloring', 'comic coloring', 'colorist work'] },
  { id: 'cat-12', name: 'Concept Art', synonyms: ['visual development', 'concept design', 'idea sketches'] },
  { id: 'cat-13', name: 'Copywriting', synonyms: ['ad copy', 'content writing', 'marketing copy'] },
  { id: 'cat-14', name: 'Costume Design', synonyms: ['wardrobe design', 'costume making', 'costuming'] },
  { id: 'cat-15', name: 'Crafts', synonyms: ['handmade crafts', 'craft projects', 'DIY crafts'] },
  { id: 'cat-16', name: 'Creative Direction', synonyms: ['creative lead', 'brand vision', 'creative strategy'] },
  { id: 'cat-17', name: 'Culinary Arts', synonyms: ['cooking', 'chef work', 'gastronomy'] },
  { id: 'cat-18', name: 'Development', synonyms: ['software dev', 'app development', 'product build'] },
  { id: 'cat-19', name: 'Digital Art', synonyms: ['digital painting', 'digital illustration', 'computer art'] },
  { id: 'cat-20', name: 'Directing', synonyms: ['film directing', 'director', 'directorial work'] },
  { id: 'cat-21', name: 'Drawing', synonyms: ['sketching', 'pencil art', 'freehand drawing'] },
  { id: 'cat-22', name: 'Editing', synonyms: ['video editing', 'photo editing', 'post-production'] },
  { id: 'cat-23', name: 'Editorial', synonyms: ['magazine layout', 'editorial design', 'publication design'] },
  { id: 'cat-24', name: 'Education', synonyms: ['teaching', 'tutoring', 'learning content'] },
  { id: 'cat-25', name: 'Engineering', synonyms: ['technical design', 'mechanical engineering', 'systems design'] },
  { id: 'cat-26', name: 'Exhibition Design', synonyms: ['gallery design', 'museum design', 'installation design'] },
  { id: 'cat-27', name: 'Fashion', synonyms: ['apparel design', 'clothing design', 'style design'] },
  { id: 'cat-28', name: 'Film', synonyms: ['filmmaking', 'movies', 'cinema'] },
  { id: 'cat-29', name: 'Fine Art', synonyms: ['gallery art', 'painting', 'traditional art'] },
  { id: 'cat-30', name: 'Floral', synonyms: ['flower arranging', 'florist work', 'floral design'] },
  { id: 'cat-31', name: 'Furniture', synonyms: ['furniture design', 'furniture making', 'woodwork furniture'] },
  { id: 'cat-32', name: 'Game Design', synonyms: ['video game design', 'level design', 'game mechanics'] },
  { id: 'cat-33', name: 'Graffiti', synonyms: ['street art', 'spray paint art', 'mural art'] },
  { id: 'cat-34', name: 'Graphic Design', synonyms: ['visual design', 'layout design', 'print design'] },
  { id: 'cat-35', name: 'Illustration', synonyms: ['drawing', 'digital illustration', 'book illustration'] },
  { id: 'cat-36', name: 'Industrial Design', synonyms: ['product design', 'manufacturing design'] },
  { id: 'cat-37', name: 'Interior Design', synonyms: ['home design', 'space planning', 'decor design'] },
  { id: 'cat-38', name: 'Motion Graphics', synonyms: ['animated graphics', 'kinetic typography', 'motion design'] },
  { id: 'cat-39', name: 'Music', synonyms: ['songwriting', 'composing', 'audio production'] },
  { id: 'cat-40', name: 'Packaging', synonyms: ['package design', 'product packaging'] },
  { id: 'cat-41', name: 'Painting', synonyms: ['fine art', 'brushwork', 'canvas art'] },
  { id: 'cat-42', name: 'Performing Arts', synonyms: ['theater', 'stage performance', 'dance'] },
  { id: 'cat-43', name: 'Photography', synonyms: ['photo shoot', 'camera work', 'photographer'] },
  { id: 'cat-44', name: 'Photojournalism', synonyms: ['documentary photography', 'news photography'] },
  { id: 'cat-45', name: 'Product Develoment', synonyms: ['product design', 'product build', 'new product creation'] },
  { id: 'cat-46', name: 'Programming', synonyms: ['coding', 'software engineering', 'dev work'] },
  { id: 'cat-47', name: 'Retouching', synonyms: ['photo editing', 'image retouching', 'post processing'] },
  { id: 'cat-48', name: 'Sculpting', synonyms: ['3D sculpture', 'clay modeling', 'carving'] },
  { id: 'cat-49', name: 'Set Design', synonyms: ['stage design', 'production design', 'scenic design'] },
  { id: 'cat-50', name: 'Sketching', synonyms: ['rough drawing', 'thumbnail sketch', 'doodling'] },
  { id: 'cat-51', name: 'Sound Design', synonyms: ['audio design', 'sound engineering', 'foley'] },
  { id: 'cat-52', name: 'Storyboarding', synonyms: ['visual scripting', 'shot planning', 'storyboard art'] },
  { id: 'cat-53', name: 'Typography', synonyms: ['font design', 'lettering', 'type design'] },
  { id: 'cat-54', name: 'UI/UX', synonyms: ['user interface design', 'user experience design', 'product design'] },
  { id: 'cat-[#FF5C00]', name: 'Web Design', synonyms: ['website design', 'site layout', 'web UI'] },
  { id: 'cat-56', name: 'Woodworking', synonyms: ['carpentry', 'wood crafting', 'joinery'] },
  { id: 'cat-57', name: 'Writing', synonyms: ['authoring', 'prose', 'content creation'] },
  { id: 'cat-58', name: 'Art', synonyms: ['artwork', 'creative work', 'visual art'] },
  { id: 'cat-59', name: 'Big Idea', synonyms: ['concept', 'innovation', 'breakthrough idea'] },
  { id: 'cat-60', name: 'Building', synonyms: ['construction', 'making', 'creating'] },
  { id: 'cat-61', name: 'Business', synonyms: ['entrepreneurship', 'startup', 'commerce'] },
  { id: 'cat-62', name: 'Challenges', synonyms: ['competitions', 'contests', 'prompts'] },
  { id: 'cat-63', name: 'Collaboration', synonyms: ['teamwork', 'partnership', 'co-creation'] },
  { id: 'cat-64', name: 'Community', synonyms: ['group', 'network', 'collective'] },
  { id: 'cat-65', name: 'Crafting', synonyms: ['handmade', 'making things', 'hands-on creation'] },
  { id: 'cat-66', name: 'Design', synonyms: ['visual design', 'layout', 'aesthetics'] },
  { id: 'cat-67', name: 'DIY', synonyms: ['do it yourself', 'homemade', 'self-made'] },
  { id: 'cat-68', name: 'Entrepreneurship', synonyms: ['startup', 'business building', 'founder'] },
  { id: 'cat-69', name: 'Experimental', synonyms: ['avant-garde', 'exploratory', 'unconventional work'] },
  { id: 'cat-70', name: 'Food', synonyms: ['cuisine', 'cooking', 'culinary'] },
  { id: 'cat-71', name: 'Game Development', synonyms: ['video game dev', 'game programming'] },
  { id: 'cat-72', name: 'Inventions', synonyms: ['innovations', 'prototypes', 'new ideas'] },
  { id: 'cat-73', name: 'Learning', synonyms: ['education', 'skill building', 'self-study'] },
  { id: 'cat-74', name: 'Marketing', synonyms: ['promotion', 'advertising', 'brand marketing'] },
  { id: 'cat-75', name: 'Passion', synonyms: ['hobby', 'personal interest', 'side project'] },
  { id: 'cat-76', name: 'Performance', synonyms: ['live performance', 'acting', 'stage work'] },
  { id: 'cat-77', name: 'Personal Growth', synonyms: ['self-improvement', 'self-development'] },
  { id: 'cat-78', name: 'Podcasting', synonyms: ['audio show', 'podcast production'] },
  { id: 'cat-79', name: 'Research & Ideas', synonyms: ['brainstorming', 'exploration', 'concepting'] },
  { id: 'cat-80', name: 'Side Hustle', synonyms: ['freelance work', 'side project', 'side business'] },
  { id: 'cat-81', name: 'Social Media', synonyms: ['content creation', 'social posts', 'digital marketing'] },
  { id: 'cat-82', name: 'Stories', synonyms: ['narratives', 'storytelling', 'tales'] },
  { id: 'cat-83', name: 'Storytelling', synonyms: ['narrative craft', 'story crafting', 'narration'] },
  { id: 'cat-84', name: 'Technology', synonyms: ['tech', 'innovation', 'digital tools'] },
  { id: 'cat-85', name: 'Video', synonyms: ['videography', 'film', 'video content'] },
  { id: 'cat-86', name: 'Vlog', synonyms: ['video blog', 'video diary', 'vlogging'] },
  { id: 'cat-87', name: 'Hobby', synonyms: ['pastime', 'personal interest', 'leisure activity'] }
];

// Fix cat-55 id string fix
CATEGORIES_DATA[54].id = 'cat-55';

/**
 * Perform category autocomplete search with synonym matching.
 */
export function searchCategories(query: string, categories: CategoryItem[] = CATEGORIES_DATA): CategoryMatch[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return categories.map(cat => ({
      category: cat,
      matchedBy: 'name',
      score: 1
    }));
  }

  const results: CategoryMatch[] = [];

  for (const cat of categories) {
    const nameLower = cat.name.toLowerCase();
    
    // Check direct name match
    if (nameLower === normalizedQuery) {
      results.push({
        category: cat,
        matchedBy: 'name',
        score: 100
      });
      continue;
    }

    if (nameLower.startsWith(normalizedQuery)) {
      results.push({
        category: cat,
        matchedBy: 'name',
        score: 80
      });
      continue;
    }

    if (nameLower.includes(normalizedQuery)) {
      results.push({
        category: cat,
        matchedBy: 'name',
        score: 60
      });
      continue;
    }

    // Check synonym matches
    let synonymMatch: string | undefined;
    let maxSynonymScore = 0;

    for (const syn of cat.synonyms) {
      const synLower = syn.toLowerCase();

      if (synLower === normalizedQuery) {
        maxSynonymScore = 90;
        synonymMatch = syn;
        break;
      }

      if (synLower.startsWith(normalizedQuery)) {
        if (70 > maxSynonymScore) {
          maxSynonymScore = 70;
          synonymMatch = syn;
        }
      } else if (synLower.includes(normalizedQuery) || normalizedQuery.includes(synLower)) {
        if (50 > maxSynonymScore) {
          maxSynonymScore = 50;
          synonymMatch = syn;
        }
      }
    }

    if (maxSynonymScore > 0 && synonymMatch) {
      results.push({
        category: cat,
        matchedBy: 'synonym',
        matchedTerm: synonymMatch,
        score: maxSynonymScore
      });
    }
  }

  // Sort results by score descending, then alphabetically by category name
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.category.name.localeCompare(b.category.name);
  });
}
