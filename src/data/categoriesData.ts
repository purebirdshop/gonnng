export interface ParentCategoryGroup {
  name: string;
  colorName: string;
  colorHex: string;
  why: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  parentCategory: string;
  colorName: string;
  colorHex: string;
  synonyms: string[];
  commonProjects?: string[];
}

export interface CategoryMatch {
  category: CategoryItem;
  matchedBy: 'name' | 'synonym' | 'commonProject' | 'parentCategory';
  matchedTerm?: string;
  score: number;
}

export const PARENT_CATEGORY_GROUPS: ParentCategoryGroup[] = [
  {
    name: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    why: 'Purple = classic art/creativity/royalty, stage lighting'
  },
  {
    name: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    why: 'Earthy, tactile — wood, kitchen, handmade materials'
  },
  {
    name: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    why: 'Green = growth/systems, plus old-school terminal-green "crunching" data'
  },
  {
    name: 'Marketing & Business',
    colorName: 'Bready Beige',
    colorHex: '#f2d28a',
    why: 'Yellow/gold = optimism, attention-grabbing, "the bread and butter" of a business'
  },
  {
    name: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    why: 'Classic digital/screen blue — Figma, Adobe, pixels'
  },
  {
    name: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    why: 'Red = spotlight, drama, "action," film reels'
  },
  {
    name: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    why: 'Deep, intuitive, late-night-ideation indigo'
  }
];

