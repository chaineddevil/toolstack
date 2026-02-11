// ─── Quiz Configuration & Recommendation Engine ─────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────────────

export type QuizAnswers = {
  role: string;
  goals: string[];
  technical: string;
  budget: string;
  workflow: string;
};

export type Recommendation = {
  slug: string;
  score: number;
  reason: string;
};

export type QuizResult = {
  topPick: Recommendation;
  alternatives: Recommendation[];
  relatedPostSlugs: string[];
};

// ─── Step Definitions ────────────────────────────────────────────────────────

export const QUIZ_STEPS = [
  {
    id: "role",
    question: "Who are you?",
    subtitle: "No wrong answers — we're just getting to know you.",
    type: "single" as const,
    options: [
      { value: "solo-creator", label: "Solo creator / freelancer" },
      { value: "startup-founder", label: "Startup founder" },
      { value: "designer", label: "Designer" },
      { value: "marketer", label: "Marketer" },
      { value: "developer", label: "Developer" },
      { value: "small-business", label: "Small business owner" },
      { value: "student", label: "Student" },
      { value: "exploring", label: "Just exploring" },
    ],
  },
  {
    id: "goals",
    question: "What's your main goal?",
    subtitle: "Pick as many as you like.",
    type: "multi" as const,
    options: [
      { value: "automation", label: "Save time with automation" },
      { value: "design", label: "Design better products" },
      { value: "no-code", label: "Build websites/apps without code" },
      { value: "marketing", label: "Grow audience / marketing" },
      { value: "project-mgmt", label: "Manage projects better" },
      { value: "make-money", label: "Make money online" },
      { value: "learn", label: "Learn new tools" },
    ],
  },
  {
    id: "technical",
    question: "How technical are you?",
    subtitle: "This helps us match the right complexity level.",
    type: "single" as const,
    options: [
      { value: "beginner", label: "Beginner — I avoid code" },
      { value: "somewhat", label: "Somewhat technical" },
      { value: "very", label: "Very technical" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget range?",
    subtitle: "We'll filter tools that actually fit.",
    type: "single" as const,
    options: [
      { value: "free", label: "Free tools only" },
      { value: "under-20", label: "Under $20/month" },
      { value: "20-100", label: "$20–$100/month" },
      { value: "no-limit", label: "No limit if it's worth it" },
    ],
  },
  {
    id: "workflow",
    question: "What kind of workflow do you prefer?",
    subtitle: "Almost there — last question!",
    type: "single" as const,
    options: [
      { value: "simple", label: "Simple & minimal" },
      { value: "feature-rich", label: "Feature-rich" },
      { value: "ai-first", label: "AI-first" },
      { value: "visual", label: "Visual / no-code" },
    ],
  },
];

// ─── Scoring Engine ──────────────────────────────────────────────────────────

// Category weights per tool slug — each tool's affinity for a category
const TOOL_CATEGORIES: Record<string, string> = {
  notion: "business-productivity",
  figma: "design-ux",
  webflow: "no-code",
  zapier: "ai-automation",
  framer: "design-ux",
  vercel: "developer",
  mailchimp: "marketing",
  bubble: "no-code",
  linear: "business-productivity",
  airtable: "no-code",
  slack: "business-productivity",
  stripe: "developer",
  supabase: "developer",
  convertkit: "marketing",
  canva: "design-ux",
  make: "ai-automation",
  retool: "no-code",
  loom: "business-productivity",
};

// Tool-specific traits for precise matching
const TOOL_TRAITS: Record<string, string[]> = {
  notion: ["simple", "project-mgmt", "beginner-friendly", "free-tier", "productivity"],
  figma: ["design", "beginner-friendly", "free-tier", "collaboration", "visual"],
  webflow: ["no-code", "marketing", "visual", "website-builder", "feature-rich"],
  zapier: ["automation", "beginner-friendly", "free-tier", "integration"],
  framer: ["design", "no-code", "visual", "website-builder", "free-tier", "simple"],
  vercel: ["developer", "technical", "free-tier", "deployment"],
  mailchimp: ["marketing", "email", "beginner-friendly", "free-tier", "automation"],
  bubble: ["no-code", "feature-rich", "app-builder", "startup"],
  linear: ["project-mgmt", "technical", "developer", "feature-rich"],
  airtable: ["no-code", "beginner-friendly", "free-tier", "project-mgmt", "visual"],
  slack: ["simple", "beginner-friendly", "free-tier", "collaboration", "productivity"],
  stripe: ["developer", "technical", "payment"],
  supabase: ["developer", "technical", "free-tier", "app-builder"],
  convertkit: ["marketing", "email", "beginner-friendly", "free-tier", "simple"],
  canva: ["design", "beginner-friendly", "free-tier", "visual", "simple", "marketing"],
  make: ["automation", "feature-rich", "integration", "visual"],
  retool: ["no-code", "developer", "feature-rich", "app-builder"],
  loom: ["simple", "beginner-friendly", "free-tier", "collaboration", "productivity"],
};

// Budget tiers — max monthly $ a tool's base plan costs (approximate)
const TOOL_BUDGET: Record<string, number> = {
  notion: 0,       // free for individuals
  figma: 0,        // free for 3 projects
  webflow: 18,
  zapier: 0,       // free 100 tasks
  framer: 0,       // free for personal
  vercel: 0,       // free hobby
  mailchimp: 0,    // free 500 contacts
  bubble: 0,       // free to learn
  linear: 0,       // free for individuals
  airtable: 0,     // free 1,000 records
  slack: 0,        // free 90-day history
  stripe: 0,       // pay per transaction only
  supabase: 0,     // free 500MB
  convertkit: 0,   // free 10k subscribers
  canva: 0,        // free 250k templates
  make: 0,         // free 1,000 ops
  retool: 0,       // free 5 users
  loom: 0,         // free 25 videos
};

// Role → category weight map
const ROLE_WEIGHTS: Record<string, Record<string, number>> = {
  "solo-creator":    { "business-productivity": 3, "no-code": 2, "marketing": 2, "ai-automation": 1 },
  "startup-founder": { "no-code": 3, "ai-automation": 2, "business-productivity": 2, "design-ux": 1 },
  "designer":        { "design-ux": 4, "no-code": 2 },
  "marketer":        { "marketing": 4, "ai-automation": 2, "no-code": 1 },
  "developer":       { "developer": 4, "ai-automation": 1 },
  "small-business":  { "business-productivity": 3, "marketing": 2, "no-code": 2, "ai-automation": 1 },
  "student":         { "design-ux": 2, "business-productivity": 2, "no-code": 2, "developer": 1 },
  "exploring":       { "business-productivity": 1, "design-ux": 1, "no-code": 1, "ai-automation": 1, "marketing": 1, "developer": 1 },
};

// Goal → category weight map
const GOAL_WEIGHTS: Record<string, Record<string, number>> = {
  "automation":    { "ai-automation": 3, "business-productivity": 1 },
  "design":        { "design-ux": 3, "no-code": 1 },
  "no-code":       { "no-code": 3, "design-ux": 1 },
  "marketing":     { "marketing": 3, "no-code": 1 },
  "project-mgmt":  { "business-productivity": 3 },
  "make-money":    { "marketing": 2, "no-code": 2, "ai-automation": 1 },
  "learn":         { "business-productivity": 1, "design-ux": 1, "no-code": 1, "ai-automation": 1, "marketing": 1, "developer": 1 },
};

// Technical → trait boosts
const TECH_TRAIT_BOOST: Record<string, string[]> = {
  "beginner":  ["beginner-friendly", "simple", "visual", "no-code"],
  "somewhat":  ["feature-rich", "visual"],
  "very":      ["developer", "technical", "feature-rich"],
};

// Workflow → trait boosts
const WORKFLOW_TRAIT_BOOST: Record<string, string[]> = {
  "simple":       ["simple", "beginner-friendly"],
  "feature-rich": ["feature-rich", "app-builder"],
  "ai-first":     ["automation", "integration"],
  "visual":       ["visual", "no-code", "website-builder"],
};

// ─── Reason Generation ───────────────────────────────────────────────────────

const REASON_FRAGMENTS: Record<string, Record<string, string>> = {
  role: {
    "solo-creator":    "Perfect for independent creators who need one tool to do it all.",
    "startup-founder": "Built for founders who move fast and validate quickly.",
    "designer":        "Designed specifically for creative and design workflows.",
    "marketer":        "Focused on reaching and converting your audience.",
    "developer":       "Made by developers, for developers.",
    "small-business":  "Helps small teams punch above their weight.",
    "student":         "Generous free tier — ideal for learning.",
    "exploring":       "Great starting point with a low barrier to entry.",
  },
  budget: {
    "free":      "Has a genuinely usable free tier.",
    "under-20":  "Affordable at your budget.",
    "20-100":    "Strong value for the investment.",
    "no-limit":  "Worth every penny for serious users.",
  },
  workflow: {
    "simple":       "Clean and minimal — no bloat.",
    "feature-rich": "Packed with features for power users.",
    "ai-first":     "Smart AI features that save real time.",
    "visual":       "Visual-first — no coding required.",
  },
};

function buildReason(slug: string, answers: QuizAnswers): string {
  const toolCategory = TOOL_CATEGORIES[slug] ?? "";
  const fragments: string[] = [];

  // Add role reason
  const roleReason = REASON_FRAGMENTS.role[answers.role];
  if (roleReason) fragments.push(roleReason);

  // Add workflow reason
  const workflowReason = REASON_FRAGMENTS.workflow[answers.workflow];
  if (workflowReason) fragments.push(workflowReason);

  // Add budget reason if free
  if (answers.budget === "free" && (TOOL_BUDGET[slug] ?? 999) === 0) {
    fragments.push(REASON_FRAGMENTS.budget["free"]);
  }

  // Fallback category-based reason
  if (fragments.length === 0) {
    const catNames: Record<string, string> = {
      "business-productivity": "Streamlines your daily workflow and keeps you organized.",
      "design-ux": "Helps you design and prototype with ease.",
      "no-code": "Build without code — ship faster.",
      "ai-automation": "Automates repetitive tasks so you can focus.",
      "marketing": "Gets your message in front of the right people.",
      "developer": "Developer-grade tooling with excellent DX.",
    };
    fragments.push(catNames[toolCategory] ?? "A solid tool for your stack.");
  }

  return fragments.slice(0, 2).join(" ");
}

// ─── Post Matching ───────────────────────────────────────────────────────────

const GOAL_TO_POSTS: Record<string, string[]> = {
  "automation":    ["zapier-vs-make-automation", "top-ai-productivity-tools"],
  "design":        ["canva-vs-figma", "best-design-tools-for-startups", "figma-vs-framer-vs-webflow"],
  "no-code":       ["best-no-code-tools-2025", "build-internal-dashboards-no-code"],
  "marketing":     ["email-marketing-tools-guide", "saas-tools-for-solopreneurs"],
  "project-mgmt":  ["notion-vs-linear-vs-asana", "saas-tools-for-solopreneurs"],
  "make-money":    ["saas-tools-for-solopreneurs", "best-no-code-tools-2025"],
  "learn":         ["best-free-saas-tools-2025", "best-no-code-tools-2025"],
};

const ROLE_TO_POSTS: Record<string, string[]> = {
  "solo-creator":    ["saas-tools-for-solopreneurs", "best-free-saas-tools-2025"],
  "startup-founder": ["why-startups-need-supabase", "best-no-code-tools-2025", "notion-vs-linear-vs-asana"],
  "designer":        ["canva-vs-figma", "best-design-tools-for-startups", "figma-vs-framer-vs-webflow"],
  "marketer":        ["email-marketing-tools-guide", "saas-tools-for-solopreneurs"],
  "developer":       ["why-startups-need-supabase", "top-ai-productivity-tools"],
  "small-business":  ["saas-tools-for-solopreneurs", "build-internal-dashboards-no-code"],
  "student":         ["best-free-saas-tools-2025", "best-design-tools-for-startups"],
  "exploring":       ["best-free-saas-tools-2025", "top-ai-productivity-tools"],
};

// ─── Main Recommendation Function ────────────────────────────────────────────

export function getRecommendations(answers: QuizAnswers): QuizResult {
  const allSlugs = Object.keys(TOOL_CATEGORIES);
  const scores: Record<string, number> = {};

  // Initialize
  for (const slug of allSlugs) scores[slug] = 0;

  // 1. Role scoring
  const roleWeights = ROLE_WEIGHTS[answers.role] ?? {};
  for (const slug of allSlugs) {
    const cat = TOOL_CATEGORIES[slug];
    scores[slug] += roleWeights[cat] ?? 0;
  }

  // 2. Goal scoring (multi-select — accumulate)
  for (const goal of answers.goals) {
    const goalWeights = GOAL_WEIGHTS[goal] ?? {};
    for (const slug of allSlugs) {
      const cat = TOOL_CATEGORIES[slug];
      scores[slug] += goalWeights[cat] ?? 0;
    }
  }

  // 3. Technical level — trait matching
  const techTraits = TECH_TRAIT_BOOST[answers.technical] ?? [];
  for (const slug of allSlugs) {
    const toolTraits = TOOL_TRAITS[slug] ?? [];
    for (const trait of techTraits) {
      if (toolTraits.includes(trait)) scores[slug] += 1.5;
    }
  }

  // 4. Workflow preference — trait matching
  const workflowTraits = WORKFLOW_TRAIT_BOOST[answers.workflow] ?? [];
  for (const slug of allSlugs) {
    const toolTraits = TOOL_TRAITS[slug] ?? [];
    for (const trait of workflowTraits) {
      if (toolTraits.includes(trait)) scores[slug] += 2;
    }
  }

  // 5. Budget filtering — penalize tools that exceed budget
  const budgetMax =
    answers.budget === "free" ? 0 :
    answers.budget === "under-20" ? 20 :
    answers.budget === "20-100" ? 100 : Infinity;

  for (const slug of allSlugs) {
    const cost = TOOL_BUDGET[slug] ?? 0;
    if (cost > budgetMax) {
      scores[slug] -= 5; // heavy penalty
    } else if (cost === 0 && answers.budget === "free") {
      scores[slug] += 1; // bonus for truly free
    }
  }

  // 6. Sort by score descending
  const ranked = allSlugs
    .map((slug) => ({ slug, score: scores[slug] }))
    .sort((a, b) => b.score - a.score);

  // Top pick
  const topSlug = ranked[0].slug;
  const topPick: Recommendation = {
    slug: topSlug,
    score: ranked[0].score,
    reason: buildReason(topSlug, answers),
  };

  // Alternatives (next 2–3, different category preferred)
  const topCategory = TOOL_CATEGORIES[topSlug];
  const alternatives: Recommendation[] = [];
  for (const item of ranked.slice(1)) {
    if (alternatives.length >= 3) break;
    // Prefer diversity — different category first, then same category
    if (alternatives.length < 2 && TOOL_CATEGORIES[item.slug] === topCategory) continue;
    alternatives.push({
      slug: item.slug,
      score: item.score,
      reason: buildReason(item.slug, answers),
    });
  }
  // Fill remaining if not enough diversity
  if (alternatives.length < 2) {
    for (const item of ranked.slice(1)) {
      if (alternatives.length >= 3) break;
      if (alternatives.find((a) => a.slug === item.slug)) continue;
      alternatives.push({
        slug: item.slug,
        score: item.score,
        reason: buildReason(item.slug, answers),
      });
    }
  }

  // Related posts — deduplicated
  const postSet = new Set<string>();
  for (const goal of answers.goals) {
    for (const slug of GOAL_TO_POSTS[goal] ?? []) postSet.add(slug);
  }
  for (const slug of ROLE_TO_POSTS[answers.role] ?? []) postSet.add(slug);
  const relatedPostSlugs = [...postSet].slice(0, 3);

  return { topPick, alternatives, relatedPostSlugs };
}
