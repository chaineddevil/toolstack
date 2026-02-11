import Database from "better-sqlite3";

// SaaS discovery platform — SQLite data layer
// Schema auto-bootstraps on first access; seed data populates empty databases.

const DB_PATH = process.env.DB_PATH || "trekking-hub.db";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tool = {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  what_it_is: string;
  who_its_for: string;
  pros: string; // JSON array of strings
  cons: string; // JSON array of strings
  use_cases: string; // JSON array of strings
  pricing_summary: string;
  affiliate_url: string;
  website_url: string;
  image_url: string;
  logo_url: string;
  category_slug: string;
  rating: number | null;
  featured: number;
  published: number;
  created_at: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
};

export type Post = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  featured_image: string | null;
  post_type: "article" | "review" | "comparison";
  category_slug: string | null;
  published: number;
  created_at: string;
  updated_at: string | null;
};

export type PostTool = {
  post_id: number;
  tool_id: number;
  sort_order: number | null;
};

// ─── Singleton ───────────────────────────────────────────────────────────────

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    bootstrapSchema(db);
    seedIfEmpty(db);
  }
  return db;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

function bootstrapSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      tagline TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      what_it_is TEXT NOT NULL DEFAULT '',
      who_its_for TEXT NOT NULL DEFAULT '',
      pros TEXT NOT NULL DEFAULT '[]',
      cons TEXT NOT NULL DEFAULT '[]',
      use_cases TEXT NOT NULL DEFAULT '[]',
      pricing_summary TEXT NOT NULL DEFAULT '',
      affiliate_url TEXT NOT NULL DEFAULT '',
      website_url TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      logo_url TEXT NOT NULL DEFAULT '',
      category_slug TEXT NOT NULL DEFAULT '',
      rating REAL,
      featured INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_slug) REFERENCES categories(slug)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      summary TEXT,
      body TEXT NOT NULL DEFAULT '',
      featured_image TEXT,
      post_type TEXT NOT NULL DEFAULT 'article',
      category_slug TEXT,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS post_tools (
      post_id INTEGER NOT NULL,
      tool_id INTEGER NOT NULL,
      sort_order INTEGER,
      PRIMARY KEY (post_id, tool_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      goals TEXT NOT NULL DEFAULT '[]',
      technical TEXT NOT NULL,
      budget TEXT NOT NULL,
      workflow TEXT NOT NULL,
      top_pick_slug TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ─── Seed ────────────────────────────────────────────────────────────────────

function seedIfEmpty(database: Database.Database) {
  const count = (
    database.prepare("SELECT COUNT(*) as c FROM categories").get() as {
      c: number;
    }
  ).c;
  if (count > 0) return;

  // Categories
  const insertCat = database.prepare(
    `INSERT INTO categories (name, slug, description, icon, sort_order)
     VALUES (@name, @slug, @description, @icon, @sort_order)`
  );

  const categories = [
    {
      name: "No-Code Tools",
      slug: "no-code",
      description:
        "Build apps, websites, and workflows without writing a single line of code.",
      icon: "puzzle",
      sort_order: 1,
    },
    {
      name: "AI & Automation",
      slug: "ai-automation",
      description:
        "Supercharge your productivity with AI-powered tools and automation platforms.",
      icon: "sparkles",
      sort_order: 2,
    },
    {
      name: "Design & UX",
      slug: "design-ux",
      description:
        "Prototyping, UI design, and user experience tools for creative teams.",
      icon: "palette",
      sort_order: 3,
    },
    {
      name: "Marketing Tools",
      slug: "marketing",
      description:
        "Email, SEO, social, and growth tools to reach and convert your audience.",
      icon: "megaphone",
      sort_order: 4,
    },
    {
      name: "Developer Tools",
      slug: "developer",
      description:
        "Code editors, hosting, CI/CD, and infrastructure for modern dev teams.",
      icon: "code",
      sort_order: 5,
    },
    {
      name: "Business & Productivity",
      slug: "business-productivity",
      description:
        "Project management, docs, communication, and ops tools to run your business.",
      icon: "briefcase",
      sort_order: 6,
    },
  ];

  for (const cat of categories) insertCat.run(cat);

  // Tools
  const insertTool = database.prepare(
    `INSERT INTO tools (name, slug, tagline, description, what_it_is, who_its_for, pros, cons, use_cases, pricing_summary, affiliate_url, website_url, image_url, logo_url, category_slug, rating, featured)
     VALUES (@name, @slug, @tagline, @description, @what_it_is, @who_its_for, @pros, @cons, @use_cases, @pricing_summary, @affiliate_url, @website_url, @image_url, @logo_url, @category_slug, @rating, @featured)`
  );

  const tools = [
    {
      name: "Notion",
      slug: "notion",
      tagline: "All-in-one workspace for notes, tasks, wikis, and databases.",
      description:
        "Notion combines notes, tasks, wikis, and databases into one flexible workspace. Teams use it for everything from sprint planning to company knowledge bases.",
      what_it_is:
        "A connected workspace that blends docs, databases, kanban boards, and wikis into a single product. Think of it as Google Docs meets Trello meets Confluence.",
      who_its_for:
        "Startups, remote teams, freelancers, and anyone who wants to consolidate their workflow tools into one place.",
      pros: JSON.stringify([
        "Incredibly flexible — adapts to almost any workflow",
        "Beautiful, clean interface that's a joy to use",
        "Generous free plan for individuals",
        "Excellent template gallery to get started fast",
        "Strong API and integrations ecosystem",
      ]),
      cons: JSON.stringify([
        "Can be slow with very large databases",
        "Offline mode is still limited",
        "Learning curve for advanced database features",
        "Mobile app could be more polished",
      ]),
      use_cases: JSON.stringify([
        "Company wiki and knowledge base",
        "Project management with kanban boards",
        "Personal note-taking and journaling",
        "Content calendar and editorial planning",
        "CRM for small teams",
      ]),
      pricing_summary:
        "Free for individuals. Plus plan at $10/user/month. Business at $18/user/month.",
      affiliate_url: "https://notion.so",
      website_url: "https://notion.so",
      image_url:
        "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=800&auto=format",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
      category_slug: "business-productivity",
      rating: 4.7,
      featured: 1,
    },
    {
      name: "Figma",
      slug: "figma",
      tagline: "Collaborative interface design tool that runs in the browser.",
      description:
        "Figma is the industry-standard design tool for UI/UX teams. Real-time collaboration, powerful prototyping, and a developer handoff workflow make it essential for product teams.",
      what_it_is:
        "A browser-based vector design tool purpose-built for interface design. It supports real-time multiplayer editing, component libraries, auto-layout, prototyping, and developer inspect mode.",
      who_its_for:
        "UI/UX designers, product teams, design systems engineers, and frontend developers who need pixel-perfect specs.",
      pros: JSON.stringify([
        "Best-in-class real-time collaboration",
        "Runs in the browser — no install needed",
        "Powerful auto-layout and component system",
        "Huge plugin ecosystem",
        "Generous free plan for up to 3 projects",
      ]),
      cons: JSON.stringify([
        "Requires internet connection (limited offline)",
        "Can struggle with very large files",
        "Animation capabilities are basic compared to Framer",
        "Owned by Adobe, which concerns some users",
      ]),
      use_cases: JSON.stringify([
        "UI design for web and mobile apps",
        "Design systems and component libraries",
        "Prototyping and user testing",
        "Developer handoff with inspect mode",
        "Wireframing and information architecture",
      ]),
      pricing_summary:
        "Free for up to 3 projects. Professional at $15/editor/month. Organization at $45/editor/month.",
      affiliate_url: "https://figma.com",
      website_url: "https://figma.com",
      image_url:
        "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800&auto=format",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
      category_slug: "design-ux",
      rating: 4.8,
      featured: 1,
    },
    {
      name: "Webflow",
      slug: "webflow",
      tagline: "Visual web development platform — design and launch without code.",
      description:
        "Webflow lets you design, build, and launch responsive websites visually while generating clean, production-ready code under the hood.",
      what_it_is:
        "A visual web development platform that combines a design canvas with a CMS and hosting. It generates semantic HTML, CSS, and JavaScript — no code required, but developers can extend it.",
      who_its_for:
        "Designers who want to ship, marketing teams building landing pages, and agencies delivering client sites fast.",
      pros: JSON.stringify([
        "Professional-grade sites without writing code",
        "Built-in CMS and hosting",
        "Clean, exportable code",
        "Great for marketing sites and landing pages",
        "Strong community and university resources",
      ]),
      cons: JSON.stringify([
        "Steeper learning curve than Wix/Squarespace",
        "CMS has some limitations for complex data",
        "E-commerce features still maturing",
        "Can get expensive at scale",
      ]),
      use_cases: JSON.stringify([
        "Marketing websites and landing pages",
        "Portfolio and agency sites",
        "Blog-driven content sites",
        "Product launch pages",
        "Client work for design agencies",
      ]),
      pricing_summary:
        "Free starter plan. Basic site at $18/month. CMS at $29/month. Business at $49/month.",
      affiliate_url: "https://webflow.com",
      website_url: "https://webflow.com",
      image_url:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/9/92/Webflow_logo.svg",
      category_slug: "no-code",
      rating: 4.5,
      featured: 1,
    },
    {
      name: "Zapier",
      slug: "zapier",
      tagline: "Connect your apps and automate workflows without code.",
      description:
        "Zapier connects 6,000+ apps and automates repetitive tasks with simple if-this-then-that workflows called Zaps.",
      what_it_is:
        "An automation platform that connects web apps through triggers and actions. When something happens in one app (e.g., new form submission), Zapier automatically performs actions in other apps (e.g., add to spreadsheet, send email).",
      who_its_for:
        "Non-technical teams, solopreneurs, ops managers, and anyone tired of copy-pasting data between tools.",
      pros: JSON.stringify([
        "Connects 6,000+ apps — largest integration library",
        "No code required for most workflows",
        "Multi-step Zaps for complex automation",
        "Reliable with good error handling",
        "Generous free tier (100 tasks/month)",
      ]),
      cons: JSON.stringify([
        "Gets expensive at high task volumes",
        "Limited logic and branching on lower plans",
        "Some integrations have limited triggers/actions",
        "Not ideal for real-time or sub-second automation",
      ]),
      use_cases: JSON.stringify([
        "Auto-syncing leads between CRM and email tools",
        "Posting social media content on a schedule",
        "Sending Slack notifications from form submissions",
        "Creating tasks from emails automatically",
        "Syncing data between spreadsheets and databases",
      ]),
      pricing_summary:
        "Free plan with 100 tasks/month. Starter at $29.99/month. Professional at $73.50/month.",
      affiliate_url: "https://zapier.com",
      website_url: "https://zapier.com",
      image_url:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Zapier_logo.svg",
      category_slug: "ai-automation",
      rating: 4.6,
      featured: 0,
    },
    {
      name: "Framer",
      slug: "framer",
      tagline: "Design and publish stunning sites with zero code.",
      description:
        "Framer is a visual site builder with built-in animations, CMS, and publishing — designed for designers who want to ship fast.",
      what_it_is:
        "A design-to-production website builder that emphasizes motion, interactions, and visual polish. It includes a CMS, localization, and SEO tools.",
      who_its_for:
        "Designers, indie hackers, startups building landing pages, and creative professionals who want maximum visual control.",
      pros: JSON.stringify([
        "Beautiful built-in animations and interactions",
        "Extremely fast publishing workflow",
        "Great for landing pages and portfolios",
        "Built-in CMS and SEO tools",
        "Free plan available for personal use",
      ]),
      cons: JSON.stringify([
        "Less flexible CMS than Webflow",
        "Not ideal for large-scale content sites",
        "Smaller community than Figma/Webflow",
        "Code components require React knowledge",
      ]),
      use_cases: JSON.stringify([
        "Startup landing pages",
        "Design portfolios",
        "Product marketing sites",
        "Interactive microsites",
        "Personal brands and blogs",
      ]),
      pricing_summary:
        "Free plan for personal use. Mini at $5/month. Basic at $15/month. Pro at $30/month.",
      affiliate_url: "https://framer.com",
      website_url: "https://framer.com",
      image_url:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Framer_logo.svg",
      category_slug: "design-ux",
      rating: 4.5,
      featured: 0,
    },
    {
      name: "Vercel",
      slug: "vercel",
      tagline: "Frontend cloud — deploy, scale, and ship web apps fast.",
      description:
        "Vercel is the platform behind Next.js. It provides instant deployments, edge functions, and analytics for frontend teams.",
      what_it_is:
        "A cloud platform optimized for frontend frameworks. Push to Git, get a production deployment in seconds with global CDN, serverless functions, and edge runtime.",
      who_its_for:
        "Frontend developers, full-stack JS teams, and startups shipping Next.js, Nuxt, or SvelteKit apps.",
      pros: JSON.stringify([
        "Fastest deployment workflow (push to deploy)",
        "Built by the Next.js team — first-class support",
        "Global edge network for fast load times",
        "Excellent developer experience",
        "Preview deployments for every PR",
      ]),
      cons: JSON.stringify([
        "Can get expensive with heavy serverless usage",
        "Vendor lock-in for some Next.js features",
        "Less suitable for non-JS backends",
        "Bandwidth costs can surprise at scale",
      ]),
      use_cases: JSON.stringify([
        "Deploying Next.js applications",
        "Static sites and JAMstack projects",
        "Full-stack web apps with serverless functions",
        "Preview environments for design reviews",
        "Edge-rendered content sites",
      ]),
      pricing_summary:
        "Free hobby tier. Pro at $20/user/month. Enterprise pricing custom.",
      affiliate_url: "https://vercel.com",
      website_url: "https://vercel.com",
      image_url:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Vercel_logo_black.svg",
      category_slug: "developer",
      rating: 4.7,
      featured: 0,
    },
    {
      name: "Mailchimp",
      slug: "mailchimp",
      tagline: "Email marketing and automation platform for growing businesses.",
      description:
        "Mailchimp is one of the most popular email marketing platforms, offering campaign management, automation, landing pages, and audience analytics.",
      what_it_is:
        "An all-in-one marketing platform centered around email. It includes a drag-and-drop email builder, automation workflows, audience segmentation, landing pages, and analytics.",
      who_its_for:
        "Small businesses, e-commerce brands, content creators, and marketing teams managing email campaigns.",
      pros: JSON.stringify([
        "Easy-to-use drag-and-drop email builder",
        "Free plan for up to 500 contacts",
        "Good automation and segmentation tools",
        "Built-in landing page builder",
        "Extensive integrations with e-commerce platforms",
      ]),
      cons: JSON.stringify([
        "Pricing scales steeply as your list grows",
        "Template customization has limits",
        "Automation is less powerful than dedicated tools like ActiveCampaign",
        "Free plan has Mailchimp branding",
      ]),
      use_cases: JSON.stringify([
        "Newsletter campaigns for content creators",
        "E-commerce order notifications and abandoned cart emails",
        "Drip campaigns for lead nurturing",
        "Product launch announcements",
        "Audience segmentation and A/B testing",
      ]),
      pricing_summary:
        "Free for up to 500 contacts. Essentials at $13/month. Standard at $20/month. Premium at $350/month.",
      affiliate_url: "https://mailchimp.com",
      website_url: "https://mailchimp.com",
      image_url:
        "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&auto=format",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Mailchimp_Logo.svg",
      category_slug: "marketing",
      rating: 4.3,
      featured: 0,
    },
    {
      name: "Bubble",
      slug: "bubble",
      tagline: "Build full-stack web apps visually without code.",
      description:
        "Bubble is the most powerful no-code platform for building complex web applications with databases, workflows, user auth, and APIs.",
      what_it_is:
        "A visual programming platform that lets you build database-driven web apps with user authentication, payment processing, and API integrations — all without code.",
      who_its_for:
        "Non-technical founders, indie makers, MVPs and startups that need to validate fast, and small teams without engineering resources.",
      pros: JSON.stringify([
        "Can build genuinely complex applications",
        "Built-in database and user authentication",
        "Plugin marketplace for extended functionality",
        "Active community and learning resources",
        "Viable for real production apps",
      ]),
      cons: JSON.stringify([
        "Steep learning curve compared to simpler builders",
        "Performance can be an issue at scale",
        "Vendor lock-in — hard to migrate away",
        "Design flexibility requires effort to look polished",
      ]),
      use_cases: JSON.stringify([
        "MVP web applications for startups",
        "Internal business tools and dashboards",
        "Marketplace platforms",
        "SaaS products built without code",
        "Client portals and community platforms",
      ]),
      pricing_summary:
        "Free plan to learn. Starter at $29/month. Growth at $119/month. Team at $349/month.",
      affiliate_url: "https://bubble.io",
      website_url: "https://bubble.io",
      image_url:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Bubble.io_Logo.svg",
      category_slug: "no-code",
      rating: 4.4,
      featured: 0,
    },
  ];

  for (const tool of tools) insertTool.run(tool);

  // ── Additional Tools ──────────────────────────────────────────────────────

  const moreTools = [
    {
      name: "Linear",
      slug: "linear",
      tagline: "Streamlined issue tracking and project management for software teams.",
      description:
        "Linear is the project management tool that software teams actually enjoy using. It's fast, keyboard-driven, and designed around real engineering workflows.",
      what_it_is:
        "A purpose-built issue tracker and project management tool for software teams. Think Jira, but actually fast and beautiful. It has cycles (sprints), roadmaps, project views, and deep Git integrations.",
      who_its_for:
        "Engineering teams, product managers, and startups that want a fast, opinionated project management tool without the bloat of Jira.",
      pros: JSON.stringify([
        "Blazingly fast — feels instant",
        "Keyboard-first design, great for power users",
        "Clean, minimal interface with no clutter",
        "Deep GitHub and GitLab integration",
        "Excellent mobile app",
      ]),
      cons: JSON.stringify([
        "Opinionated — less customizable than Jira",
        "Best suited for software teams (not general project management)",
        "No free plan for teams (only individual)",
        "Reporting features still maturing",
      ]),
      use_cases: JSON.stringify([
        "Sprint planning and issue tracking",
        "Product roadmap management",
        "Bug tracking and triage",
        "Cross-team project coordination",
        "Engineering workflow automation",
      ]),
      pricing_summary:
        "Free for individuals. Standard at $8/user/month. Plus at $14/user/month.",
      affiliate_url: "https://linear.app",
      website_url: "https://linear.app",
      image_url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&auto=format",
      logo_url: "",
      category_slug: "business-productivity",
      rating: 4.8,
      featured: 1,
    },
    {
      name: "Airtable",
      slug: "airtable",
      tagline: "Part spreadsheet, part database — flexible enough for any workflow.",
      description:
        "Airtable is a no-code platform that combines the simplicity of spreadsheets with the power of databases. Build custom apps, automations, and views without code.",
      what_it_is:
        "A cloud-based platform that looks like a spreadsheet but works like a database. It supports linked records, file attachments, automations, and multiple views (grid, kanban, calendar, gallery, Gantt).",
      who_its_for:
        "Operations teams, content managers, project coordinators, and anyone who's outgrown Google Sheets but doesn't need a full database.",
      pros: JSON.stringify([
        "Incredibly flexible — adapts to any use case",
        "Multiple views: grid, kanban, calendar, gallery, Gantt",
        "Built-in automations and integrations",
        "Generous free plan for small teams",
        "Great template library to get started fast",
      ]),
      cons: JSON.stringify([
        "Can get expensive as your records grow",
        "Performance degrades with very large datasets",
        "Automation limits on lower plans",
        "Steep learning curve for advanced features",
      ]),
      use_cases: JSON.stringify([
        "Content calendars and editorial planning",
        "CRM for small businesses",
        "Inventory and asset management",
        "Event planning and coordination",
        "Product catalog management",
      ]),
      pricing_summary:
        "Free for up to 1,000 records. Team at $20/seat/month. Business at $45/seat/month.",
      affiliate_url: "https://airtable.com",
      website_url: "https://airtable.com",
      image_url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format",
      logo_url: "",
      category_slug: "no-code",
      rating: 4.5,
      featured: 0,
    },
    {
      name: "Slack",
      slug: "slack",
      tagline: "Where work happens — team messaging, channels, and integrations.",
      description:
        "Slack is the default communication hub for modern teams. Channels, threads, huddles, and 2,500+ integrations keep conversations organized and searchable.",
      what_it_is:
        "A channel-based messaging platform for teams. It replaces email for internal communication and integrates with virtually every tool in your stack — from GitHub to Figma to Zapier.",
      who_its_for:
        "Remote teams, startups, agencies, and any organization that needs real-time communication with structured channels.",
      pros: JSON.stringify([
        "Excellent channel organization keeps conversations focused",
        "2,500+ integrations with other tools",
        "Huddles for quick audio/video calls",
        "Powerful search across all messages",
        "Generous free plan for small teams",
      ]),
      cons: JSON.stringify([
        "Can become distracting with too many channels",
        "Message history limited on free plan",
        "Gets expensive at scale",
        "Not ideal for deep work — constant notifications",
      ]),
      use_cases: JSON.stringify([
        "Team communication and collaboration",
        "Cross-department coordination",
        "Developer notifications (CI/CD, alerts)",
        "Customer support channels",
        "Community management",
      ]),
      pricing_summary:
        "Free with 90-day message history. Pro at $8.75/user/month. Business+ at $12.50/user/month.",
      affiliate_url: "https://slack.com",
      website_url: "https://slack.com",
      image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800&auto=format",
      logo_url: "",
      category_slug: "business-productivity",
      rating: 4.5,
      featured: 0,
    },
    {
      name: "Stripe",
      slug: "stripe",
      tagline: "Payment infrastructure for the internet — accept payments globally.",
      description:
        "Stripe is the gold standard for online payments. It powers millions of businesses with payment processing, subscriptions, invoicing, and financial infrastructure.",
      what_it_is:
        "A suite of payment APIs and tools that handle everything from one-time charges to complex subscription billing, marketplace payouts, and fraud prevention. Developer-first, but increasingly accessible to non-technical users.",
      who_its_for:
        "SaaS companies, e-commerce businesses, marketplaces, and any developer building payment flows.",
      pros: JSON.stringify([
        "Best-in-class developer experience and documentation",
        "Handles complex billing (subscriptions, metered, usage-based)",
        "Global payment methods (cards, wallets, bank transfers)",
        "Built-in fraud prevention with Radar",
        "No monthly fees — pay per transaction only",
      ]),
      cons: JSON.stringify([
        "Transaction fees can add up at high volume",
        "Dashboard can be overwhelming for beginners",
        "Phone support only on higher plans",
        "Some features require developer involvement",
      ]),
      use_cases: JSON.stringify([
        "SaaS subscription billing",
        "E-commerce payment processing",
        "Marketplace payouts and split payments",
        "Invoicing for B2B companies",
        "Donation and crowdfunding platforms",
      ]),
      pricing_summary:
        "No monthly fee. 2.9% + 30¢ per transaction. Volume discounts available.",
      affiliate_url: "https://stripe.com",
      website_url: "https://stripe.com",
      image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format",
      logo_url: "",
      category_slug: "developer",
      rating: 4.8,
      featured: 1,
    },
    {
      name: "Supabase",
      slug: "supabase",
      tagline: "Open-source Firebase alternative — Postgres, auth, storage, realtime.",
      description:
        "Supabase gives you a Postgres database, authentication, file storage, edge functions, and realtime subscriptions out of the box. It's the backend for developers who don't want vendor lock-in.",
      what_it_is:
        "An open-source Backend-as-a-Service built on top of PostgreSQL. It provides instant APIs (REST and GraphQL), built-in auth, file storage, edge functions, and realtime data sync — all through a clean dashboard.",
      who_its_for:
        "Full-stack developers, indie hackers shipping side projects, and startups that want the speed of Firebase with the power of Postgres.",
      pros: JSON.stringify([
        "Built on Postgres — no proprietary database",
        "Generous free tier (500MB database, 1GB storage)",
        "Built-in auth with social providers",
        "Real-time subscriptions out of the box",
        "Open source — can self-host",
      ]),
      cons: JSON.stringify([
        "Edge functions still maturing",
        "Smaller ecosystem than Firebase",
        "Dashboard can lag with very large datasets",
        "Some advanced Postgres features require SQL knowledge",
      ]),
      use_cases: JSON.stringify([
        "Backend for web and mobile apps",
        "Real-time collaborative applications",
        "Authentication and user management",
        "File storage and image processing",
        "Rapid prototyping and MVPs",
      ]),
      pricing_summary:
        "Free tier with 500MB database. Pro at $25/month. Team at $599/month.",
      affiliate_url: "https://supabase.com",
      website_url: "https://supabase.com",
      image_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format",
      logo_url: "",
      category_slug: "developer",
      rating: 4.7,
      featured: 0,
    },
    {
      name: "ConvertKit",
      slug: "convertkit",
      tagline: "Email marketing built for creators who want to grow their audience.",
      description:
        "ConvertKit (now Kit) is an email platform designed specifically for creators — bloggers, YouTubers, podcasters, and course creators who want to build and monetize an audience.",
      what_it_is:
        "An email marketing platform with visual automations, landing pages, and commerce features. Unlike Mailchimp, it's built around the creator economy — think audience growth, not e-commerce transactions.",
      who_its_for:
        "Content creators, bloggers, newsletter writers, course creators, and solopreneurs building a personal brand.",
      pros: JSON.stringify([
        "Designed specifically for creators (not e-commerce)",
        "Visual automation builder is intuitive",
        "Free plan for up to 10,000 subscribers",
        "Built-in landing pages and forms",
        "Commerce features for selling digital products",
      ]),
      cons: JSON.stringify([
        "Email template editor is more basic than Mailchimp",
        "Reporting could be more detailed",
        "Limited A/B testing on lower plans",
        "No free plan includes automations",
      ]),
      use_cases: JSON.stringify([
        "Newsletter growth and management",
        "Course and digital product launches",
        "Automated email sequences for new subscribers",
        "Landing pages for lead magnets",
        "Audience segmentation by interest",
      ]),
      pricing_summary:
        "Free for up to 10,000 subscribers. Creator at $29/month. Creator Pro at $59/month.",
      affiliate_url: "https://convertkit.com",
      website_url: "https://convertkit.com",
      image_url: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&auto=format",
      logo_url: "",
      category_slug: "marketing",
      rating: 4.5,
      featured: 0,
    },
    {
      name: "Canva",
      slug: "canva",
      tagline: "Design anything — presentations, social posts, videos — in minutes.",
      description:
        "Canva democratized design. With thousands of templates, a drag-and-drop editor, and AI-powered features, anyone can create professional-looking graphics in minutes.",
      what_it_is:
        "A browser-based design platform with templates for everything: social media posts, presentations, logos, videos, documents, websites, and more. It's not Figma — it's for non-designers who need to create things fast.",
      who_its_for:
        "Marketers, social media managers, small business owners, teachers, students, and anyone who needs quick, good-looking design without a design degree.",
      pros: JSON.stringify([
        "Thousands of templates for every use case",
        "Dead simple drag-and-drop interface",
        "AI-powered Magic Design and background removal",
        "Great for social media content at scale",
        "Generous free plan with lots of templates",
      ]),
      cons: JSON.stringify([
        "Not suitable for serious UI/UX design work",
        "Limited customization compared to Figma",
        "Brand consistency can be hard to enforce",
        "Pro features locked behind paid plan",
      ]),
      use_cases: JSON.stringify([
        "Social media graphics and stories",
        "Presentations and pitch decks",
        "Marketing materials and flyers",
        "YouTube thumbnails and video editing",
        "Brand kits and logo creation",
      ]),
      pricing_summary:
        "Free plan with 250,000+ templates. Pro at $13/month. Teams at $30/month for 5 people.",
      affiliate_url: "https://canva.com",
      website_url: "https://canva.com",
      image_url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&auto=format",
      logo_url: "",
      category_slug: "design-ux",
      rating: 4.6,
      featured: 0,
    },
    {
      name: "Make",
      slug: "make",
      tagline: "Visual automation platform for complex, multi-step workflows.",
      description:
        "Make (formerly Integromat) is a visual automation platform that connects apps with powerful branching logic, data transformations, and error handling — more flexible than Zapier for complex workflows.",
      what_it_is:
        "A visual workflow automation tool that lets you connect apps through a drag-and-drop canvas. Unlike Zapier's linear approach, Make uses a visual node editor that supports branching, loops, and complex data transformations.",
      who_its_for:
        "Operations teams, agencies running client automations, power users who need more control than Zapier offers, and anyone building complex multi-step workflows.",
      pros: JSON.stringify([
        "Visual canvas makes complex workflows understandable",
        "More powerful data transformations than Zapier",
        "Better pricing for high-volume automations",
        "Supports branching, loops, and error handling",
        "Free plan with 1,000 operations/month",
      ]),
      cons: JSON.stringify([
        "Steeper learning curve than Zapier",
        "Fewer native integrations (1,500 vs Zapier's 6,000)",
        "Documentation could be better",
        "Interface can feel overwhelming at first",
      ]),
      use_cases: JSON.stringify([
        "Complex multi-step business automations",
        "Data transformation and enrichment pipelines",
        "Agency workflows across client accounts",
        "E-commerce order processing automation",
        "Multi-branch conditional workflows",
      ]),
      pricing_summary:
        "Free with 1,000 operations/month. Core at $10.59/month. Pro at $18.82/month.",
      affiliate_url: "https://make.com",
      website_url: "https://make.com",
      image_url: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&auto=format",
      logo_url: "",
      category_slug: "ai-automation",
      rating: 4.5,
      featured: 0,
    },
    {
      name: "Retool",
      slug: "retool",
      tagline: "Build internal tools fast with a drag-and-drop builder and real code.",
      description:
        "Retool lets you build internal tools (admin panels, dashboards, CRUD apps) by dragging and dropping UI components and connecting them to your databases and APIs.",
      what_it_is:
        "A low-code platform for building internal tools. It provides pre-built UI components (tables, forms, charts) that connect directly to your databases, REST APIs, and GraphQL endpoints. You can write JavaScript for custom logic.",
      who_its_for:
        "Engineering teams building internal tools, ops teams needing admin panels, and companies that want to stop building CRUD apps from scratch.",
      pros: JSON.stringify([
        "Dramatically faster than building from scratch",
        "Connects to any database or API",
        "Pre-built components for common patterns",
        "JavaScript support for custom logic",
        "Self-hosted option for enterprise",
      ]),
      cons: JSON.stringify([
        "Not suitable for customer-facing apps",
        "Free plan limited to 5 users",
        "Requires some technical knowledge",
        "Can feel vendor-locked for critical tools",
      ]),
      use_cases: JSON.stringify([
        "Admin panels and back-office tools",
        "Customer support dashboards",
        "Data entry and management apps",
        "Approval workflows and forms",
        "Internal reporting dashboards",
      ]),
      pricing_summary:
        "Free for up to 5 users. Team at $10/user/month. Business at $50/user/month.",
      affiliate_url: "https://retool.com",
      website_url: "https://retool.com",
      image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format",
      logo_url: "",
      category_slug: "no-code",
      rating: 4.4,
      featured: 0,
    },
    {
      name: "Loom",
      slug: "loom",
      tagline: "Record quick videos to explain anything — async communication made easy.",
      description:
        "Loom lets you record your screen and camera, then instantly share a link. It's the fastest way to explain something without scheduling a meeting.",
      what_it_is:
        "A video messaging tool for async communication. Hit record, walk through your screen, and share a link. Recipients can watch at their own pace, leave timestamped comments, and react with emojis.",
      who_its_for:
        "Remote teams, product managers explaining specs, designers sharing work, customer success teams, and anyone who's tired of typing long explanations.",
      pros: JSON.stringify([
        "Record and share in seconds — zero friction",
        "Built-in viewer analytics (who watched, how much)",
        "Timestamped comments for feedback",
        "AI-powered summaries and transcriptions",
        "Generous free plan (25 videos, 5 min each)",
      ]),
      cons: JSON.stringify([
        "5-minute limit on free plan",
        "Video editing is basic",
        "Not a replacement for proper screen recording tools",
        "Can contribute to 'video overload' if overused",
      ]),
      use_cases: JSON.stringify([
        "Bug reports and technical walkthroughs",
        "Design review and feedback",
        "Onboarding new team members",
        "Sales prospecting with personalized videos",
        "Customer support explanations",
      ]),
      pricing_summary:
        "Free for 25 videos (5 min max). Business at $15/user/month. Enterprise custom.",
      affiliate_url: "https://loom.com",
      website_url: "https://loom.com",
      image_url: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format",
      logo_url: "",
      category_slug: "business-productivity",
      rating: 4.6,
      featured: 0,
    },
  ];

  for (const tool of moreTools) insertTool.run(tool);

  // Posts
  const insertPost = database.prepare(
    `INSERT INTO posts (slug, title, summary, body, featured_image, post_type, category_slug)
     VALUES (@slug, @title, @summary, @body, @featured_image, @post_type, @category_slug)`
  );

  const insertPostTool = database.prepare(
    `INSERT INTO post_tools (post_id, tool_id, sort_order) VALUES (@post_id, @tool_id, @sort_order)`
  );

  // Featured article 1 — No-code roundup
  const post1Id = insertPost.run({
    slug: "best-no-code-tools-2025",
    title: "Best No-Code Tools in 2025",
    summary:
      "A hands-on look at the top no-code platforms for building apps, sites, and workflows — without writing a line of code.",
    body: `No-code tools have matured from toy builders into genuine production platforms. In 2025, you can build SaaS apps, marketplaces, and enterprise dashboards without hiring a developer.

## Why No-Code Matters

The barrier to building software has never been lower. Whether you're a founder validating an idea or a marketer building landing pages, no-code tools let you move at the speed of thought.

## Our Top Picks

### 1. Webflow — Best for Marketing Sites

Webflow gives designers pixel-perfect control over responsive websites with clean code output. Its CMS and hosting are built in, so you can publish directly.

**Best for:** Agencies, designers, and marketing teams building polished websites.

[Try Webflow →](https://webflow.com)

### 2. Bubble — Best for Complex Web Apps

If you need user authentication, a database, and custom workflows — Bubble is the most powerful no-code app builder available.

**Best for:** Non-technical founders and indie makers building MVPs.

[Try Bubble →](https://bubble.io)

### 3. Framer — Best for Landing Pages

Framer excels at beautiful, animation-rich landing pages that you can design and publish in hours, not weeks.

**Best for:** Startups, designers, and product launches.

[Try Framer →](https://framer.com)

## Bottom Line

The "best" no-code tool depends on what you're building. Webflow wins for marketing sites, Bubble for full apps, and Framer for stunning landing pages. Start with the free tiers — they're generous enough to build something real.`,
    featured_image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format",
    post_type: "article",
    category_slug: "no-code",
  }).lastInsertRowid as number;

  // Featured article 2 — AI productivity
  const post2Id = insertPost.run({
    slug: "top-ai-productivity-tools",
    title: "Top AI Productivity Tools That Actually Save Time",
    summary:
      "We tested dozens of AI tools and found the ones that genuinely make you faster — not just flashier.",
    body: `AI tools promise to 10x your productivity. Most don't deliver. We spent weeks testing the most popular options to find the ones that actually save time.

## What We Looked For

- **Real time savings** — not just novelty
- **Integration with existing workflows** — not another silo
- **Reliability** — consistent quality output

## The Tools Worth Using

### Notion AI

Built right into Notion, this AI assistant helps you draft, summarize, brainstorm, and translate within your existing workspace. No context switching.

**Verdict:** The best AI tool is the one embedded in your workflow. Notion AI nails this.

### Zapier + AI

Zapier's AI features let you describe automations in plain English and auto-build Zaps. Combined with their code steps, it's extremely powerful.

**Verdict:** Automation + AI is a force multiplier. If you already use Zapier, the AI upgrades are worth enabling.

## The Honest Take

Most standalone AI productivity tools are solutions looking for problems. The winners are the ones embedded into tools you already use — Notion, Zapier, and your IDE of choice.`,
    featured_image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format",
    post_type: "article",
    category_slug: "ai-automation",
  }).lastInsertRowid as number;

  // Featured article 3 — Design tools for startups
  const post3Id = insertPost.run({
    slug: "best-design-tools-for-startups",
    title: "Best Design Tools for Startups in 2025",
    summary:
      "From wireframes to production — the design stack that startup teams actually need (and can afford).",
    body: `Startups don't need the same design stack as a Fortune 500. You need speed, collaboration, and tools that grow with you. Here's the design toolkit we recommend.

## The Essential Stack

### Figma — Your Design OS

Figma is the undisputed king of collaborative interface design. Every startup should start here. The free plan gives you 3 projects with unlimited collaborators.

**Why it wins:** Real-time collaboration, browser-based, massive plugin ecosystem.

[Try Figma →](https://figma.com)

### Framer — Ship Beautiful Landing Pages Fast

While Figma handles design, Framer handles publishing. Design your landing page visually, add animations, and hit publish. Done.

**Why it wins:** Speed to ship. Most startup landing pages can go from idea to live in a day.

[Try Framer →](https://framer.com)

## What About Sketch, Adobe XD, InVision?

They've lost. Figma won the design tool war by being collaborative, browser-based, and generously free. The market has spoken.

## Our Recommendation

**Figma + Framer** is the optimal design stack for most startups. Figma for design work, Framer for shipping marketing pages. Both have free tiers that are genuinely usable.`,
    featured_image:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format",
    post_type: "article",
    category_slug: "design-ux",
  }).lastInsertRowid as number;

  // Comparison post — Figma vs Framer vs Webflow
  const post4Id = insertPost.run({
    slug: "figma-vs-framer-vs-webflow",
    title: "Figma vs Framer vs Webflow: Which One Should You Use?",
    summary:
      "A detailed comparison of three design/build tools — broken down by use case, strengths, and who each one is really for.",
    body: `Three tools, three different philosophies. Figma is for designing. Framer is for publishing beautiful sites. Webflow is for building production-grade websites. Let's break it down.

## Quick Comparison

| Feature | Figma | Framer | Webflow |
|---------|-------|--------|---------|
| **Primary use** | UI/UX design | Landing pages | Full websites |
| **Code output** | None (design tool) | React-based | HTML/CSS/JS |
| **CMS** | No | Yes (basic) | Yes (powerful) |
| **Animations** | Basic prototyping | Excellent | Good |
| **Collaboration** | Best in class | Good | Good |
| **Free plan** | 3 projects | 1 site | 2 pages |
| **Learning curve** | Medium | Low | High |

## Use Case Breakdown

### Choose Figma if...
You need a dedicated design tool for UI/UX work. Figma is where you ideate, wireframe, build design systems, and hand off to developers. It's not a website builder — it's a design tool.

### Choose Framer if...
You want to go from design to live website as fast as possible. Framer excels at landing pages, portfolios, and marketing microsites with beautiful animations.

### Choose Webflow if...
You're building a content-heavy website with a CMS, blog, or e-commerce. Webflow produces clean, production-ready code and handles complex layouts.

## Winner by Category

- **Best for UI design:** Figma
- **Best for landing pages:** Framer
- **Best for full websites:** Webflow
- **Best for collaboration:** Figma
- **Best free plan:** Figma
- **Best animations:** Framer

## Final Recommendation

These tools aren't competitors — they're complementary. The ideal workflow: **design in Figma, build marketing pages in Framer, build your main site in Webflow**. Most teams will use at least two of these.`,
    featured_image:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format",
    post_type: "comparison",
    category_slug: "design-ux",
  }).lastInsertRowid as number;

  // Additional article — general
  insertPost.run({
    slug: "saas-tools-for-solopreneurs",
    title: "The SaaS Stack for Solopreneurs: 6 Tools Under $50/month",
    summary:
      "Everything you need to run a one-person business — email, site, automation, and analytics — for less than a dinner out.",
    body: `Running a business solo doesn't mean you need enterprise tools. Here's a lean stack that covers everything, with total cost under $50/month.

## The Stack

1. **Notion** ($10/mo) — Your operating system. Notes, tasks, CRM, wiki.
2. **Webflow** ($18/mo) — Your website and blog. No developer needed.
3. **Mailchimp** ($13/mo) — Email marketing with automation.
4. **Zapier** (Free) — Connect everything. 100 tasks/month is enough to start.
5. **Figma** (Free) — Design your brand assets and social graphics.
6. **Vercel** (Free) — If you code, deploy your side projects here.

**Total: $41/month** for a professional, fully automated business stack.

## Why This Stack Works

Each tool is best-in-class for its category, has a generous free or low-cost tier, and plays well with the others. Zapier is the glue that connects them all.

## What's Missing?

Analytics (use Plausible at $9/mo or free Google Analytics), accounting (use Wave for free), and customer support (use Crisp's free plan).

The point isn't to use the most tools. It's to use the fewest tools that cover everything you need.`,
    featured_image:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&auto=format",
    post_type: "article",
    category_slug: "business-productivity",
  });

  // ── More Posts ─────────────────────────────────────────────────────────────

  // Comparison: Notion vs Linear vs Asana
  const post6Id = insertPost.run({
    slug: "notion-vs-linear-vs-asana",
    title: "Notion vs Linear vs Asana: Best Project Management Tool in 2025",
    summary:
      "Three very different approaches to project management. We break down who should use what — and why.",
    body: `Project management tools are deeply personal — the "best" one depends on how your brain works. Here's how Notion, Linear, and Asana compare.

## Quick Comparison

| Feature | Notion | Linear | Asana |
|---------|--------|--------|-------|
| **Best for** | Flexible all-in-one workspace | Engineering teams | Cross-functional teams |
| **Speed** | Good | Blazing fast | Good |
| **Learning curve** | Medium | Low (if you know PM) | Low |
| **Free plan** | Generous | Individual only | Up to 15 users |
| **Customization** | Extreme | Opinionated | Moderate |
| **Integrations** | Good | GitHub-focused | Broad |

## Choose Notion if...

You want one tool for everything — notes, docs, tasks, wikis, and project management. Notion's flexibility is unmatched, but it requires setup time. It's a blank canvas.

**Best for:** Teams who want to consolidate tools. Startups that need docs + tasks + wiki in one place.

## Choose Linear if...

You're a software team that values speed and craft. Linear is opinionated about engineering workflows — cycles, triage, roadmaps — and executes them flawlessly.

**Best for:** Engineering teams. Product teams shipping software. Anyone who finds Jira painful.

## Choose Asana if...

You need a straightforward project management tool for non-engineering teams. Marketing, ops, HR — Asana handles cross-functional work well.

**Best for:** Non-technical teams. Companies with 50+ people. Cross-department projects.

## Our Take

- **Solo or small startup?** Notion — consolidate everything in one place
- **Engineering team?** Linear — nothing else comes close for speed
- **Large or cross-functional team?** Asana — battle-tested and reliable`,
    featured_image: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&auto=format",
    post_type: "comparison",
    category_slug: "business-productivity",
  }).lastInsertRowid as number;

  // Comparison: Zapier vs Make
  const post7Id = insertPost.run({
    slug: "zapier-vs-make-automation",
    title: "Zapier vs Make: Which Automation Platform Should You Use?",
    summary:
      "Zapier is simpler. Make is more powerful. Here's how to decide which automation tool fits your workflow.",
    body: `Both Zapier and Make connect your apps and automate workflows — but they take very different approaches. Zapier is linear and simple. Make is visual and powerful. Let's compare.

## Quick Comparison

| Feature | Zapier | Make |
|---------|--------|------|
| **Approach** | Linear (if-this-then-that) | Visual node canvas |
| **Integrations** | 6,000+ apps | 1,500+ apps |
| **Complexity** | Simple to moderate | Moderate to complex |
| **Free plan** | 100 tasks/month | 1,000 operations/month |
| **Pricing** | Higher per-task cost | Better value at volume |
| **Learning curve** | Very low | Medium |

## Choose Zapier if...

You want the simplest possible automation setup. Zapier's strength is its library — with 6,000+ integrations, you'll find a connection for almost any tool. Simple workflows take minutes to set up.

**Best for:** Non-technical users. Simple 2-3 step automations. Teams that value breadth of integrations.

[Try Zapier →](https://zapier.com)

## Choose Make if...

You need complex workflows with branching, loops, and data transformations. Make's visual canvas makes it easy to understand complex logic, and the pricing is significantly better at volume.

**Best for:** Power users. Agencies managing multiple client automations. Complex multi-branch workflows. Budget-conscious teams with high automation volume.

[Try Make →](https://make.com)

## The Honest Take

Start with Zapier — it's simpler and the free tier is enough to validate. If you hit Zapier's limits (pricing, complexity, or branching needs), switch to Make. Many teams use both.`,
    featured_image: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&auto=format",
    post_type: "comparison",
    category_slug: "ai-automation",
  }).lastInsertRowid as number;

  // Article: Why Every Startup Needs Supabase
  const post8Id = insertPost.run({
    slug: "why-startups-need-supabase",
    title: "Why Every Startup Should Consider Supabase in 2025",
    summary:
      "An open-source backend with Postgres, auth, storage, and realtime — and a free tier that's hard to beat.",
    body: `Firebase got startups to market fast. Supabase gets them to market fast *and* lets them keep their data dignity. Here's why it's become the backend of choice for modern startups.

## What Makes Supabase Different

Supabase is built on PostgreSQL — the world's most trusted relational database. Unlike Firebase's proprietary NoSQL, your data lives in a real database with real SQL. If you ever need to migrate, your data is portable.

## The Free Tier is Genuinely Useful

- 500MB database
- 1GB file storage
- 50,000 monthly active users for auth
- Unlimited API requests

That's enough to build and launch a real product. Many startups run on the free tier for months.

## What You Get Out of the Box

### 1. Instant REST & GraphQL APIs
Point Supabase at your database tables and get auto-generated APIs immediately. No backend code required.

### 2. Built-in Authentication
Email/password, magic links, social providers (Google, GitHub, etc.) — all configured through a dashboard.

### 3. Realtime Subscriptions
Listen to database changes in real-time. Perfect for chat apps, live dashboards, and collaborative features.

### 4. Edge Functions
Deploy serverless functions at the edge for custom logic, webhooks, and background jobs.

## When NOT to Use Supabase

- You need a mature GraphQL API (Hasura might be better)
- You're building a mobile-first app and want offline sync (Firebase still wins here)
- You need complex full-text search (pair Supabase with a dedicated search tool)

## Bottom Line

For most web startups, Supabase is the best backend choice in 2025. It's fast to set up, runs on Postgres, has a generous free tier, and is open source. Start here unless you have a specific reason not to.

[Try Supabase →](https://supabase.com)`,
    featured_image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format",
    post_type: "article",
    category_slug: "developer",
  }).lastInsertRowid as number;

  // Article: Complete Guide to Email Marketing Tools
  const post9Id = insertPost.run({
    slug: "email-marketing-tools-guide",
    title: "The Complete Guide to Email Marketing Tools in 2025",
    summary:
      "Mailchimp vs ConvertKit vs everything else — we break down which email tool fits your business type.",
    body: `Email marketing still has the highest ROI of any channel — $36 for every $1 spent. But the tool you choose matters more than you think. Here's how to pick the right one.

## The Two Philosophies

Email tools generally fall into two camps:

1. **E-commerce focused** (Mailchimp, Klaviyo) — designed around transactions, product recommendations, and purchase behavior
2. **Creator focused** (ConvertKit, Buttondown) — designed around content, audience building, and digital product sales

Pick the wrong camp and you'll fight the tool instead of using it.

## Our Recommendations

### For Creators & Solopreneurs: ConvertKit

ConvertKit was built for people who create content and sell knowledge products. Its visual automation builder is intuitive, and the free plan supports up to 10,000 subscribers.

**Best for:** Bloggers, YouTubers, newsletter writers, course creators.

[Try ConvertKit →](https://convertkit.com)

### For Small Businesses & E-commerce: Mailchimp

Mailchimp is the Swiss Army knife of email marketing. It's not the best at any one thing, but it does everything reasonably well — campaigns, automations, landing pages, and e-commerce integrations.

**Best for:** Small businesses, e-commerce brands, local businesses.

[Try Mailchimp →](https://mailchimp.com)

### For Growth Teams: Custom Stack

If you're a growth-stage startup, you probably want a dedicated tool per function:
- **Resend** or **Postmark** for transactional emails
- **ConvertKit** or **Beehiiv** for newsletters
- **Customer.io** for behavior-based automation

## The Budget Breakdown

| Tool | Free Plan | Paid Starting At | Best For |
|------|-----------|-----------------|----------|
| ConvertKit | 10,000 subscribers | $29/month | Creators |
| Mailchimp | 500 contacts | $13/month | Small business |
| Buttondown | 100 subscribers | $9/month | Simple newsletters |
| Beehiiv | 2,500 subscribers | $49/month | Newsletter businesses |

## Our Take

If you're a creator, start with ConvertKit's free plan. If you're a small business, start with Mailchimp. Don't overthink it — you can always migrate later.`,
    featured_image: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&auto=format",
    post_type: "article",
    category_slug: "marketing",
  }).lastInsertRowid as number;

  // Article: Best Free SaaS Tools
  const post10Id = insertPost.run({
    slug: "best-free-saas-tools-2025",
    title: "15 Best Free SaaS Tools to Start With in 2025",
    summary:
      "You don't need to spend a dime to build a professional toolkit. These free tiers are genuinely usable.",
    body: `The SaaS industry's dirty secret: most tools have free plans that are way more generous than you'd expect. Here are 15 tools you can use for free — no credit card, no trial expiry, no catch.

## Design & Creative

1. **Figma** — 3 projects, unlimited collaborators. The industry-standard design tool, completely free for small teams.
2. **Canva** — 250,000+ templates. Create social graphics, presentations, and marketing materials in minutes.

## Productivity & Project Management

3. **Notion** — Unlimited pages for individuals. Notes, tasks, wikis, databases — all in one workspace.
4. **Linear** — Free for individual use. The fastest issue tracker, built for software teams.
5. **Slack** — Free with 90-day message history. Good enough for small teams starting out.

## Development

6. **Vercel** — Free hobby tier. Deploy Next.js and frontend projects with zero configuration.
7. **Supabase** — 500MB database, auth, storage. A complete backend for your MVP.
8. **Stripe** — No monthly fee, pay only per transaction. Start accepting payments immediately.

## Automation

9. **Zapier** — 100 tasks/month free. Enough for basic automations to validate your workflow.
10. **Make** — 1,000 operations/month free. More generous than Zapier for automation experimentation.

## Marketing

11. **Mailchimp** — 500 contacts free. Email campaigns with basic automation.
12. **ConvertKit** — 10,000 subscribers free. The best free email plan for creators by far.

## Website Building

13. **Webflow** — 2-page starter site. Enough to build a solid landing page.
14. **Framer** — 1 free site. Beautiful, animation-rich landing pages.
15. **Bubble** — Free to learn and build. Only pay when you launch to production.

## The Stack We'd Build for $0/month

Notion (productivity) + Figma (design) + Supabase (backend) + Vercel (hosting) + ConvertKit (email) + Zapier (automation) = **a complete, professional toolkit for literally $0**.

Start free. Upgrade when you outgrow the free tier. That's the whole strategy.`,
    featured_image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format",
    post_type: "article",
    category_slug: "business-productivity",
  }).lastInsertRowid as number;

  // Article: Build Internal Dashboards Without Code
  const post11Id = insertPost.run({
    slug: "build-internal-dashboards-no-code",
    title: "How to Build an Internal Dashboard Without Writing Code",
    summary:
      "Your team needs an admin panel. Here's how to build one in hours instead of weeks — using Retool, Airtable, or Bubble.",
    body: `Every growing company eventually needs internal tools — admin panels, approval workflows, customer dashboards, data entry forms. And every time, the engineering team says "we'll get to it eventually."

Here's how to stop waiting and build them yourself.

## Option 1: Retool — For Database-Connected Dashboards

If you have a database (Postgres, MySQL, MongoDB) and need to build admin panels and dashboards on top of it, Retool is the fastest path.

**How it works:** Drag and drop UI components (tables, forms, charts), connect them to your database, and write simple JavaScript for custom logic.

**Time to build:** Hours, not weeks.
**Best for:** Engineering-adjacent teams who have database access.

[Try Retool →](https://retool.com)

## Option 2: Airtable — For Spreadsheet-Like Workflows

If your data lives in spreadsheets or you're starting from scratch, Airtable gives you a database with multiple views (grid, kanban, calendar, gallery) and built-in automations.

**How it works:** Create tables, add fields, switch between views. Build forms for data entry and automations for notifications.

**Time to build:** Minutes to hours.
**Best for:** Non-technical teams who need structured data management.

[Try Airtable →](https://airtable.com)

## Option 3: Bubble — For Full Custom Applications

If you need something more complex — user authentication, role-based access, custom workflows — Bubble can build it. It's a full no-code app builder.

**How it works:** Design your UI visually, set up database tables, build conditional logic and workflows. It's the most powerful option, but also the steepest learning curve.

**Time to build:** Days.
**Best for:** Teams building complex internal tools that need user auth and workflows.

[Try Bubble →](https://bubble.io)

## Which One Should You Pick?

- **Need a quick dashboard over an existing database?** → Retool
- **Need a flexible spreadsheet-database hybrid?** → Airtable
- **Need a full custom application?** → Bubble

Start with the simplest option that solves your problem. You can always migrate to something more powerful later.`,
    featured_image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format",
    post_type: "article",
    category_slug: "no-code",
  }).lastInsertRowid as number;

  // Comparison: Canva vs Figma
  const post12Id = insertPost.run({
    slug: "canva-vs-figma",
    title: "Canva vs Figma: Which Design Tool is Right for You?",
    summary:
      "They're both design tools, but they solve completely different problems. Here's how to choose.",
    body: `Canva and Figma are both "design tools" — but that's like saying a bicycle and a Ferrari are both "vehicles." They serve completely different purposes.

## Quick Comparison

| Feature | Canva | Figma |
|---------|-------|-------|
| **Primary use** | Marketing graphics, social media | UI/UX design, product design |
| **Skill level** | Anyone can use it | Requires design knowledge |
| **Templates** | 250,000+ | Community-contributed |
| **Collaboration** | Basic | Real-time multiplayer |
| **Prototyping** | No | Yes |
| **Developer handoff** | No | Yes (inspect mode) |
| **Free plan** | Generous | 3 projects |
| **Price** | $13/month | $15/month |

## Choose Canva if...

You need to create marketing materials, social media posts, presentations, or documents — and you're not a designer. Canva's templates make it possible to create professional-looking graphics in minutes.

**Typical users:** Marketers, social media managers, small business owners, students, teachers.

**What you'll build:** Instagram posts, slide decks, flyers, YouTube thumbnails, business cards.

## Choose Figma if...

You're designing user interfaces for websites or apps. Figma is a precision tool for product design — components, auto-layout, prototyping, and developer handoff. It requires design skills but rewards them.

**Typical users:** UI/UX designers, product designers, design systems engineers, frontend developers.

**What you'll build:** App interfaces, design systems, interactive prototypes, website designs.

## Can You Use Both?

Absolutely — and many teams do. Use Figma for product design work (the interface of your app) and Canva for marketing assets (social posts, pitch decks, blog graphics). They complement each other perfectly.

## Our Take

- **Not a designer? → Canva.** It's the fastest way to create something that looks good.
- **Building a product? → Figma.** It's the industry standard for a reason.
- **Both? → Both.** They solve different problems and both have free tiers.`,
    featured_image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&auto=format",
    post_type: "comparison",
    category_slug: "design-ux",
  }).lastInsertRowid as number;

  // Link tools to posts
  const getToolId = database.prepare("SELECT id FROM tools WHERE slug = ?");
  const toolId = (slug: string) =>
    (getToolId.get(slug) as { id: number })?.id;

  // Post 1 — no-code tools
  insertPostTool.run({ post_id: post1Id, tool_id: toolId("webflow"), sort_order: 1 });
  insertPostTool.run({ post_id: post1Id, tool_id: toolId("bubble"), sort_order: 2 });
  insertPostTool.run({ post_id: post1Id, tool_id: toolId("framer"), sort_order: 3 });

  // Post 2 — AI productivity
  insertPostTool.run({ post_id: post2Id, tool_id: toolId("notion"), sort_order: 1 });
  insertPostTool.run({ post_id: post2Id, tool_id: toolId("zapier"), sort_order: 2 });

  // Post 3 — design tools
  insertPostTool.run({ post_id: post3Id, tool_id: toolId("figma"), sort_order: 1 });
  insertPostTool.run({ post_id: post3Id, tool_id: toolId("framer"), sort_order: 2 });

  // Post 4 — comparison (figma vs framer vs webflow)
  insertPostTool.run({ post_id: post4Id, tool_id: toolId("figma"), sort_order: 1 });
  insertPostTool.run({ post_id: post4Id, tool_id: toolId("framer"), sort_order: 2 });
  insertPostTool.run({ post_id: post4Id, tool_id: toolId("webflow"), sort_order: 3 });

  // Post 6 — notion vs linear
  insertPostTool.run({ post_id: post6Id, tool_id: toolId("notion"), sort_order: 1 });
  insertPostTool.run({ post_id: post6Id, tool_id: toolId("linear"), sort_order: 2 });

  // Post 7 — zapier vs make
  insertPostTool.run({ post_id: post7Id, tool_id: toolId("zapier"), sort_order: 1 });
  insertPostTool.run({ post_id: post7Id, tool_id: toolId("make"), sort_order: 2 });

  // Post 8 — supabase
  insertPostTool.run({ post_id: post8Id, tool_id: toolId("supabase"), sort_order: 1 });
  insertPostTool.run({ post_id: post8Id, tool_id: toolId("vercel"), sort_order: 2 });

  // Post 9 — email marketing
  insertPostTool.run({ post_id: post9Id, tool_id: toolId("convertkit"), sort_order: 1 });
  insertPostTool.run({ post_id: post9Id, tool_id: toolId("mailchimp"), sort_order: 2 });

  // Post 10 — best free tools
  insertPostTool.run({ post_id: post10Id, tool_id: toolId("figma"), sort_order: 1 });
  insertPostTool.run({ post_id: post10Id, tool_id: toolId("notion"), sort_order: 2 });
  insertPostTool.run({ post_id: post10Id, tool_id: toolId("vercel"), sort_order: 3 });
  insertPostTool.run({ post_id: post10Id, tool_id: toolId("supabase"), sort_order: 4 });
  insertPostTool.run({ post_id: post10Id, tool_id: toolId("convertkit"), sort_order: 5 });

  // Post 11 — internal dashboards
  insertPostTool.run({ post_id: post11Id, tool_id: toolId("retool"), sort_order: 1 });
  insertPostTool.run({ post_id: post11Id, tool_id: toolId("airtable"), sort_order: 2 });
  insertPostTool.run({ post_id: post11Id, tool_id: toolId("bubble"), sort_order: 3 });

  // Post 12 — canva vs figma
  insertPostTool.run({ post_id: post12Id, tool_id: toolId("canva"), sort_order: 1 });
  insertPostTool.run({ post_id: post12Id, tool_id: toolId("figma"), sort_order: 2 });
}

// ─── Query Functions ─────────────────────────────────────────────────────────

export function getCategories(): Category[] {
  return getDb()
    .prepare("SELECT * FROM categories ORDER BY sort_order ASC")
    .all() as Category[];
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getDb()
    .prepare("SELECT * FROM categories WHERE slug = ?")
    .get(slug) as Category | undefined;
}

export function getTools(): Tool[] {
  return getDb()
    .prepare("SELECT * FROM tools WHERE published = 1 ORDER BY featured DESC, created_at DESC")
    .all() as Tool[];
}

export function getToolsByCategory(categorySlug: string): Tool[] {
  return getDb()
    .prepare(
      "SELECT * FROM tools WHERE published = 1 AND category_slug = ? ORDER BY featured DESC, rating DESC"
    )
    .all(categorySlug) as Tool[];
}

export function getToolBySlug(slug: string): Tool | undefined {
  return getDb()
    .prepare("SELECT * FROM tools WHERE slug = ?")
    .get(slug) as Tool | undefined;
}

export function getFeaturedTools(): Tool[] {
  return getDb()
    .prepare("SELECT * FROM tools WHERE published = 1 AND featured = 1 ORDER BY rating DESC LIMIT 6")
    .all() as Tool[];
}

export function getPosts(): Post[] {
  return getDb()
    .prepare("SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC")
    .all() as Post[];
}

export function getPostsByType(postType: string): Post[] {
  return getDb()
    .prepare(
      "SELECT * FROM posts WHERE published = 1 AND post_type = ? ORDER BY created_at DESC"
    )
    .all(postType) as Post[];
}

export function getPostBySlug(slug: string): Post | undefined {
  return getDb()
    .prepare("SELECT * FROM posts WHERE slug = ?")
    .get(slug) as Post | undefined;
}

export function getPostTools(postId: number): Tool[] {
  return getDb()
    .prepare(
      `SELECT t.* FROM post_tools pt
       JOIN tools t ON t.id = pt.tool_id
       WHERE pt.post_id = ?
       ORDER BY COALESCE(pt.sort_order, t.created_at) ASC`
    )
    .all(postId) as Tool[];
}

export function getFeaturedPosts(limit = 3): Post[] {
  return getDb()
    .prepare(
      "SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC LIMIT ?"
    )
    .all(limit) as Post[];
}

export function getToolsBySlugs(slugs: string[]): Tool[] {
  if (slugs.length === 0) return [];
  const database = getDb();
  const placeholders = slugs.map(() => "?").join(",");
  const tools = database
    .prepare(`SELECT * FROM tools WHERE slug IN (${placeholders}) AND published = 1`)
    .all(...slugs) as Tool[];
  // Preserve the input order
  const bySlug = new Map(tools.map((t) => [t.slug, t]));
  return slugs.map((s) => bySlug.get(s)).filter(Boolean) as Tool[];
}

export function getPostsBySlugs(slugs: string[]): Post[] {
  if (slugs.length === 0) return [];
  const database = getDb();
  const placeholders = slugs.map(() => "?").join(",");
  const posts = database
    .prepare(`SELECT * FROM posts WHERE slug IN (${placeholders}) AND published = 1`)
    .all(...slugs) as Post[];
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  return slugs.map((s) => bySlug.get(s)).filter(Boolean) as Post[];
}

export function saveQuizResponse(data: {
  role: string;
  goals: string[];
  technical: string;
  budget: string;
  workflow: string;
  top_pick_slug: string;
}): number {
  const database = getDb();
  const stmt = database.prepare(
    `INSERT INTO quiz_responses (role, goals, technical, budget, workflow, top_pick_slug)
     VALUES (@role, @goals, @technical, @budget, @workflow, @top_pick_slug)`
  );
  const result = stmt.run({
    role: data.role,
    goals: JSON.stringify(data.goals),
    technical: data.technical,
    budget: data.budget,
    workflow: data.workflow,
    top_pick_slug: data.top_pick_slug,
  });
  return Number(result.lastInsertRowid);
}