export const CATEGORIES_DATA: CategoryItem[] = [
  // --- Music & Fine Art (Juicy Purple: #c99bff) ---
  {
    id: 'cat-art',
    name: 'Art',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['artwork', 'creative work', 'visual art'],
    commonProjects: ['personal art series', 'mixed media piece', 'sketchbook project', 'gallery submission', 'art commission', 'portfolio piece']
  },
  {
    id: 'cat-calligraphy',
    name: 'Calligraphy',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['hand lettering', 'script writing', 'lettering art'],
    commonProjects: ['wedding invitation', 'quote print', 'custom envelope', 'logo lettering', 'alphabet practice sheet', 'brush lettering piece']
  },
  {
    id: 'cat-coloring',
    name: 'Coloring',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['digital coloring', 'comic coloring', 'colorist work'],
    commonProjects: ['comic page coloring', 'coloring book page', 'line art fill', 'illustration color pass', 'manga coloring', 'flat color study']
  },
  {
    id: 'cat-drawing',
    name: 'Drawing',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['sketching', 'pencil art', 'freehand drawing'],
    commonProjects: ['portrait study', 'still life drawing', 'figure drawing', 'ink sketch', 'sketchbook page', 'charcoal piece']
  },
  {
    id: 'cat-fine-art',
    name: 'Fine Art',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['gallery art', 'painting', 'traditional art'],
    commonProjects: ['gallery painting', 'mixed media piece', 'art series', 'studio portfolio', 'exhibition artwork', 'art commission']
  },
  {
    id: 'cat-graffiti',
    name: 'Graffiti',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['street art', 'spray paint art', 'mural art'],
    commonProjects: ['wall mural', 'spray can piece', 'street art commission', 'tag design', 'community mural', 'stencil art']
  },
  {
    id: 'cat-music',
    name: 'Music',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['songwriting', 'composing', 'audio production'],
    commonProjects: ['original song', 'album production', 'film score', 'remix', 'jingle', 'live performance recording']
  },
  {
    id: 'cat-painting',
    name: 'Painting',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['fine art', 'brushwork', 'canvas art'],
    commonProjects: ['canvas painting', 'mural', 'watercolor series', 'abstract piece', 'portrait commission', 'plein air painting']
  },
  {
    id: 'cat-performance',
    name: 'Performance',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['live performance', 'acting', 'stage work'],
    commonProjects: ['live show', 'theater performance', 'dance recital', 'spoken word set', 'busking performance', 'open mic act']
  },
  {
    id: 'cat-performing-arts',
    name: 'Performing Arts',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['theater', 'stage performance', 'dance'],
    commonProjects: ['stage play', 'dance performance', 'theater production', 'improv show', 'choreography piece', 'spoken word performance']
  },
  {
    id: 'cat-photography',
    name: 'Photography',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['photo shoot', 'camera work', 'photographer'],
    commonProjects: ['portrait session', 'product photography', 'landscape shoot', 'event photography', 'editorial shoot', 'personal photo project']
  },
  {
    id: 'cat-sculpting',
    name: 'Sculpting',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['3D sculpture', 'clay modeling', 'carving'],
    commonProjects: ['clay figure', 'wood carving', 'stone sculpture', 'character maquette', 'relief carving', 'mixed media sculpture']
  },
  {
    id: 'cat-sketching',
    name: 'Sketching',
    parentCategory: 'Music & Fine Art',
    colorName: 'Juicy Purple',
    colorHex: '#c99bff',
    synonyms: ['rough drawing', 'thumbnail sketch', 'doodling'],
    commonProjects: ['travel sketchbook', 'concept thumbnail', 'quick figure sketch', 'urban sketching', 'idea doodle', 'storyboard thumbnail']
  },

  // --- Home & Hobby (Bacon Brown: #c06a3f) ---
  {
    id: 'cat-building',
    name: 'Building',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['construction', 'making', 'creating'],
    commonProjects: ['DIY build', 'prototype construction', 'home project', 'structure build', 'maker project', 'assembly project']
  },
  {
    id: 'cat-crafting',
    name: 'Crafting',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['handmade', 'making things', 'hands-on creation'],
    commonProjects: ['handmade gift', 'DIY decor', 'craft kit project', 'upcycled piece', 'seasonal craft', 'maker fair project']
  },
  {
    id: 'cat-crafts',
    name: 'Crafts',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['handmade crafts', 'craft projects', 'DIY crafts'],
    commonProjects: ['handmade card', 'holiday ornament', 'macrame piece', 'paper craft', 'upcycled decor', 'seasonal craft kit']
  },
  {
    id: 'cat-culinary-arts',
    name: 'Culinary Arts',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['cooking', 'chef work', 'gastronomy'],
    commonProjects: ['recipe development', 'plated dish', 'dessert creation', 'menu design', 'food styling', 'tasting event']
  },
  {
    id: 'cat-diy',
    name: 'DIY',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['do it yourself', 'homemade', 'self-made'],
    commonProjects: ['home improvement project', 'handmade gift', 'upcycled furniture', 'DIY decor', 'repair project', 'craft tutorial']
  },
  {
    id: 'cat-fashion',
    name: 'Fashion',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['apparel design', 'clothing design', 'style design'],
    commonProjects: ['clothing line', 'fashion sketch', 'garment prototype', 'lookbook', 'accessory design', 'runway collection']
  },
  {
    id: 'cat-floral',
    name: 'Floral',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['flower arranging', 'florist work', 'floral design'],
    commonProjects: ['wedding bouquet', 'floral centerpiece', 'seasonal arrangement', 'event installation', 'dried flower art', 'floral crown']
  },
  {
    id: 'cat-food',
    name: 'Food',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['cuisine', 'cooking', 'culinary'],
    commonProjects: ['recipe creation', 'food styling shoot', 'pop-up menu', 'baking project', 'food blog post', 'cooking video']
  },
  {
    id: 'cat-furniture',
    name: 'Furniture',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['furniture design', 'furniture making', 'woodwork furniture'],
    commonProjects: ['chair build', 'custom table', 'storage piece', 'furniture prototype', 'restoration project', 'modular shelving']
  },
  {
    id: 'cat-hobby',
    name: 'Hobby',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['pastime', 'personal interest', 'leisure activity'],
    commonProjects: ['weekend craft', 'personal collection project', 'casual art practice', 'DIY hobby build', 'hobby blog', 'leisure skill project']
  },
  {
    id: 'cat-interior-design',
    name: 'Interior Design',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['home design', 'space planning', 'decor design'],
    commonProjects: ['home renovation', 'office layout', 'room mood board', 'furniture layout plan', 'staging design', 'retail interior']
  },
  {
    id: 'cat-passion',
    name: 'Passion',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['hobby', 'personal interest', 'side project'],
    commonProjects: ['personal art project', 'hobby build', 'side creative venture', 'weekend project', 'passion blog', 'personal music project']
  },
  {
    id: 'cat-woodworking',
    name: 'Woodworking',
    parentCategory: 'Home & Hobby',
    colorName: 'Bacon Brown',
    colorHex: '#c06a3f',
    synonyms: ['carpentry', 'wood crafting', 'joinery'],
    commonProjects: ['handmade furniture', 'cutting board', 'wooden box', 'deck build', 'wood carving project', 'custom shelving']
  },

  // --- Industrial & Tech (Crunchy Green: #a9d86a) ---
  {
    id: 'cat-3d-modeling',
    name: '3D Modeling',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['CAD modeling', 'mesh modeling', 'Blender modeling', '3D asset creation'],
    commonProjects: ['game asset', 'architectural model', 'character rig', 'product prototype', '3D print file', 'environment mesh']
  },
  {
    id: 'cat-architecture',
    name: 'Architecture',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['architectural design', 'building design', 'architect'],
    commonProjects: ['house design', 'floor plan', 'building facade', 'renovation concept', 'urban master plan', 'pavilion design']
  },
  {
    id: 'cat-code-development',
    name: 'Code Development',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['coding', 'software development', 'app building'],
    commonProjects: ['personal website', 'CLI tool', 'automation script', 'portfolio site', 'small web app', 'browser extension']
  },
  {
    id: 'cat-development',
    name: 'Development',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['software dev', 'app development', 'product build'],
    commonProjects: ['web app', 'internal tool', 'feature build', 'MVP prototype', 'API integration', 'product beta']
  },
  {
    id: 'cat-engineering',
    name: 'Engineering',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['technical design', 'mechanical engineering', 'systems design'],
    commonProjects: ['product prototype', 'mechanical assembly', 'circuit design', 'structural test', 'machine part', 'system schematic']
  },
  {
    id: 'cat-game-design',
    name: 'Game Design',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['video game design', 'level design', 'game mechanics'],
    commonProjects: ['game level', 'mechanics prototype', 'board game design', 'puzzle design', 'game balance doc', 'indie game concept']
  },
  {
    id: 'cat-game-development',
    name: 'Game Development',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['video game dev', 'game programming'],
    commonProjects: ['indie game build', 'mobile game prototype', 'game jam entry', 'level design project', 'game mod', 'mechanics demo']
  },
  {
    id: 'cat-industrial-design',
    name: 'Industrial Design',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['product design', 'manufacturing design'],
    commonProjects: ['consumer product', 'appliance design', 'packaging prototype', 'furniture concept', 'tool design', 'product mockup']
  },
  {
    id: 'cat-inventions',
    name: 'Inventions',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['innovations', 'prototypes', 'new ideas'],
    commonProjects: ['product prototype', 'patent concept', 'gadget design', 'invention pitch', 'DIY solution', 'tech prototype']
  },
  {
    id: 'cat-product-development',
    name: 'Product Develoment',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['product design', 'product build', 'new product creation'],
    commonProjects: ['product prototype', 'MVP launch', 'feature roadmap', 'product redesign', 'market test product', 'packaging development']
  },
  {
    id: 'cat-programming',
    name: 'Programming',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['coding', 'software engineering', 'dev work'],
    commonProjects: ['personal app', 'coding challenge', 'open source contribution', 'automation tool', 'game script', 'portfolio project']
  },
  {
    id: 'cat-technology',
    name: 'Technology',
    parentCategory: 'Industrial & Tech',
    colorName: 'Crunchy Green',
    colorHex: '#a9d86a',
    synonyms: ['tech', 'innovation', 'digital tools'],
    commonProjects: ['app prototype', 'tech demo', 'hardware project', 'digital tool build', 'AI experiment', 'tech showcase']
  },

  // --- Marketing & Business (Bready Beige: #f2d28a) ---
  {
    id: 'cat-art-direction',
    name: 'Art Direction',
    parentCategory: 'Marketing & Business',
    colorName: 'Bready Beige',
    colorHex: '#f2d28a',
    synonyms: ['creative lead', 'visual direction', 'art director'],
    commonProjects: ['campaign mood board', 'brand visual system', 'photo shoot direction', 'album art direction', 'ad concept', 'style guide']
  },
  {
    id: 'cat-branding',
    name: 'Branding',
    parentCategory: 'Marketing & Business',
    colorName: 'Bready Beige',
    colorHex: '#f2d28a',
    synonyms: ['brand identity', 'logo design', 'brand strategy'],
    commonProjects: ['logo design', 'brand guidelines', 'business card suite', 'brand voice deck', 'rebrand concept', 'packaging identity']
  },
  {
    id: 'cat-business',
    name: 'Business',
    parentCategory: 'Marketing & Business',
    colorName: 'Bready Beige',
    colorHex: '#f2d28a',
    synonyms: ['entrepreneurship', 'startup', 'commerce'],
    commonProjects: ['business plan', 'startup launch', 'small business brand', 'pitch deck', 'product line launch', 'service business concept']
  },
  {
    id: 'cat-copywriting',
    name: 'Copywriting',
    parentCategory: 'Marketing & Business',
    colorName: 'Bready Beige',
    colorHex: '#f2d28a',
    synonyms: ['ad copy', 'content writing', 'marketing copy'],
    commonProjects: ['tagline set', 'product description', 'email campaign', 'landing page copy', 'ad script', 'brand tone-of-voice piece']
  },
  {
    id: 'cat-creative-direction',
    name: 'Creative Direction',
    parentCategory: 'Marketing & Business',
    colorName: 'Bready Beige',
    colorHex: '#f2d28a',
    synonyms: ['creative lead', 'brand vision', 'creative strategy'],
    commonProjects: ['campaign concept', 'brand vision deck', 'creative pitch', 'visual identity roadmap', 'product launch concept', 'content series direction']
  },
  {
    id: 'cat-entrepreneurship',
    name: 'Entrepreneurship',
    parentCategory: 'Marketing & Business',
    colorName: 'Bready Beige',
    colorHex: '#f2d28a',
    synonyms: ['startup', 'business building', 'founder'],
    commonProjects: ['startup launch', 'side business', 'product pitch', 'business plan', 'brand launch', 'crowdfunding campaign']
  },
  {
    id: 'cat-marketing',
    name: 'Marketing',
    parentCategory: 'Marketing & Business',
    colorName: 'Bready Beige',
    colorHex: '#f2d28a',
    synonyms: ['promotion', 'advertising', 'brand marketing'],
    commonProjects: ['ad campaign', 'social media campaign', 'email marketing series', 'promo video', 'influencer campaign', 'brand launch marketing']
  },
  {
    id: 'cat-packaging',
    name: 'Packaging',
    parentCategory: 'Marketing & Business',
    colorName: 'Bready Beige',
    colorHex: '#f2d28a',
    synonyms: ['package design', 'product packaging'],
    commonProjects: ['product box design', 'label design', 'packaging mockup', 'sustainable packaging concept', 'gift box', 'retail packaging line']
  },
  {
    id: 'cat-side-hustle',
    name: 'Side Hustle',
    parentCategory: 'Marketing & Business',
    colorName: 'Bready Beige',
    colorHex: '#f2d28a',
    synonyms: ['freelance work', 'side project', 'side business'],
    commonProjects: ['freelance client project', 'Etsy shop', 'side brand launch', 'weekend business', 'print-on-demand line', 'consulting gig']
  },
  {
    id: 'cat-social-media',
    name: 'Social Media',
    parentCategory: 'Marketing & Business',
    colorName: 'Bready Beige',
    colorHex: '#f2d28a',
    synonyms: ['content creation', 'social posts', 'digital marketing'],
    commonProjects: ['Instagram content series', 'TikTok video', 'content calendar', 'brand social campaign', 'reel series', 'influencer post set']
  },

  // --- Design & Digital Media (Jammy Blue: #82c9ff) ---
  {
    id: 'cat-3d-art',
    name: '3D Art',
    parentCategory: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    synonyms: ['3D rendering', 'CGI art', 'digital sculpture', '3D visuals'],
    commonProjects: ['character render', 'product visualization', '3D environment', 'abstract 3D piece', 'NFT art', '3D portrait']
  },
  {
    id: 'cat-app-design',
    name: 'App Design',
    parentCategory: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    synonyms: ['mobile app design', 'app UI design', 'application design'],
    commonProjects: ['mobile app mockup', 'onboarding flow', 'app icon set', 'dashboard UI', 'wireframe kit', 'design system']
  },
  {
    id: 'cat-concept-art',
    name: 'Concept Art',
    parentCategory: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    synonyms: ['visual development', 'concept design', 'idea sketches'],
    commonProjects: ['character concept', 'environment concept', 'creature design', 'vehicle concept', 'game concept sheet', 'film concept art']
  },
  {
    id: 'cat-design',
    name: 'Design',
    parentCategory: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    synonyms: ['visual design', 'layout', 'aesthetics'],
    commonProjects: ['brand refresh', 'layout design', 'visual identity', 'design system', 'product mockup', 'style exploration']
  },
  {
    id: 'cat-digital-art',
    name: 'Digital Art',
    parentCategory: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    synonyms: ['digital painting', 'digital illustration', 'computer art'],
    commonProjects: ['digital portrait', 'fantasy scene', 'character illustration', 'digital landscape', 'poster art', 'concept piece']
  },
  {
    id: 'cat-graphic-design',
    name: 'Graphic Design',
    parentCategory: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    synonyms: ['visual design', 'layout design', 'print design'],
    commonProjects: ['poster design', 'brand collateral', 'social media graphic', 'flyer', 'book cover', 'packaging layout']
  },
  {
    id: 'cat-illustration',
    name: 'Illustration',
    parentCategory: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    synonyms: ['drawing', 'digital illustration', 'book illustration'],
    commonProjects: ["book illustration", "editorial illustration", "character art", "greeting card art", "poster illustration", "children's book art"]
  },
  {
    id: 'cat-retouching',
    name: 'Retouching',
    parentCategory: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    synonyms: ['photo editing', 'image retouching', 'post processing'],
    commonProjects: ['portrait retouch', 'product photo cleanup', 'beauty retouch', 'composite edit', 'color grade', 'restoration retouch']
  },
  {
    id: 'cat-typography',
    name: 'Typography',
    parentCategory: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    synonyms: ['font design', 'lettering', 'type design'],
    commonProjects: ['custom typeface', 'lettering poster', 'type specimen', 'logotype', 'editorial type treatment', 'font pairing study']
  },
  {
    id: 'cat-ui-ux',
    name: 'UI/UX',
    parentCategory: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    synonyms: ['user interface design', 'user experience design', 'product design'],
    commonProjects: ['app wireframe', 'website UX flow', 'design system', 'usability test', 'prototype interaction', 'dashboard interface']
  },
  {
    id: 'cat-web-design',
    name: 'Web Design',
    parentCategory: 'Design & Digital Media',
    colorName: 'Jammy Blue',
    colorHex: '#82c9ff',
    synonyms: ['website design', 'site layout', 'web UI'],
    commonProjects: ['website mockup', 'landing page', 'portfolio site', 'e-commerce layout', 'responsive redesign', 'web style guide']
  },

  // --- Film & Media (Tomato Pink: #ff9a84) ---
  {
    id: 'cat-animation',
    name: 'Animation',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['motion design', '2D animation', 'cartooning', 'animator'],
    commonProjects: ['animated short', 'explainer video', 'character walk cycle', 'animated logo', 'GIF series', 'title sequence']
  },
  {
    id: 'cat-cinematography',
    name: 'Cinematography',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['camera work', 'director of photography', 'film photography'],
    commonProjects: ['short film shoot', 'music video', 'lighting test reel', 'documentary footage', 'commercial spot', 'lookbook film']
  },
  {
    id: 'cat-costume-design',
    name: 'Costume Design',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['wardrobe design', 'costume making', 'costuming'],
    commonProjects: ['stage costume', 'cosplay build', 'film wardrobe', 'fashion show look', 'character sketch', 'historical reproduction']
  },
  {
    id: 'cat-directing',
    name: 'Directing',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['film directing', 'director', 'directorial work'],
    commonProjects: ['short film', 'music video', 'commercial', 'theater production', 'web series', 'documentary']
  },
  {
    id: 'cat-editing',
    name: 'Editing',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['video editing', 'photo editing', 'post-production'],
    commonProjects: ['short film edit', 'YouTube video cut', 'wedding video', 'trailer edit', 'podcast episode edit', 'social media reel']
  },
  {
    id: 'cat-editorial',
    name: 'Editorial',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['magazine layout', 'editorial design', 'publication design'],
    commonProjects: ['magazine spread', 'zine layout', 'newsletter design', 'article illustration', 'book layout', 'editorial photo essay']
  },
  {
    id: 'cat-film',
    name: 'Film',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['filmmaking', 'movies', 'cinema'],
    commonProjects: ['short film', 'feature script', 'documentary', 'film trailer', 'indie production', 'film festival submission']
  },
  {
    id: 'cat-motion-graphics',
    name: 'Motion Graphics',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['animated graphics', 'kinetic typography', 'motion design'],
    commonProjects: ['title sequence', 'animated infographic', 'logo animation', 'lower thirds', 'explainer animation', 'social media motion piece']
  },
  {
    id: 'cat-photojournalism',
    name: 'Photojournalism',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['documentary photography', 'news photography'],
    commonProjects: ['photo essay', 'news assignment', 'documentary series', 'street photography project', 'event coverage', 'human interest story']
  },
  {
    id: 'cat-podcasting',
    name: 'Podcasting',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['audio show', 'podcast production'],
    commonProjects: ['podcast episode series', 'interview show', 'narrative podcast', 'podcast branding', 'audio storytelling series', 'launch episode']
  },
  {
    id: 'cat-set-design',
    name: 'Set Design',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['stage design', 'production design', 'scenic design'],
    commonProjects: ['theater set', 'film set build', 'photo shoot set', 'event stage design', 'TV studio set', 'exhibition backdrop']
  },
  {
    id: 'cat-sound-design',
    name: 'Sound Design',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['audio design', 'sound engineering', 'foley'],
    commonProjects: ['film soundscape', 'game sound effects', 'podcast audio design', 'foley recording', 'ambient soundtrack', 'UI sound kit']
  },
  {
    id: 'cat-storyboarding',
    name: 'Storyboarding',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['visual scripting', 'shot planning', 'storyboard art'],
    commonProjects: ['film storyboard', 'commercial storyboard', 'animation storyboard', 'game cinematic boards', 'music video boards', 'pitch storyboard']
  },
  {
    id: 'cat-video',
    name: 'Video',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['videography', 'film', 'video content'],
    commonProjects: ['short video', 'promo video', 'event video', 'YouTube content', 'video essay', 'brand video']
  },
  {
    id: 'cat-vlog',
    name: 'Vlog',
    parentCategory: 'Film & Media',
    colorName: 'Tomato Pink',
    colorHex: '#ff9a84',
    synonyms: ['video blog', 'video diary', 'vlogging'],
    commonProjects: ['daily vlog', 'travel vlog', 'lifestyle vlog series', 'behind-the-scenes vlog', 'vlog channel launch', 'weekly video diary']
  },

  // --- Ideas & Storytelling (Figgish Indigo: #A99BFF) ---
  {
    id: 'cat-big-idea',
    name: 'Big Idea',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['concept', 'innovation', 'breakthrough idea'],
    commonProjects: ['startup concept', 'invention pitch', 'campaign big idea', 'product innovation', 'creative concept deck', 'hackathon idea']
  },
  {
    id: 'cat-challenges',
    name: 'Challenges',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['competitions', 'contests', 'prompts'],
    commonProjects: ['design challenge entry', 'hackathon project', 'art prompt piece', '30-day challenge', 'contest submission', 'skill challenge']
  },
  {
    id: 'cat-collaboration',
    name: 'Collaboration',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['teamwork', 'partnership', 'co-creation'],
    commonProjects: ['joint art project', 'band collaboration', 'brand partnership', 'co-authored piece', 'cross-discipline project', 'community mural']
  },
  {
    id: 'cat-community',
    name: 'Community',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['group', 'network', 'collective'],
    commonProjects: ['local event project', 'community mural', 'group art show', 'meetup initiative', 'volunteer campaign', 'neighborhood project']
  },
  {
    id: 'cat-education',
    name: 'Education',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['teaching', 'tutoring', 'learning content'],
    commonProjects: ['online course', 'lesson plan', 'tutorial video', 'workshop curriculum', 'educational worksheet', 'study guide']
  },
  {
    id: 'cat-exhibition-design',
    name: 'Exhibition Design',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['gallery design', 'museum design', 'installation design'],
    commonProjects: ['gallery layout', 'museum exhibit', 'pop-up installation', 'trade show booth', 'art show display', 'interactive exhibit']
  },
  {
    id: 'cat-experimental',
    name: 'Experimental',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['avant-garde', 'exploratory', 'unconventional work'],
    commonProjects: ['mixed media experiment', 'generative art piece', 'abstract series', 'prototype concept', 'sound experiment', 'unconventional material study']
  },
  {
    id: 'cat-learning',
    name: 'Learning',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['education', 'skill building', 'self-study'],
    commonProjects: ['online course project', 'tutorial series', 'study notes', 'skill practice log', 'workshop project', 'self-taught portfolio piece']
  },
  {
    id: 'cat-personal-growth',
    name: 'Personal Growth',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['self-improvement', 'self-development'],
    commonProjects: ['journaling project', 'skill-building challenge', 'habit tracker', 'personal development plan', 'reflection series', 'growth vlog']
  },
  {
    id: 'cat-research-ideas',
    name: 'Research & Ideas',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['brainstorming', 'exploration', 'concepting'],
    commonProjects: ['concept research deck', 'mood board exploration', 'market research project', 'ideation session', 'trend report', 'prototype concepting']
  },
  {
    id: 'cat-stories',
    name: 'Stories',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['narratives', 'storytelling', 'tales'],
    commonProjects: ['short story collection', 'personal essay', 'illustrated story', 'oral history project', 'serialized fiction', 'memoir piece']
  },
  {
    id: 'cat-storytelling',
    name: 'Storytelling',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['narrative craft', 'story crafting', 'narration'],
    commonProjects: ['narrative video', 'brand story', 'interactive story project', 'storytelling workshop piece', 'documentary narrative', 'campfire story series']
  },
  {
    id: 'cat-writing',
    name: 'Writing',
    parentCategory: 'Ideas & Storytelling',
    colorName: 'Figgish Indigo',
    colorHex: '#A99BFF',
    synonyms: ['authoring', 'prose', 'content creation'],
    commonProjects: ['short story', 'novel draft', 'blog post', 'screenplay', 'essay collection', 'poetry chapbook']
  }
];

