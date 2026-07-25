import { Recipe, Creator, FeedPost, Collection, Project } from '../types';

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'recipe-sandwich',
    title: 'Make a Sandwich',
    description: 'The definitive universal recipe for absolute culinary and project-planning mastery. Establishes the core mechanic of parts making a whole.',
    authorId: 'system',
    authorName: 'Gonnng System',
    category: 'Educational',
    tags: ['Onboarding', 'Culinary', 'Introductory'],
    phases: [
      {
        title: 'Gather Ingredients',
        tasks: [
          { title: 'Source artisan bread (Sourdough or Brioche)', estimatedHours: 0.5 },
          { title: 'Crisp the bacon or plant-based equivalent', estimatedHours: 0.4 },
          { title: 'Wash crisp garden lettuce', estimatedHours: 0.2 },
          { title: 'Slice heirloom red tomatoes', estimatedHours: 0.2 },
          { title: 'Locate garlic herb mayonnaise', estimatedHours: 0.1 }
        ]
      },
      {
        title: 'Assemble & Toast',
        tasks: [
          { title: 'Lightly toast bread slices to golden brown', estimatedHours: 0.3 },
          { title: 'Spread generous layer of mayo on both sides', estimatedHours: 0.2 },
          { title: 'Layer in order: Lettuce, Tomato, Bacon, Lettuce', estimatedHours: 0.3 },
          { title: 'Slice diagonally with a serrated knife', estimatedHours: 0.1 }
        ]
      },
      {
        title: 'Consume & Reflect',
        tasks: [
          { title: 'Take the crucial first bite (Assess crunch/acid)', estimatedHours: 0.1 },
          { title: 'Reach the halfway point (Ponder creation mechanics)', estimatedHours: 0.1 },
          { title: 'Finish the sandwich (Acknowledge task complete!)', estimatedHours: 0.1 }
        ]
      }
    ],
    gongsCount: { continue: 124, refine: 4, reconsider: 1 }
  },
  {
    id: 'recipe-superhero',
    title: 'Become a Superhero',
    description: 'Learn to defend your neighborhood while maintaining complete creative integrity. Blurs the line between high-gravity discipline and absolute play.',
    authorId: 'creator-bruce',
    authorName: 'Bruce W.',
    category: 'Humorous',
    tags: ['Heroism', 'Creative', 'Lifestyle'],
    phases: [
      {
        title: 'Origin Story & Identity',
        tasks: [
          { title: 'Identify tragic backstory or dramatic mystery', estimatedHours: 2 },
          { title: 'Choose a thematic, fear-inducing animal guide', estimatedHours: 4 },
          { title: 'Draft your intimidating vigilante moniker', estimatedHours: 1.5 }
        ]
      },
      {
        title: 'Prep & Tech Arsenal',
        tasks: [
          { title: 'Design heavy Kevlar-weave costume (dark tones)', estimatedHours: 12 },
          { title: 'Find deep subterranean lair with high ceiling', estimatedHours: 24 },
          { title: 'Forge custom grappling hook or throwing asset', estimatedHours: 8 }
        ]
      },
      {
        title: 'Vigilante Execution',
        tasks: [
          { title: 'Practice delivering your signature catchphrase', estimatedHours: 3 },
          { title: 'Formulate an ideological rivalry with an arch-nemesis', estimatedHours: 5 },
          { title: 'Succeed in first dramatic rooftop escape', estimatedHours: 6 }
        ]
      }
    ],
    gongsCount: { continue: 890, refine: 42, reconsider: 8 }
  },
  {
    id: 'recipe-paint',
    title: 'Paint an Oil Canvas',
    description: 'From an empty white surface to a finished, varnished, exhibition-ready masterpiece. Perfect for mastering layer drying times.',
    authorId: 'creator-clara',
    authorName: 'Clara Monet',
    category: 'Creative',
    tags: ['Art', 'Studio', 'Technique'],
    phases: [
      {
        title: 'Conception & Setup',
        tasks: [
          { title: 'Sketch three small charcoal thumbnails', estimatedHours: 1 },
          { title: 'Apply gesso primer to raw linen canvas', estimatedHours: 3 },
          { title: 'Mix a harmonized oil color palette', estimatedHours: 1.5 }
        ]
      },
      {
        title: 'Underpainting Wash',
        tasks: [
          { title: 'Block in core dark shadows using burnt umber', estimatedHours: 2 },
          { title: 'Establish central light source and temperature', estimatedHours: 1 },
          { title: 'Wipe away highlights with a solvent cloth', estimatedHours: 1.5 }
        ]
      },
      {
        title: 'Glazing & Refining',
        tasks: [
          { title: 'Layer impasto texture on primary focal areas', estimatedHours: 6 },
          { title: 'Blend edges for atmospheric distance depth', estimatedHours: 4 },
          { title: 'Let dry, sign, and apply protective damar varnish', estimatedHours: 12 }
        ]
      }
    ],
    gongsCount: { continue: 215, refine: 18, reconsider: 2 }
  },
  {
    id: 'recipe-portfolio',
    title: 'Launch a Creative Portfolio',
    description: 'Construct and deploy a cohesive, high-impact digital gallery of your finest creative works, optimized for visual rhythm and performance.',
    authorId: 'creator-ramson',
    authorName: 'Gordan Ramson',
    category: 'Strategy',
    tags: ['Design', 'Launch', 'Portfolio'],
    phases: [
      {
        title: 'Conception & Asset Gathering',
        tasks: [
          { title: 'Select 5 best creative works to highlight', estimatedHours: 1 },
          { title: 'Draft concise and punchy bio sections', estimatedHours: 1.5 },
          { title: 'Gather high-resolution screenshot/image files', estimatedHours: 0.5 }
        ]
      },
      {
        title: 'Layout & Production',
        tasks: [
          { title: 'Code responsive single-page visual grid', estimatedHours: 2 },
          { title: 'Integrate dark/light modern typography layouts', estimatedHours: 2.5 },
          { title: 'Connect contact forms and social profiles', estimatedHours: 1 }
        ]
      },
      {
        title: 'Deployment & Optimization',
        tasks: [
          { title: 'Audit accessibility contrast and performance', estimatedHours: 1.5 },
          { title: 'Deploy to static CDN host of choice', estimatedHours: 0.5 },
          { title: 'Share link to community network for review', estimatedHours: 0.5 }
        ]
      }
    ],
    gongsCount: { continue: 154, refine: 8, reconsider: 0 }
  }
];

