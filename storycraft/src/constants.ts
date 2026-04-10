import { SubscriptionTier } from './types';

export const SUBSCRIPTION_LIMITS = {
  free: {
    maxStoriesTotal: 1,
    maxPagesPerStory: 5,
    allowCollaboration: false,
    allowMarketplacePublishing: false,
    allowedStyles: ['watercolor', 'sketch', 'comic'],
    allowedLanguages: ['English'],
    freeMarketplace: false,
    tokensPerMonth: 5,
    bookTokenCost: 1,
  },
  standard: {
    maxStoriesPerMonth: 3,
    maxPagesPerStory: 15,
    allowCollaboration: true,
    allowMarketplacePublishing: false,
    allowedStyles: ['watercolor', 'cartoon', 'sketch', 'anime', 'comic'],
    allowedLanguages: ['English', 'Spanish', 'French'],
    freeMarketplace: false,
    tokensPerMonth: 20,
    bookTokenCost: 1,
  },
  premium: {
    maxStoriesTotal: Infinity,
    maxPagesPerStory: 50,
    allowCollaboration: true,
    allowMarketplacePublishing: true,
    allowedStyles: ['watercolor', 'cartoon', 'anime', 'oil-painting', 'sketch', 'cinematic', 'cyberpunk', 'comic'],
    allowedLanguages: ['English', 'Spanish', 'French', 'Arabic', 'Japanese', 'German'],
    freeMarketplace: false,
    tokensPerMonth: 100,
    bookTokenCost: 1,
  },
  ultimate: {
    maxStoriesTotal: Infinity,
    maxPagesPerStory: 100,
    allowCollaboration: true,
    allowMarketplacePublishing: true,
    allowedStyles: [
      'watercolor-dream', 'midnight-tales', 'vintage-storybook', 'whimsical-play', 
      'minimalist-parchment', 'enchanted-forest', 'galactic-odyssey', 'fairy-dust', 
      'steampunk-chronicle', 'nordic-simplicity', 'neon-noir', 'paper-cut', 
      'botanical-sketch', 'retro-pixel', 'gilded-age', 'misty-highlands', 
      'kawaii-cute', 'art-nouveau', 'scandinavian-folk', 'monochrome-ink', 
      'cloud-nine', 'crystal-cavern', 'rustic-cabin', 'celestial-map', 'toy-block',
      'watercolor', 'cartoon', 'anime', 'oil-painting', 'sketch', 'cinematic', 'cyberpunk', 'comic'
    ],
    allowedLanguages: ['English', 'Spanish', 'French', 'Arabic', 'Japanese', 'German'],
    freeMarketplace: true,
    tokensPerMonth: 500,
    bookTokenCost: 1,
  }
};

export const STORY_CATEGORIES = [
  { id: 'adventure', name: 'Adventure' },
  { id: 'fantasy', name: 'Fantasy' },
  { id: 'mystery', name: 'Mystery' },
  { id: 'sci-fi', name: 'Sci-Fi' },
  { id: 'educational', name: 'Educational' },
  { id: 'drama', name: 'Drama' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'horror', name: 'Horror' },
  { id: 'romance', name: 'Romance' },
  { id: 'thriller', name: 'Thriller' },
  { id: 'biography', name: 'Biography' },
  { id: 'historical', name: 'Historical' },
  { id: 'other', name: 'Other' }
];