/**
 * Fast map for category lookups by name (case-insensitive)
 */
const CATEGORY_MAP = new Map<string, CategoryItem>(
  CATEGORIES_DATA.map(cat => [cat.name.toLowerCase(), cat])
);

/**
 * Get category item by name
 */
export function getCategoryByName(name?: string): CategoryItem | undefined {
  if (!name) return undefined;
  return CATEGORY_MAP.get(name.toLowerCase().trim());
}

/**
 * Get hex color for a category. Defaults to fallback if category is unknown.
 */
export function getCategoryColor(categoryName?: string, defaultColor: string = '#fff6e4'): string {
  if (!categoryName || categoryName.toLowerCase().trim() === 'general') {
    return '#fff6e4';
  }
  const cat = getCategoryByName(categoryName);
  return cat ? cat.colorHex : defaultColor;
}

/**
 * Get parent category group metadata by category name
 */
export function getCategoryGroup(categoryName?: string): ParentCategoryGroup | undefined {
  const cat = getCategoryByName(categoryName);
  if (!cat) return undefined;
  return PARENT_CATEGORY_GROUPS.find(g => g.name === cat.parentCategory);
}

/**
 * Perform category autocomplete search with synonym, parent group, and common project matching.
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
    const parentLower = cat.parentCategory.toLowerCase();

    // 1. Direct name match
    if (nameLower === normalizedQuery) {
      results.push({ category: cat, matchedBy: 'name', score: 100 });
      continue;
    }

    if (nameLower.startsWith(normalizedQuery)) {
      results.push({ category: cat, matchedBy: 'name', score: 85 });
      continue;
    }

    if (nameLower.includes(normalizedQuery)) {
      results.push({ category: cat, matchedBy: 'name', score: 65 });
      continue;
    }

    // 2. Parent Category Group match
    if (parentLower === normalizedQuery || parentLower.includes(normalizedQuery)) {
      results.push({ category: cat, matchedBy: 'parentCategory', matchedTerm: cat.parentCategory, score: 75 });
      continue;
    }

    // 3. Synonym match
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
      continue;
    }

    // 4. Common Project match
    if (cat.commonProjects) {
      let projectMatch: string | undefined;
      for (const proj of cat.commonProjects) {
        if (proj.toLowerCase().includes(normalizedQuery)) {
          projectMatch = proj;
          break;
        }
      }
      if (projectMatch) {
        results.push({
          category: cat,
          matchedBy: 'commonProject',
          matchedTerm: projectMatch,
          score: 45
        });
      }
    }
  }

  // Sort results by score descending, then alphabetically by category name
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.category.name.localeCompare(b.category.name);
  });
}