export const INITIAL_CREATORS: Creator[] = [
  {
    id: 'creator-bruce',
    name: 'Bruce Wayne',
    email: 'bwayne@wayneenterprises.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    bio: 'Just a guy trying to finish what I start in Gotham. Strongly favor parallel execution and dark color palettes.',
    goals: 'Establish a completely reliable process for urban safety and creative gadget design.',
    privacyDefault: 'internal',
    followersCount: 1420,
    followingCount: 12,
    isFollowing: true,
    followsYou: true,
    isInCircle: true
  },
  {
    id: 'creator-clara',
    name: 'Clara Monet',
    email: 'clara.m@impressionism.studio',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    bio: 'Oil painter exploring light, atmosphere, and sequential project tracking. Every stroke is part of the final whole.',
    goals: 'Paint 3 major canvases for the upcoming French autumn gallery showcase.',
    privacyDefault: 'public',
    followersCount: 840,
    followingCount: 310,
    isFollowing: false,
    followsYou: true,
    isInCircle: false
  },
  {
    id: 'creator-ramson',
    name: 'Gordan Ramson',
    email: 'gordan@ramsonkitchens.com',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120',
    bio: 'No slop allowed. Focus on high-precision layout design, pristine aesthetic safety, and perfect sandwich blueprint assembly.',
    goals: 'Train creators to treat digital blueprints and visual portfolios as high-accountability projects.',
    privacyDefault: 'public',
    followersCount: 3910,
    followingCount: 45,
    isFollowing: true,
    followsYou: true,
    isInCircle: true
  },
  {
    id: 'creator-ada',
    name: 'Ada Lovelace',
    email: 'ada@analytical.net',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    bio: 'Mathematician modeling complex analytical loops. Obsessed with translating musical patterns into mechanical blueprints.',
    goals: 'Complete the simulator logic for the mechanical computing engines.',
    privacyDefault: 'public',
    followersCount: 2890,
    followingCount: 88,
    isFollowing: true,
    followsYou: false,
    isInCircle: false
  },
  {
    id: 'creator-hokusai',
    name: 'Katsushika Hokusai',
    email: 'hokusai@floatingworld.org',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    bio: 'Printmaker, painter, and sketcher. Exploring wave dynamics and the geometry of Mount Fuji. Deeply values sequence timing.',
    goals: 'Carve and print all thirty-six views of the mountain using custom pigment layers.',
    privacyDefault: 'public',
    followersCount: 5210,
    followingCount: 23,
    isFollowing: false,
    followsYou: false,
    isInCircle: false
  },
  {
    id: 'creator-will',
    name: 'William Shakespeare',
    email: 'bard@globe.org',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
    bio: 'Playwright and poet. Structuring five-act tragedies and balancing blank verse sequences. Accountability under tight production budgets.',
    goals: 'Deliver final rehearsed drafts of Hamlet to the company of actors.',
    privacyDefault: 'public',
    followersCount: 4120,
    followingCount: 15,
    isFollowing: false,
    followsYou: false,
    isInCircle: false
  }
];