export const STORY_STYLES = [
  { id: 'watercolor-dream', name: 'Watercolor Dream', description: 'Soft, bleeding colors; textured paper backgrounds; hand-drawn borders.', mood: 'Artistic, nostalgic, gentle.' },
  { id: 'midnight-tales', name: 'Midnight Tales', description: 'Dark background with glowing accents; deep blues, purples, and golds.', mood: 'Mysterious, magical, bedtime.' },
  { id: 'vintage-storybook', name: 'Vintage Storybook', description: 'Sepia tones, aged paper textures, ornate borders, classic serif fonts.', mood: 'Classic, timeless, traditional.' },
  { id: 'whimsical-play', name: 'Whimsical Play', description: 'Bright, saturated colors; playful shapes; bouncy animations.', mood: 'Fun, energetic, child-friendly.' },
  { id: 'minimalist-parchment', name: 'Minimalist Parchment', description: 'Clean, airy layout with cream background and soft earth tones.', mood: 'Calm, focused, modern.' },
  { id: 'enchanted-forest', name: 'Enchanted Forest', description: 'Deep greens, earthy browns, soft light filtering through leaves.', mood: 'Natural, peaceful, adventurous.' },
  { id: 'galactic-odyssey', name: 'Galactic Odyssey', description: 'Deep space blues, purples, with neon accents and holographic touches.', mood: 'Futuristic, epic, cosmic.' },
  { id: 'fairy-dust', name: 'Fairy Dust', description: 'Pastel pinks, lavenders, and shimmering sparkle effects.', mood: 'Magical, feminine, dreamy.' },
  { id: 'steampunk-chronicle', name: 'Steampunk Chronicle', description: 'Rich browns, brass tones, cogwheel motifs, and aged industrial textures.', mood: 'Inventive, historical, mechanical.' },
  { id: 'nordic-simplicity', name: 'Nordic Simplicity', description: 'Clean, functional design with muted blues, whites, and natural wood accents.', mood: 'Calm, trustworthy, timeless.' },
  { id: 'neon-noir', name: 'Neon Noir', description: 'Dark backgrounds with vibrant neon outlines, reminiscent of 80s retro-futurism.', mood: 'Edgy, dynamic, cinematic.' },
  { id: 'paper-cut', name: 'Paper Cut', description: 'Layered cut-out shapes that mimic paper art; strong shadows between layers.', mood: 'Crafty, dimensional, modern.' },
  { id: 'botanical-sketch', name: 'Botanical Sketch', description: 'Delicate line drawings of plants and flowers with muted watercolor backgrounds.', mood: 'Fresh, organic, elegant.' },
  { id: 'retro-pixel', name: 'Retro Pixel', description: 'Low-resolution pixel art with limited color palettes; chiptune aesthetics.', mood: 'Nostalgic, playful, indie.' },
  { id: 'gilded-age', name: 'Gilded Age', description: 'Deep jewel tones with gold foil accents and ornate details.', mood: 'Opulent, sophisticated, celebratory.' },
  { id: 'misty-highlands', name: 'Misty Highlands', description: 'Soft grays, muted greens, and misty, layered landscapes.', mood: 'Serene, contemplative, wild.' },
  { id: 'kawaii-cute', name: 'Kawaii Cute', description: 'Ultra-cute, rounded everything, pastel colors, and expressive small details.', mood: 'Adorable, friendly, comforting.' },
  { id: 'art-nouveau', name: 'Art Nouveau', description: 'Flowing organic lines, botanical motifs, muted gold and olive tones.', mood: 'Elegant, artistic, organic.' },
  { id: 'scandinavian-folk', name: 'Scandinavian Folk', description: 'Bold, simplified folk art patterns with reds, whites, and blues.', mood: 'Cheerful, traditional, warm.' },
  { id: 'monochrome-ink', name: 'Monochrome Ink', description: 'Black, white, and grayscale only; high contrast; expressive brush strokes.', mood: 'Bold, dramatic, artistic.' },
  { id: 'cloud-nine', name: 'Cloud Nine', description: 'Soft, fluffy elements with pastel blues and pinks, cotton-like textures.', mood: 'Light, airy, dreamy.' },
  { id: 'crystal-cavern', name: 'Crystal Cavern', description: 'Angular geometric shapes with translucent, glass-like surfaces.', mood: 'Modern, sharp, magical.' },
  { id: 'rustic-cabin', name: 'Rustic Cabin', description: 'Warm wood tones, plaid patterns, and cozy textures.', mood: 'Warm, inviting, homey.' },
  { id: 'celestial-map', name: 'Celestial Map', description: 'Deep blues with gold constellation lines, compass rose motifs.', mood: 'Adventurous, guiding, epic.' },
  { id: 'toy-block', name: 'Toy Block', description: 'Bright primary colors, chunky blocky shapes, shadowed letters.', mood: 'Playful, educational, sturdy.' },
  { id: 'watercolor', name: 'Watercolor' },
  { id: 'cartoon', name: 'Whimsical' },
  { id: 'sketch', name: 'Sketch' },
  { id: 'anime', name: 'Ghibli Magic', premium: true },
  { id: 'comic', name: 'Comic Book', premium: true },
  { id: 'oil-painting', name: 'Oil Painting', premium: true },
  { id: 'cinematic', name: 'Cinematic', premium: true },
  { id: 'cyberpunk', name: 'Cyberpunk', premium: true },
];

export const FONTS = [
  { id: 'serif', name: 'Classic Serif', family: '"Cormorant Garamond", serif' },
  { id: 'sans', name: 'Modern Sans', family: '"Inter", sans-serif' },
  { id: 'playfair', name: 'Elegant Display', family: '"Playfair Display", serif' },
  { id: 'mono', name: 'Technical Mono', family: '"JetBrains Mono", monospace' },
  { id: 'handwriting', name: 'Handwritten', family: '"Dancing Script", cursive' },
];

export const SUBSCRIPTION_PRICING = {
  standard: {
    monthly: 7.00,
    yearly: 67.20, // ~20% off $84.00
  },
  premium: {
    monthly: 19.99,
    yearly: 191.90, // ~20% off $239.88
  },
  ultimate: {
    monthly: 40.00,
    yearly: 400.00, // ~16% off $480.00
  }
};

export const getSubscriptionLimits = (tier: SubscriptionTier) => {
  return SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.free;
};