export const INITIAL_FEED_POSTS: FeedPost[] = [
  // VIRAL POST 1: Massive engagement (2.37M Gongs) & deep comment threads
  {
    id: 'post-viral-1',
    type: 'project_completed',
    userId: 'creator-hokusai',
    userName: 'Katsushika Hokusai',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    timeString: '2 hours ago',
    title: '🌊 The Great Wave Off Kanagawa (Final Woodblock Edition)',
    content: 'After 18 months of delicate cherry-wood carving and Prussian blue pigment blending, edition #1 is complete! The dynamic momentum of the sea crest juxtaposed against the serene, immovable presence of Mount Fuji captures the eternal balance of nature. Printed on handmade Mulberry paper with multi-layer block alignment.',
    attachedName: 'Thirty-Six Views of Fuji',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 2371019, refine: 14200, reconsider: 1246 },
    comments: [
      {
        id: 'c-v1-1',
        userId: 'creator-clara',
        userName: 'Clara Monet',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        content: 'Absolute masterpiece! The contrast between the furious foam spray and Mount Fuji in the background is transcendent.',
        timeString: '1 hour ago',
        likes: 1420,
        userLiked: true
      },
      {
        id: 'c-v1-2',
        userId: 'creator-ada',
        userName: 'Ada Lovelace',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        content: 'The mathematical fractal geometry of the wave claw tips is astounding. Nature executing algorithms perfectly!',
        timeString: '1 hour ago',
        likes: 890,
        userLiked: false,
        parentId: 'c-v1-1',
        replyToUser: 'Clara Monet'
      },
      {
        id: 'c-v1-3',
        userId: 'creator-will',
        userName: 'William Shakespeare',
        userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
        content: 'A storm to rival King Lear on the heath! Worthy of immortal drama.',
        timeString: '50 mins ago',
        likes: 412,
        userLiked: false,
        parentId: 'c-v1-1',
        replyToUser: 'Ada Lovelace'
      },
      {
        id: 'c-v1-4',
        userId: 'creator-bruce',
        userName: 'Bruce Wayne',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        content: 'Mastery of pressure and technique under extreme conditions.',
        timeString: '45 mins ago',
        likes: 310,
        userLiked: true,
        parentId: 'c-v1-1',
        replyToUser: 'William Shakespeare'
      },
      {
        id: 'c-v1-5',
        userId: 'creator-leo',
        userName: 'Leonardo da Vinci',
        userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120',
        content: 'Fluid dynamics rendered with extreme graphic clarity. The vortex motion is scientifically spot on.',
        timeString: '30 mins ago',
        likes: 240,
        userLiked: false,
        parentId: 'c-v1-1',
        replyToUser: 'Bruce Wayne'
      },
      {
        id: 'c-v1-6',
        userId: 'creator-ramson',
        userName: 'Gordan Ramson',
        userAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120',
        content: 'No rough edges, zero paper bleed, clean block registration. Pure execution standard!',
        timeString: '20 mins ago',
        likes: 180,
        userLiked: true,
        parentId: 'c-v1-1',
        replyToUser: 'Leonardo da Vinci'
      },
      {
        id: 'c-v1-7',
        userId: 'creator-hokusai',
        userName: 'Katsushika Hokusai',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
        content: 'Thank you all! The Prussian blue dye imported through Yokohama harbor was the secret ingredient.',
        timeString: '10 mins ago',
        likes: 520,
        userLiked: true,
        parentId: 'c-v1-1',
        replyToUser: 'Gordan Ramson'
      }
    ]
  },

  // VIRAL POST 2: Ada Lovelace's Computing Breakthrough (1.42M Gongs)
  {
    id: 'post-viral-2',
    type: 'project_completed',
    userId: 'creator-ada',
    userName: 'Ada Lovelace',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    timeString: '5 hours ago',
    title: '💻 Analytical Engine: Universal Bernoulli Algorithm Published',
    content: 'We have done it! Designed the world\'s first complex algorithmic sequence program tailored specifically for Charles Babbage\'s mechanical general-purpose computer. The engine calculates Bernoulli numbers using conditional loops, variable memory storage units, and interleaved punched card streams. Computing is no longer merely arithmetic—it is language and poetry combined!',
    attachedName: 'Analytical Engine Simulator',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 1420500, refine: 28400, reconsider: 3200 },
    comments: [
      {
        id: 'c-v2-1',
        userId: 'user-current',
        userName: 'Creative Architect',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        content: 'The forefather of modern software architecture! The loop control flow diagrams in Note G are visionary.',
        timeString: '4 hours ago',
        likes: 950,
        userLiked: true
      },
      {
        id: 'c-v2-2',
        userId: 'creator-satoshi',
        userName: 'Satoshi Nakamoto',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        content: 'Pure cryptographic logic. Mechanical state machines proving truth without trusted intermediaries.',
        timeString: '3 hours ago',
        likes: 620,
        userLiked: false,
        parentId: 'c-v2-1',
        replyToUser: 'Creative Architect'
      },
      {
        id: 'c-v2-3',
        userId: 'creator-kenji',
        userName: 'Kenji Sato',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        content: 'Are you planning to release the punched card punch-grid layout specs open source?',
        timeString: '2 hours ago',
        likes: 310,
        userLiked: false,
        parentId: 'c-v2-1',
        replyToUser: 'Satoshi Nakamoto'
      },
      {
        id: 'c-v2-4',
        userId: 'creator-ada',
        userName: 'Ada Lovelace',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        content: 'Yes! All diagrams are bound and open for community verification in our public repo.',
        timeString: '1 hour ago',
        likes: 480,
        userLiked: true,
        parentId: 'c-v2-1',
        replyToUser: 'Kenji Sato'
      },
      {
        id: 'c-v2-5',
        userId: 'creator-chloe',
        userName: 'Chloe Bennett',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
        content: 'This will pave the way for modern silicon chips 100 years from now. Historic milestone!',
        timeString: '45 mins ago',
        likes: 215,
        userLiked: true,
        parentId: 'c-v2-1',
        replyToUser: 'Ada Lovelace'
      }
    ]
  },

  // VIRAL POST 3: Leonardo da Vinci's Mona Lisa Sfumato (890K Gongs)
  {
    id: 'post-viral-3',
    type: 'progress_shot',
    userId: 'creator-leo',
    userName: 'Leonardo da Vinci',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120',
    timeString: '8 hours ago',
    title: '🎨 Mona Lisa Sfumato Glazing Sequence Complete',
    content: 'Applied over 40 microscopic translucent glaze coats to achieve the subtle transition around the corners of the mouth and eyes. By removing harsh outlines and relying strictly on light absorption values, the expression shifts dynamically depending on where the light hits the poplar panel.',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 890400, refine: 9300, reconsider: 420 },
    comments: [
      {
        id: 'c-v3-1',
        userId: 'creator-clara',
        userName: 'Clara Monet',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        content: '40 glazes! The patience required for each layer to dry completely without dust particles is unbelievable.',
        timeString: '7 hours ago',
        likes: 540,
        userLiked: true
      },
      {
        id: 'c-v3-2',
        userId: 'creator-leo',
        userName: 'Leonardo da Vinci',
        userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120',
        content: 'Art is never finished, only abandoned! Each glaze dries in approximately 3 days in warm Tuscan sunlight.',
        timeString: '6 hours ago',
        likes: 380,
        userLiked: true,
        parentId: 'c-v3-1',
        replyToUser: 'Clara Monet'
      },
      {
        id: 'c-v3-3',
        userId: 'creator-elena',
        userName: 'Elena Rostova',
        userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
        content: 'The atmospheric sfumato background landscape creates infinite depth.',
        timeString: '5 hours ago',
        likes: 190,
        userLiked: false,
        parentId: 'c-v3-1',
        replyToUser: 'Leonardo da Vinci'
      }
    ]
  },

  // CURRENT USER POST 1 (Public, Portfolio Framework)
  {
    id: 'post-user-1',
    type: 'project_created',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '12 hours ago',
    title: 'My Custom Portfolio Framework Initiated',
    content: 'Breaking down my creative portfolio into three logical phases: Curation, Case Study Drafting, and Interactive UI Deployment. Focusing on absolute minimalist typography, tight margin rhythms, and clean dark canvas aesthetics.',
    attachedName: 'Creative Portfolio Framework',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 1246, refine: 42, reconsider: 3 },
    comments: [
      {
        id: 'c-u1-1',
        userId: 'creator-ada',
        userName: 'Ada Lovelace',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        content: 'The 3-phase structural breakdown is crisp. What font pairing are you considering for display headers?',
        timeString: '10 hours ago',
        likes: 18,
        userLiked: true
      },
      {
        id: 'c-u1-2',
        userId: 'creator-clara',
        userName: 'Clara Monet',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        content: 'Loving the clean minimalism! Make sure to keep generous negative space on mobile viewports.',
        timeString: '8 hours ago',
        likes: 12,
        userLiked: false,
        parentId: 'c-u1-1',
        replyToUser: 'Ada Lovelace'
      },
      {
        id: 'c-u1-3',
        userId: 'user-current',
        userName: 'Creative Architect',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        content: 'Thanks Clara! Playfair Display for headings paired with Plus Jakarta Sans for body text.',
        timeString: '6 hours ago',
        likes: 24,
        userLiked: true,
        parentId: 'c-u1-1',
        replyToUser: 'Clara Monet'
      },
      {
        id: 'c-u1-4',
        userId: 'creator-bruce',
        userName: 'Bruce Wayne',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        content: 'Strong choices. Dark UI with high-contrast typography reduces eye fatigue.',
        timeString: '5 hours ago',
        likes: 9,
        userLiked: false,
        parentId: 'c-u1-1',
        replyToUser: 'Creative Architect'
      }
    ]
  },

  // CURRENT USER POST 2 (Public, Curation Task)
  {
    id: 'post-user-2',
    type: 'task_completed',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '14 hours ago',
    title: '✓ Select 5 best creative works to highlight',
    content: 'Curated my absolute strongest architectural studies and UI layouts. Ready to draft the explanatory case studies with problem-solving breakdowns!',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 840, refine: 12, reconsider: 0 },
    comments: [
      {
        id: 'c-u2-1',
        userId: 'creator-ramson',
        userName: 'Gordan Ramson',
        userAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120',
        content: 'Curating down to 5 shows restraint. Quality over quantity every single time!',
        timeString: '12 hours ago',
        likes: 34,
        userLiked: true
      }
    ]
  },

  // CURRENT USER POST 3 (Circle/Internal, Timber Roof)
  {
    id: 'post-user-3',
    type: 'progress_shot',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '18 hours ago',
    title: 'Parametric Timber Pavilion Roof Truss Assembly',
    content: 'Testing the interlocking glued-laminated timber joints under simulated wind pressure loads. The double-curved geometric shell distributes structural weight smoothly across four corner anchor points.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    privacy: 'internal',
    gongs: { continue: 2370, refine: 85, reconsider: 4 },
    comments: [
      {
        id: 'c-u3-1',
        userId: 'creator-maya',
        userName: 'Maya Lin',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        content: 'The organic sweeping canopy curve echoes landscape topography beautifully.',
        timeString: '16 hours ago',
        likes: 88,
        userLiked: true
      }
    ]
  },

  // CURRENT USER POST 4 (Public, Concrete Planter)
  {
    id: 'post-user-4',
    type: 'project_created',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '1 day ago',
    title: 'Minimalist Monolithic Concrete Planter Formwork',
    content: 'Constructing custom plywood molds for casting ultra-smooth fiber-reinforced concrete planters. Incorporating concealed drainage channels and integrated felt footing glides.',
    attachedName: 'Architectural Vessel Series',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 3410, refine: 120, reconsider: 8 },
    comments: [
      {
        id: 'c-u4-1',
        userId: 'creator-devon',
        userName: 'Devon Wright',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
        content: 'Are you using mineral oil coat release agent on the interior formwork?',
        timeString: '22 hours ago',
        likes: 15,
        userLiked: false
      },
      {
        id: 'c-u4-2',
        userId: 'user-current',
        userName: 'Creative Architect',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        content: 'Yes! Light coat of vegetable oil misted evenly for seamless demolding.',
        timeString: '20 hours ago',
        likes: 22,
        userLiked: true,
        parentId: 'c-u4-1',
        replyToUser: 'Devon Wright'
      }
    ]
  },

  // CURRENT USER POST 5 (Private/Mine, Acoustic Baffles)
  {
    id: 'post-user-5',
    type: 'update_logged',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '1 day ago',
    title: 'Private Draft: Soundproof Studio Acoustic Baffle Blueprint',
    content: 'Calculated flutter echo reflection points for the studio editing room. Suspended felt baffles angled at 14 degrees absorb mid-high frequency standing waves without dulling ambient warmth.',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    privacy: 'private',
    gongs: { continue: 12, refine: 1, reconsider: 0 }
  },

  // CURRENT USER POST 6 (Public, Generative Grid)
  {
    id: 'post-user-6',
    type: 'task_completed',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '2 days ago',
    title: '✓ Benchmark Responsive Layout Fluidity Across Mobile Viewports',
    content: 'Achieved 60fps smooth container transitions and sub-millisecond layout reflows across iOS, Android, and Desktop viewports.',
    image: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 1580, refine: 34, reconsider: 1 }
  },

  // CURRENT USER POST 7 (Circle/Internal, Kinetic Shade)
  {
    id: 'post-user-7',
    type: 'progress_shot',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '2 days ago',
    title: 'Kinetic Solar Shade Louver Servo Rig',
    content: 'Calibrating the light-sensor array. The louvers open automatically during golden hour to optimize interior natural illumination while blocking harsh direct afternoon glare.',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800',
    privacy: 'internal',
    gongs: { continue: 640, refine: 18, reconsider: 2 }
  },

  // CURRENT USER POST 8 (Private/Mine, Biophilic Skylight)
  {
    id: 'post-user-8',
    type: 'project_created',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '3 days ago',
    title: 'Private Study: Biophilic Oculus Glass Geometric Calculations',
    content: 'Drafting ray-tracing angles for winter solstice sun exposure. Ensuring zero thermal loss while maximizing ambient lumen throughput.',
    attachedName: 'Biophilic Oculus Glass',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    privacy: 'private',
    gongs: { continue: 8, refine: 0, reconsider: 0 }
  },

  // CURRENT USER POST 9 (Public, Atelier Gallery Layout)
  {
    id: 'post-user-9',
    type: 'update_logged',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '3 days ago',
    title: 'Paris Atelier Gallery Spatial Lighting Simulation',
    content: 'Mapped out 3D light distribution for the upcoming autumn design exhibition. Track lights calibrated to 3000K warm tone with high CRI (98+).',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 2190, refine: 45, reconsider: 2 }
  },

  // CURRENT USER POST 10 (Circle/Internal, Aluminum Extrusion)
  {
    id: 'post-user-10',
    type: 'task_completed',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '4 days ago',
    title: '✓ Precision CNC Milling on Anodized Aluminum Extrusions',
    content: 'Milled concealed sliding rail grooves with 0.05mm tolerance. Smooth, friction-free glide motion verified.',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
    privacy: 'internal',
    gongs: { continue: 420, refine: 12, reconsider: 0 }
  },

  // CURRENT USER POST 11 (Public, Carbon Fiber Joint)
  {
    id: 'post-user-11',
    type: 'progress_shot',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '5 days ago',
    title: 'Carbon Fiber Lightweight Chassis Stress Test',
    content: 'Vacuum resin infusion cured in autoclave at 120°C. Structural stiffness-to-weight ratio improved by 38% compared to aerospace T6 aluminum.',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 1850, refine: 32, reconsider: 1 }
  },

  // CURRENT USER POST 12 (Private/Mine, Zero Waste Overcoat)
  {
    id: 'post-user-12',
    type: 'project_created',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '6 days ago',
    title: 'Private Draft: Zero-Waste Tailored Wool Overcoat Pattern',
    content: 'Arranging geometric pattern pieces on 100% virgin boiled wool bolt. Every single offcut is utilized as interior collar interlining or pocket facing.',
    attachedName: 'Sustainable Garment Series',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800',
    privacy: 'private',
    gongs: { continue: 15, refine: 2, reconsider: 0 }
  },

  // CURRENT USER POST 13 (Public, Monolithic Teapot)
  {
    id: 'post-user-13',
    type: 'project_completed',
    userId: 'user-current',
    userName: 'Creative Architect',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '1 week ago',
    title: '🏆 PROJECT COMPLETED: Minimalist Matte Black Clay Teapot',
    content: 'Hand-thrown on the wheel using high-iron black stoneware clay. Spout pouring angle calibrated for crisp, drip-free tea service.',
    attachedName: 'Ceramic Tea Vessel',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 4210, refine: 89, reconsider: 5 }
  },

  // COMMUNITY POSTS (35+ diverse creators)

  // Elena Rostova (3 posts)
  {
    id: 'post-comm-1',
    type: 'project_created',
    userId: 'creator-elena',
    userName: 'Elena Rostova',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    timeString: '14 mins ago',
    title: 'Elena started "Brutalist Urban Photography Monograph"',
    content: 'Documenting raw exposed concrete structures across Eastern Europe. Exploring how daylight shadows play against harsh geometric facades.',
    attachedName: 'Brutalist Monograph',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 312, refine: 8, reconsider: 1 }
  },
  {
    id: 'post-comm-2',
    type: 'progress_shot',
    userId: 'creator-elena',
    userName: 'Elena Rostova',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    timeString: '3 hours ago',
    title: 'Monochrome Shadow Contrast Test on High-Grain Film',
    content: 'Pushed Kodak Tri-X 400 to ISO 1600 for deep rich blacks and tactile grain texture.',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 890, refine: 22, reconsider: 0 }
  },
  {
    id: 'post-comm-3',
    type: 'task_completed',
    userId: 'creator-elena',
    userName: 'Elena Rostova',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    timeString: '1 day ago',
    title: '✓ Curate 40 Final Exhibition Gelatin Silver Prints',
    content: 'Hand-printed in the darkroom using fiber-based selenium-toned paper for maximum shadow depth.',
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&q=80&w=800',
    privacy: 'internal',
    gongs: { continue: 1246, refine: 15, reconsider: 1 }
  },

  // Marcus Vance (3 posts)
  {
    id: 'post-comm-4',
    type: 'project_created',
    userId: 'creator-marcus',
    userName: 'Marcus Vance',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120',
    timeString: '35 mins ago',
    title: 'Marcus started "Synthesizer Euro-Rack Analog Oscillator"',
    content: 'Designing custom discreet transistor circuits for warm analog sawtooth and triangle wave generation.',
    attachedName: 'Euro-Rack Oscillator',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 420, refine: 14, reconsider: 2 }
  },
  {
    id: 'post-comm-5',
    type: 'update_logged',
    userId: 'creator-marcus',
    userName: 'Marcus Vance',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120',
    timeString: '4 hours ago',
    title: 'Low-Pass Ladder Filter Calibration',
    content: '24dB/octave Moog-style transistor ladder filter holding pitch resonance with 0.1Hz drift across 5 octaves!',
    privacy: 'internal',
    gongs: { continue: 980, refine: 31, reconsider: 0 }
  },
  {
    id: 'post-comm-6',
    type: 'task_completed',
    userId: 'creator-marcus',
    userName: 'Marcus Vance',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120',
    timeString: '2 days ago',
    title: '✓ Etch Aluminum Front Panel Control Layout',
    content: 'Anodized black brushed metal panel with laser-etched frequency spectrum markers.',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 1540, refine: 42, reconsider: 1 }
  },

  // Satoshi Nakamoto (2 posts)
  {
    id: 'post-comm-7',
    type: 'update_logged',
    userId: 'creator-satoshi',
    userName: 'Satoshi Nakamoto',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '1 hour ago',
    title: 'Peer-to-Peer Electronic Cash System Genesis Block',
    content: 'The Times 03/Jan/2009 Chancellor on brink of second bailout for banks. Immutable proof of work chain deployed.',
    privacy: 'public',
    gongs: { continue: 158000, refine: 1200, reconsider: 80 }
  },
  {
    id: 'post-comm-8',
    type: 'task_completed',
    userId: 'creator-satoshi',
    userName: 'Satoshi Nakamoto',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    timeString: '3 days ago',
    title: '✓ SHA-256 Double Hashing Difficulty Adjustment Engine',
    content: 'Calibrated target recalculation every 2016 blocks to maintain 10-minute block interval stability.',
    privacy: 'public',
    gongs: { continue: 89400, refine: 450, reconsider: 12 }
  },

  // Clara Monet (3 posts)
  {
    id: 'post-comm-9',
    type: 'progress_shot',
    userId: 'creator-clara',
    userName: 'Clara Monet',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    timeString: '2 hours ago',
    title: 'Impasto Lily Pad Reflection Layering',
    content: 'Wiping away highlights from water reflections. The depth of violet and emerald oil glazes is coming alive.',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 3450, refine: 88, reconsider: 2 }
  },
  {
    id: 'post-comm-10',
    type: 'project_created',
    userId: 'creator-clara',
    userName: 'Clara Monet',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    timeString: '1 day ago',
    title: 'Clara started "Giverny Garden Botanical Series"',
    content: 'Setting up field easel beside the water pond. Capturing morning mist atmospheric light diffusion.',
    attachedName: 'Giverny Water Lilies',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 1890, refine: 45, reconsider: 1 }
  },
  {
    id: 'post-comm-11',
    type: 'task_completed',
    userId: 'creator-clara',
    userName: 'Clara Monet',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    timeString: '4 days ago',
    title: '✓ Mix Cadmium Yellow and Ultramarine Oil Pigments',
    content: 'Harmonized color palette mixed in small glass pots with pure walnut oil medium.',
    privacy: 'internal',
    gongs: { continue: 620, refine: 14, reconsider: 0 }
  },

  // Bruce Wayne (3 posts)
  {
    id: 'post-comm-12',
    type: 'progress_shot',
    userId: 'creator-bruce',
    userName: 'Bruce Wayne',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    timeString: '3 hours ago',
    title: 'Tactical Bat-Suit Ballistic Mesh Stress Testing',
    content: 'Tension testing complete. Added extra flex panels along shoulders to ensure unrestricted movement during rooftop grappling.',
    attachedName: 'Gotham Tactical Defense',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800',
    privacy: 'internal',
    gongs: { continue: 12460, refine: 340, reconsider: 15 }
  },
  {
    id: 'post-comm-13',
    type: 'update_logged',
    userId: 'creator-bruce',
    userName: 'Bruce Wayne',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    timeString: '2 days ago',
    title: 'Batmobile Stealth Turbine Acoustic Dampening Calibrated',
    content: 'Active sound cancellation speakers reduce jet engine whistle from 120dB down to whisper-quiet 24dB in urban street corridors.',
    privacy: 'internal',
    gongs: { continue: 18900, refine: 420, reconsider: 8 }
  },
  {
    id: 'post-comm-14',
    type: 'task_completed',
    userId: 'creator-bruce',
    userName: 'Bruce Wayne',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    timeString: '5 days ago',
    title: '✓ Install Emergency Hydro-Electric Turbine in Batcave',
    content: 'Subterranean waterfall power generation system now online with 100% off-grid autonomy.',
    privacy: 'internal',
    gongs: { continue: 9400, refine: 180, reconsider: 4 }
  },

  // Kenji Sato (2 posts)
  {
    id: 'post-comm-15',
    type: 'project_created',
    userId: 'creator-kenji',
    userName: 'Kenji Sato',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    timeString: '4 hours ago',
    title: 'Kenji started "Minimalist Japanese Tea House Timber Architecture"',
    content: 'Designing a traditional cedar tea house using joinery techniques without a single nail or metal screw.',
    attachedName: 'Cedar Tea House',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 2840, refine: 62, reconsider: 1 }
  },
  {
    id: 'post-comm-16',
    type: 'progress_shot',
    userId: 'creator-kenji',
    userName: 'Kenji Sato',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    timeString: '1 day ago',
    title: 'Kanawa-tsugi Mortise and Tenon Joint Chiseling',
    content: 'Hand chiseling Hinoki cypress beam joints. The friction fit locks tight under gravitational compression.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 4120, refine: 89, reconsider: 2 }
  },

  // Chloe Bennett (2 posts)
  {
    id: 'post-comm-17',
    type: 'project_created',
    userId: 'creator-chloe',
    userName: 'Chloe Bennett',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
    timeString: '5 hours ago',
    title: 'Chloe started "Sustainable Organic Ceramics Collection"',
    content: 'Hand-throwing local clay harvested from coastal creek beds. Glazing with natural wood ash and crushed seashell formulas.',
    attachedName: 'Organic Stoneware',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 1850, refine: 38, reconsider: 1 }
  },
  {
    id: 'post-comm-18',
    type: 'task_completed',
    userId: 'creator-chloe',
    userName: 'Chloe Bennett',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
    timeString: '2 days ago',
    title: '✓ Wood-Fired Anagama Kiln 72-Hour Firing Sequence',
    content: 'Maintained 1300°C temperature using seasoned pine firewood. The natural fly-ash melt glaze achieved emerald glass sheen!',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 3200, refine: 64, reconsider: 0 }
  },

  // Liam O'Connor (2 posts)
  {
    id: 'post-comm-19',
    type: 'update_logged',
    userId: 'creator-liam',
    userName: 'Liam O\'Connor',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    timeString: '6 hours ago',
    title: 'Handmade Leather Portfolio Case Edge Burnishing',
    content: 'Burnishing 6oz vegetable tanned saddle leather with beeswax and wooden slicker until edges glass up smooth.',
    privacy: 'public',
    gongs: { continue: 920, refine: 18, reconsider: 0 }
  },
  {
    id: 'post-comm-20',
    type: 'task_completed',
    userId: 'creator-liam',
    userName: 'Liam O\'Connor',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    timeString: '3 days ago',
    title: '✓ Hand Stitch Main Gusset using Waxed Linen Thread',
    content: 'Traditional two-needle saddle stitching ensures thread won\'t unravel even if one stitch takes wear.',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800',
    privacy: 'internal',
    gongs: { continue: 1450, refine: 22, reconsider: 1 }
  },

  // Maya Lin (2 posts)
  {
    id: 'post-comm-21',
    type: 'project_created',
    userId: 'creator-maya',
    userName: 'Maya Lin',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    timeString: '7 hours ago',
    title: 'Maya started "Environmental Topography Earthwork Sculpture"',
    content: 'Carving contoured soil mounds in upstate park grounds. Integrating native wildflower seed banks that bloom in wave patterns.',
    attachedName: 'Earthwork Topology',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 5410, refine: 110, reconsider: 3 }
  },
  {
    id: 'post-comm-22',
    type: 'progress_shot',
    userId: 'creator-maya',
    userName: 'Maya Lin',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    timeString: '2 days ago',
    title: 'Granite Inscription Carving Depth Verification',
    content: 'Verifying laser etching depth on polished black granite slabs under harsh sunlight conditions.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 3890, refine: 74, reconsider: 2 }
  },

  // Gordan Ramson (2 posts)
  {
    id: 'post-comm-23',
    type: 'update_logged',
    userId: 'creator-ramson',
    userName: 'Gordan Ramson',
    userAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120',
    timeString: '8 hours ago',
    title: 'Artisanal Sourdough Fermentation Temperature Log',
    content: 'Maintained 26°C bulk fermentation room for 4.5 hours. Dough volume doubled with silky, translucent gas windows!',
    privacy: 'internal',
    gongs: { continue: 2150, refine: 42, reconsider: 1 }
  },
  {
    id: 'post-comm-24',
    type: 'task_completed',
    userId: 'creator-ramson',
    userName: 'Gordan Ramson',
    userAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120',
    timeString: '3 days ago',
    title: '✓ Score Sourdough Boule with Curved Razor Lame',
    content: 'Clean single-pass ear score at 45 degree tilt angle. Spring expansion in dutch oven was monumental!',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 4890, refine: 95, reconsider: 2 }
  },

  // William Shakespeare (2 posts)
  {
    id: 'post-comm-25',
    type: 'project_created',
    userId: 'creator-will',
    userName: 'William Shakespeare',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
    timeString: '9 hours ago',
    title: 'William started "Macbeth Act 1 Scene 1 Draft"',
    content: 'When shall we three meet again, in thunder, lightning, or in rain? Setting up the tragic downfall in tight rhyming couplets.',
    attachedName: 'Macbeth Tragedy',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 6240, refine: 180, reconsider: 8 }
  },
  {
    id: 'post-comm-26',
    type: 'update_logged',
    userId: 'creator-will',
    userName: 'William Shakespeare',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
    timeString: '4 days ago',
    title: 'Globe Theater Rehearsal Acoustics Check',
    content: 'Tested actor vocal projection from center stage to top balcony standing area. Iambic pentameter cadence carries clearly over wind noise.',
    privacy: 'public',
    gongs: { continue: 4120, refine: 85, reconsider: 3 }
  },

  // Zara Vance (2 posts)
  {
    id: 'post-comm-27',
    type: 'project_created',
    userId: 'creator-zara',
    userName: 'Zara Vance',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    timeString: '10 hours ago',
    title: 'Zara started "Generative Algorithmic Textile Design"',
    content: 'Writing Python scripts that translate weather wind velocity vector data into woven jacquard loom thread patterns.',
    attachedName: 'Algorithmic Weaving',
    image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 1890, refine: 42, reconsider: 1 }
  },
  {
    id: 'post-comm-28',
    type: 'task_completed',
    userId: 'creator-zara',
    userName: 'Zara Vance',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    timeString: '3 days ago',
    title: '✓ Weave First Prototype Tapestry on Digital Loom',
    content: 'Organically dyed silk yarns running through 1200 warp threads per meter.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    privacy: 'internal',
    gongs: { continue: 2450, refine: 55, reconsider: 0 }
  },

  // Amara Okafor (2 posts)
  {
    id: 'post-comm-29',
    type: 'project_created',
    userId: 'creator-amara',
    userName: 'Amara Okafor',
    userAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=120',
    timeString: '11 hours ago',
    title: 'Amara started "Solar Micro-Grid Pavilion Blueprint"',
    content: 'Designing community shade structure built with bamboo framework and translucent flexible solar panels powering evening LED lighting.',
    attachedName: 'Solar Micro-Grid',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 3120, refine: 68, reconsider: 2 }
  },
  {
    id: 'post-comm-30',
    type: 'progress_shot',
    userId: 'creator-amara',
    userName: 'Amara Okafor',
    userAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=120',
    timeString: '2 days ago',
    title: 'Borate Salt Bamboo Curing Chamber Inspection',
    content: 'Treating structural bamboo poles against moisture and insects for 50+ year exterior longevity.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 2180, refine: 39, reconsider: 1 }
  },

  // Sophia Taylor (2 posts)
  {
    id: 'post-comm-31',
    type: 'update_logged',
    userId: 'creator-sophia',
    userName: 'Sophia Taylor',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    timeString: '13 hours ago',
    title: 'Hand-Crafted Mechanical Chronograph Movement Assembly',
    content: 'Fitting the balance wheel hairspring. 28,800 vibrations per hour beat rate calibrated on the timing machine to +/- 1 sec/day!',
    privacy: 'public',
    gongs: { continue: 4890, refine: 92, reconsider: 1 }
  },
  {
    id: 'post-comm-32',
    type: 'task_completed',
    userId: 'creator-sophia',
    userName: 'Sophia Taylor',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    timeString: '4 days ago',
    title: '✓ Guilloché Engine Turning on Silver Watch Dial',
    content: 'Hand-cranking the rose engine lathe to cut intricate barleycorn pattern grooves into sterling silver dial plate.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    privacy: 'internal',
    gongs: { continue: 3120, refine: 48, reconsider: 0 }
  },

  // Carlos Santana (2 posts)
  {
    id: 'post-comm-33',
    type: 'project_created',
    userId: 'creator-carlos',
    userName: 'Carlos Santana',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    timeString: '15 hours ago',
    title: 'Carlos started "Custom Flamenco Acoustic Guitar Voicing"',
    content: 'Hand-carving European spruce soundboard and Spanish cedar neck. Tuning tap tones for quick attack and long sustained bass resonance.',
    attachedName: 'Flamenco Luthier Series',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 2890, refine: 62, reconsider: 2 }
  },
  {
    id: 'post-comm-34',
    type: 'progress_shot',
    userId: 'creator-carlos',
    userName: 'Carlos Santana',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    timeString: '3 days ago',
    title: 'French Polish Shellac Layering #12',
    content: 'Applying pure blonde shellac with cotton pad in smooth figure-eight motions. Mirror sheen reflecting studio lights perfectly.',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 1980, refine: 35, reconsider: 0 }
  },

  // Hannah Abbott & Hiroshi Tanaka (2 posts)
  {
    id: 'post-comm-35',
    type: 'project_created',
    userId: 'creator-hannah',
    userName: 'Hannah Abbott',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    timeString: '16 hours ago',
    title: 'Hannah started "Botanical Glasshouse Conservatory Design"',
    content: 'Designing modular cast-iron arch ribs for housing rare alpine fern species under controlled microclimates.',
    attachedName: 'Glasshouse Conservatory',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 1750, refine: 31, reconsider: 1 }
  },
  {
    id: 'post-comm-36',
    type: 'task_completed',
    userId: 'creator-hiroshi',
    userName: 'Hiroshi Tanaka',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    timeString: '1 day ago',
    title: '✓ Hand Forge Damascus Chef Knife 120-Layer Billet',
    content: 'Folded high-carbon 1095 and nickel steel 6 times in gas forge. Etched in ferric chloride to reveal ripple wave grain pattern.',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
    privacy: 'public',
    gongs: { continue: 6420, refine: 140, reconsider: 3 }
  }
];

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-gallery',
    title: 'Autumn Gallery Showcase',
    description: 'Preparing three major oil paintings for the Impressionist Salon. Strict deadline. Margin for error is tight.',
    deadlineDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 * 7).toISOString(), // 10 weeks from now
    projectIds: ['proj-painting-1', 'proj-painting-2'],
    workMode: 'parallel',
    budgetedHours: 80 // Total available time "sand" units
  },
  {
    id: 'col-sandwich-rush',
    title: 'Midday Fuel Event',
    description: 'Assemble a highly complex BLT and custom side dish within a very short lunchtime window.',
    deadlineDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    projectIds: ['proj-blt'],
    workMode: 'sequential',
    budgetedHours: 3 // Total available time "sand" units
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-painting-1',
    title: 'Sunset Over Mission Bay',
    recipeId: 'recipe-paint',
    recipeTitle: 'Paint an Oil Canvas',
    createdAt: new Date().toISOString(),
    privacy: 'public',
    collectionId: 'col-gallery',
    phases: [
      {
        id: 'p1',
        title: 'Conception & Setup',
        tasks: [
          { id: 't1', title: 'Sketch three small charcoal thumbnails', completed: true, estimatedHours: 1 },
          { id: 't2', title: 'Apply gesso primer to raw linen canvas', completed: true, estimatedHours: 3 },
          { id: 't3', title: 'Mix a harmonized oil color palette', completed: false, estimatedHours: 1.5 }
        ]
      },
      {
        id: 'p2',
        title: 'Underpainting Wash',
        tasks: [
          { id: 't4', title: 'Block in core dark shadows using burnt umber', completed: false, estimatedHours: 2 },
          { id: 't5', title: 'Establish central light source and temperature', completed: false, estimatedHours: 1 },
          { id: 't6', title: 'Wipe away highlights with a solvent cloth', completed: false, estimatedHours: 1.5 }
        ]
      },
      {
        id: 'p3',
        title: 'Glazing & Refining',
        tasks: [
          { id: 't7', title: 'Layer impasto texture on primary focal areas', completed: false, estimatedHours: 6 },
          { id: 't8', title: 'Blend edges for atmospheric distance depth', completed: false, estimatedHours: 4 },
          { id: 't9', title: 'Let dry, sign, and apply protective damar varnish', completed: false, estimatedHours: 12 }
        ]
      }
    ],
    progressPhotos: [
      {
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=200',
        caption: 'First thumb sketches ready.',
        date: '2026-07-14'
      }
    ]
  },
  {
    id: 'proj-painting-2',
    title: 'Neon Shadows in Rain',
    recipeId: 'recipe-paint',
    recipeTitle: 'Paint an Oil Canvas',
    createdAt: new Date().toISOString(),
    privacy: 'public',
    collectionId: 'col-gallery',
    phases: [
      {
        id: 'p4',
        title: 'Conception & Setup',
        tasks: [
          { id: 't10', title: 'Sketch three small charcoal thumbnails', completed: true, estimatedHours: 1 },
          { id: 't11', title: 'Apply gesso primer to raw linen canvas', completed: true, estimatedHours: 3 },
          { id: 't12', title: 'Mix a harmonized oil color palette', completed: true, estimatedHours: 1.5 }
        ]
      },
      {
        id: 'p5',
        title: 'Underpainting Wash',
        tasks: [
          { id: 't13', title: 'Block in core dark shadows using burnt umber', completed: true, estimatedHours: 2 },
          { id: 't14', title: 'Establish central light source and temperature', completed: true, estimatedHours: 1 },
          { id: 't15', title: 'Wipe away highlights with a solvent cloth', completed: true, estimatedHours: 1.5 }
        ]
      },
      {
        id: 'p6',
        title: 'Glazing & Refining',
        tasks: [
          { id: 't16', title: 'Layer impasto texture on primary focal areas', completed: false, estimatedHours: 6 },
          { id: 't17', title: 'Blend edges for atmospheric distance depth', completed: false, estimatedHours: 4 },
          { id: 't18', title: 'Let dry, sign, and apply protective damar varnish', completed: false, estimatedHours: 12 }
        ]
      }
    ]
  }
];

export const COMMUNITY_RECIPES: Recipe[] = [
  {
    id: 'comm-paint',
    title: 'Paint an Oil Canvas',
    description: 'From an empty white surface to a finished, varnished, exhibition-ready masterpiece. Perfect for mastering oil drying times.',
    authorId: 'creator-clara',
    authorName: 'Clara Monet',
    category: 'Creative',
    tags: ['Art', 'Studio', 'Technique'],
    phases: [
      {
        title: 'Conception & Setup',
        tasks: [
          { title: 'Sketch three small charcoal thumbnails', estimatedHours: 1 },
          { title: 'Apply gesso primer to raw linen canvas', estimatedHours: 3 },
          { title: 'Mix a harmonized oil color palette', estimatedHours: 1.5 }
        ]
      },
      {
        title: 'Underpainting Wash',
        tasks: [
          { title: 'Block in core dark shadows using burnt umber', estimatedHours: 2 },
          { title: 'Establish central light source and temperature', estimatedHours: 1 },
          { title: 'Wipe away highlights with a solvent cloth', estimatedHours: 1.5 }
        ]
      },
      {
        title: 'Glazing & Refining',
        tasks: [
          { title: 'Layer impasto texture on primary focal areas', estimatedHours: 6 },
          { title: 'Blend edges for atmospheric distance depth', estimatedHours: 4 },
          { title: 'Let dry, sign, and apply protective damar varnish', estimatedHours: 12 }
        ]
      }
    ]
  },
  {
    id: 'comm-hero',
    title: 'Become a Superhero',
    description: 'Learn to defend your neighborhood while maintaining complete creative integrity. Blurs the line between high-gravity discipline and absolute play.',
    authorId: 'creator-bruce',
    authorName: 'Bruce Wayne',
    category: 'Humorous',
    tags: ['Heroism', 'Creative', 'Lifestyle'],
    phases: [
      {
        title: 'Origin Story & Identity',
        tasks: [
          { title: 'Identify tragic backstory or dramatic mystery', estimatedHours: 2 },
          { title: 'Choose a thematic, fear-inducing animal guide', estimatedHours: 4 },
          { title: 'Draft your intimidating vigilante moniker', estimatedHours: 1.5 }
        ]
      },
      {
        title: 'Prep & Tech Arsenal',
        tasks: [
          { title: 'Design heavy Kevlar-weave costume (dark tones)', estimatedHours: 12 },
          { title: 'Find deep subterranean lair with high ceiling', estimatedHours: 24 },
          { title: 'Forge custom grappling hook or throwing asset', estimatedHours: 8 }
        ]
      },
      {
        title: 'Vigilante Execution',
        tasks: [
          { title: 'Practice delivering your signature catchphrase', estimatedHours: 3 },
          { title: 'Formulate an ideological rivalry with an arch-nemesis', estimatedHours: 5 },
          { title: 'Succeed in first dramatic rooftop escape', estimatedHours: 6 }
        ]
      }
    ]
  },
  {
    id: 'comm-sourdough',
    title: 'Bake a Perfect Sourdough Loaf',
    description: 'The ultimate artisanal sequence focusing on wild fermentation, temperature timing, and tension adjustments.',
    authorId: 'creator-ramson',
    authorName: 'Gordan Ramson',
    category: 'Practical',
    tags: ['Sourdough', 'Baking', 'Precision'],
    phases: [
      {
        title: 'Levain Prep & Autolyse',
        tasks: [
          { title: 'Feed starter with stoneground rye flour', estimatedHours: 0.5 },
          { title: 'Mix flour and water to hydrate (Autolyse)', estimatedHours: 1 },
          { title: 'Measure precise ambient dough temperature', estimatedHours: 0.1 }
        ]
      },
      {
        title: 'Bulk Fermentation & Stretch',
        tasks: [
          { title: 'Incorporate active levain and fine sea salt', estimatedHours: 0.5 },
          { title: 'Perform 4 sets of stretch and folds every 30 mins', estimatedHours: 2 },
          { title: 'Audit bubble structure and dough volume growth', estimatedHours: 4 }
        ]
      },
      {
        title: 'Shape, Cold Retard & Bake',
        tasks: [
          { title: 'Shape dough with tight surface tension folds', estimatedHours: 0.5 },
          { title: 'Proof overnight in refrigerator for complex acids', estimatedHours: 12 },
          { title: 'Score with razor lame and bake in preheated dutch oven', estimatedHours: 1 }
        ]
      }
    ]
  },
  {
    id: 'comm-play',
    title: 'Write a Five-Act Tragedy',
    description: 'A structural framework for theatrical drafting, emotional progression, and tight iambic verse calibration.',
    authorId: 'creator-will',
    authorName: 'William Shakespeare',
    category: 'Creative',
    tags: ['Theater', 'Writing', 'Rhythm'],
    phases: [
      {
        title: 'World-building & Exposition',
        tasks: [
          { title: 'Define tragic hubris or fatal flaw of the protagonist', estimatedHours: 3 },
          { title: 'Set up external political backdrop or family rivalry', estimatedHours: 4 },
          { title: 'Draft initial scene setting atmospheric tone', estimatedHours: 2.5 }
        ]
      },
      {
        title: 'Rising Action & Climax',
        tasks: [
          { title: 'Introduce a catalyst inciting incident of betrayals', estimatedHours: 6 },
          { title: 'Draft critical middle-act turning point confrontation', estimatedHours: 8 },
          { title: 'Incorporate high-tension internal soliloquies', estimatedHours: 4 }
        ]
      },
      {
        title: 'Tragic Resolution',
        tasks: [
          { title: 'Choreograph dramatic swordplay or tragic misunderstanding', estimatedHours: 4 },
          { title: 'Deliver solemn concluding moral statement speech', estimatedHours: 2 },
          { title: 'Varnish script and send to standard playing actors', estimatedHours: 1.5 }
        ]
      }
    ]
  },
  {
    id: 'comm-engine',
    title: 'Model mechanical engine simulator',
    description: 'Calculate algorithmic loops on steam-powered mechanical logic. Connect columns and variable punched cards.',
    authorId: 'creator-ada',
    authorName: 'Ada Lovelace',
    category: 'Educational',
    tags: ['Computing', 'Mathematics', 'Logic'],
    phases: [
      {
        title: 'Logic Specifications',
        tasks: [
          { title: 'Draft binary operational matrix algorithms', estimatedHours: 4 },
          { title: 'Formulate Bernoulli series loop equations', estimatedHours: 6 }
        ]
      },
      {
        title: 'Punched Card Design',
        tasks: [
          { title: 'Format variable columns on high-density cards', estimatedHours: 3 },
          { title: 'Verify mechanical carriage gear alignment ratios', estimatedHours: 5 }
        ]
      }
    ]
  }
];
