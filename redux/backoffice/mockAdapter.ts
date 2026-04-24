import type {
  AdminRoleRecord,
  WebsiteMenuCategoryRecord,
  WebsitePageRecord,
  WebsiteSettingsRecord
} from "./types";

const wait = async <T>(value: T, ms = 140) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

const nowIso = () => new Date().toISOString();

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `page-${Date.now()}`;

const pages: Record<string, WebsitePageRecord> = {
  home: {
    id: "home",
    slug: "home",
    title: "Home",
    navLabel: "Home",
    summary: "Homepage hero, featured meals, trust points, and CTA sections.",
    kind: "system",
    status: "published",
    showInTopNav: true,
    heroTitle: "Protein-forward meals for busy weeks",
    heroBody: "Control hero copy, supporting text, and featured sections from the backoffice.",
    heroImage: "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200",
    seoTitle: "Proteinbar | Healthy Meals & Meal Plans",
    seoDescription: "Fresh meals, flexible plans, and delivery that fits your week.",
    updatedAt: "2026-04-22T10:15:00.000Z",
    sections: [
      {
        id: "home-section-1",
        heading: "Why customers stay",
        body: "Protein-first recipes, clean ingredients, and easy pickup or delivery every week.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200"
      },
      {
        id: "home-section-2",
        heading: "Featured weekly drops",
        body: "Highlight meal-prep launches, promo banners, or chef specials here."
      }
    ]
  },
  restaurants: {
    id: "restaurants",
    slug: "restaurants",
    title: "Restaurants",
    navLabel: "Restaurants",
    summary: "Public restaurant listing, branch descriptions, and display imagery.",
    kind: "system",
    status: "published",
    showInTopNav: true,
    heroTitle: "Browse every Proteinbar location",
    heroBody: "Show branch highlights, opening windows, pickup details, and featured menus.",
    heroImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200",
    seoTitle: "Proteinbar Restaurants",
    seoDescription: "Explore branches, opening hours, and menu highlights.",
    updatedAt: "2026-04-22T11:05:00.000Z",
    sections: [
      {
        id: "restaurants-section-1",
        heading: "Branch spotlight",
        body: "Use this section for neighborhood copy and hero gallery text."
      }
    ]
  },
  "about-us": {
    id: "about-us",
    slug: "about-us",
    title: "About Us",
    navLabel: "About Us",
    summary: "Brand story, mission, sourcing promises, and team content.",
    kind: "system",
    status: "published",
    showInTopNav: true,
    heroTitle: "Built for better everyday eating",
    heroBody: "Share your story, process, and what makes the brand trustworthy.",
    heroImage: "https://images.unsplash.com/photo-1528712306091-ed0763094c98?w=1200",
    seoTitle: "About Proteinbar",
    seoDescription: "Learn how Proteinbar builds healthy meal routines for real life.",
    updatedAt: "2026-04-21T16:20:00.000Z",
    sections: [
      {
        id: "about-section-1",
        heading: "Our philosophy",
        body: "Food should be practical, macro-aware, and genuinely enjoyable."
      }
    ]
  },
  contact: {
    id: "contact",
    slug: "contact",
    title: "Contact",
    navLabel: "Contact",
    summary: "Support channels, contact copy, addresses, and CTA blocks.",
    kind: "system",
    status: "published",
    showInTopNav: true,
    heroTitle: "Need help with an order or plan?",
    heroBody: "Control support copy, office hours, WhatsApp text, and contact blocks.",
    heroImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200",
    seoTitle: "Contact Proteinbar",
    seoDescription: "Reach Proteinbar for support, partnerships, or branch questions.",
    updatedAt: "2026-04-23T08:40:00.000Z",
    sections: [
      {
        id: "contact-section-1",
        heading: "Support hours",
        body: "Mon-Sat, 9:00 AM to 7:00 PM. Fastest help through WhatsApp and phone."
      }
    ]
  },
  terms: {
    id: "terms",
    slug: "terms",
    title: "Terms & Conditions",
    navLabel: "Terms",
    summary: "Legal terms for website use, ordering, delivery, and subscriptions.",
    kind: "legal",
    status: "published",
    showInTopNav: false,
    heroTitle: "Terms & Conditions",
    heroBody: "Control the legal text shown across the public website.",
    seoTitle: "Proteinbar Terms & Conditions",
    seoDescription: "Read the ordering, delivery, and subscription terms.",
    updatedAt: "2026-04-20T13:00:00.000Z",
    sections: [
      {
        id: "terms-section-1",
        heading: "Orders and fulfillment",
        body: "All meals are prepared based on availability, delivery window, and payment confirmation."
      },
      {
        id: "terms-section-2",
        heading: "Subscription rules",
        body: "Subscriptions may be paused based on cutoff rules set in the backoffice."
      }
    ]
  },
  privacy: {
    id: "privacy",
    slug: "privacy",
    title: "Privacy Policy",
    navLabel: "Privacy",
    summary: "Privacy disclosures for customer accounts, contact data, and order history.",
    kind: "legal",
    status: "published",
    showInTopNav: false,
    heroTitle: "Privacy Policy",
    heroBody: "Manage customer-data policy copy and compliance text here.",
    seoTitle: "Proteinbar Privacy Policy",
    seoDescription: "Understand how Proteinbar stores and uses customer data.",
    updatedAt: "2026-04-20T13:15:00.000Z",
    sections: [
      {
        id: "privacy-section-1",
        heading: "What we collect",
        body: "We collect account details, order history, delivery preferences, and support messages."
      }
    ]
  }
};

const menuCategories: Record<string, WebsiteMenuCategoryRecord> = {
  breakfast: {
    id: "breakfast",
    name: "Breakfast",
    slug: "breakfast",
    intro: "Morning meals and lighter starts.",
    badge: "Popular",
    sortOrder: 1,
    visible: true,
    showInTopNav: true
  },
  lunch: {
    id: "lunch",
    name: "Lunch",
    slug: "lunch",
    intro: "Balanced midday protein bowls and wraps.",
    sortOrder: 2,
    visible: true,
    showInTopNav: true
  },
  dinner: {
    id: "dinner",
    name: "Dinner",
    slug: "dinner",
    intro: "Heavier evening plates for meal-prep customers.",
    sortOrder: 3,
    visible: true,
    showInTopNav: true
  },
  snacks: {
    id: "snacks",
    name: "Snacks",
    slug: "snacks",
    intro: "Boosters, shakes, and add-on bites.",
    sortOrder: 4,
    visible: true,
    showInTopNav: false
  }
};

let websiteSettings: WebsiteSettingsRecord = {
  id: "website-settings",
  siteName: "Proteinbar",
  faviconUrl: "/favicon.ico",
  defaultLanguage: "English",
  supportedLanguages: ["English", "Arabic"],
  localeStrategy: "Subpath routing (/en, /ar)",
  defaultMetaTitle: "Proteinbar | Healthy Meals & Meal Plans",
  defaultMetaDescription: "Healthy meals, flexible plans, and reliable pickup or delivery.",
  supportEmail: "support@proteinbar.com",
  supportPhone: "+1 202 555 0199",
  contactAddress: "122 Market St, New York, NY",
  rtlEnabled: false
};

const roles: Record<string, AdminRoleRecord> = {
  "role-super-admin": {
    id: "role-super-admin",
    name: "Super Admin",
    description: "Full access to content, operations, pricing, and users.",
    scopes: ["website-pages", "orders", "subscriptions", "settings", "users"],
    canPublish: true,
    canManageUsers: true,
    memberCount: 2
  },
  "role-ops": {
    id: "role-ops",
    name: "Operations Manager",
    description: "Focuses on subscriptions, daily orders, labels, and locations.",
    scopes: ["orders", "subscriptions", "locations", "printing"],
    canPublish: false,
    canManageUsers: false,
    memberCount: 5
  },
  "role-content": {
    id: "role-content",
    name: "Content Manager",
    description: "Owns website pages, menu category visibility, and legal content.",
    scopes: ["website-pages", "menu-categories", "legal-pages"],
    canPublish: true,
    canManageUsers: false,
    memberCount: 4
  }
};

const clonePage = (page: WebsitePageRecord): WebsitePageRecord => ({
  ...page,
  sections: page.sections.map((section) => ({ ...section }))
});

const cloneCategory = (category: WebsiteMenuCategoryRecord): WebsiteMenuCategoryRecord => ({ ...category });
const cloneRole = (role: AdminRoleRecord): AdminRoleRecord => ({ ...role, scopes: [...role.scopes] });
const cloneSettings = (settings: WebsiteSettingsRecord): WebsiteSettingsRecord => ({
  ...settings,
  supportedLanguages: [...settings.supportedLanguages]
});

export const backofficeMockAdapter = {
  async listWebsitePages(): Promise<WebsitePageRecord[]> {
    return wait(
      Object.values(pages)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(clonePage)
    );
  },

  async getWebsitePageBySlug(slug: string): Promise<WebsitePageRecord | null> {
    const page = Object.values(pages).find((item) => item.slug === slug);
    return wait(page ? clonePage(page) : null);
  },

  async upsertWebsitePage(payload: WebsitePageRecord): Promise<WebsitePageRecord> {
    const id = payload.id || `page-${Date.now()}`;
    const slug = payload.slug?.trim() ? slugify(payload.slug) : slugify(payload.title);
    const nextPage: WebsitePageRecord = {
      ...clonePage({
        ...payload,
        id,
        slug,
        updatedAt: nowIso()
      }),
      title: payload.title.trim(),
      navLabel: payload.navLabel.trim() || payload.title.trim(),
      summary: payload.summary.trim(),
      heroTitle: payload.heroTitle.trim(),
      heroBody: payload.heroBody.trim(),
      seoTitle: payload.seoTitle.trim(),
      seoDescription: payload.seoDescription.trim(),
      sections: payload.sections.map((section) => ({
        ...section,
        id: section.id || `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        heading: section.heading.trim(),
        body: section.body.trim()
      }))
    };

    pages[id] = nextPage;
    return wait(clonePage(nextPage));
  },

  async deleteWebsitePage(id: string): Promise<{ id: string }> {
    delete pages[id];
    return wait({ id });
  },

  async listWebsiteMenuCategories(): Promise<WebsiteMenuCategoryRecord[]> {
    return wait(
      Object.values(menuCategories)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(cloneCategory)
    );
  },

  async upsertWebsiteMenuCategory(payload: WebsiteMenuCategoryRecord): Promise<WebsiteMenuCategoryRecord> {
    const id = payload.id || `category-${Date.now()}`;
    const nextCategory: WebsiteMenuCategoryRecord = {
      ...payload,
      id,
      slug: slugify(payload.slug || payload.name),
      name: payload.name.trim(),
      intro: payload.intro.trim(),
      sortOrder: Number(payload.sortOrder) || 1
    };
    menuCategories[id] = nextCategory;
    return wait(cloneCategory(nextCategory));
  },

  async deleteWebsiteMenuCategory(id: string): Promise<{ id: string }> {
    delete menuCategories[id];
    return wait({ id });
  },

  async getWebsiteSettings(): Promise<WebsiteSettingsRecord> {
    return wait(cloneSettings(websiteSettings));
  },

  async updateWebsiteSettings(patch: Partial<WebsiteSettingsRecord>): Promise<WebsiteSettingsRecord> {
    websiteSettings = {
      ...websiteSettings,
      ...patch,
      supportedLanguages: patch.supportedLanguages ? [...patch.supportedLanguages] : websiteSettings.supportedLanguages
    };
    return wait(cloneSettings(websiteSettings));
  },

  async listAdminRoles(): Promise<AdminRoleRecord[]> {
    return wait(
      Object.values(roles)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(cloneRole)
    );
  },

  async upsertAdminRole(payload: AdminRoleRecord): Promise<AdminRoleRecord> {
    const id = payload.id || `role-${Date.now()}`;
    const nextRole: AdminRoleRecord = {
      ...payload,
      id,
      name: payload.name.trim(),
      description: payload.description.trim(),
      scopes: payload.scopes.map((scope) => scope.trim()).filter(Boolean)
    };
    roles[id] = nextRole;
    return wait(cloneRole(nextRole));
  },

  async deleteAdminRole(id: string): Promise<{ id: string }> {
    delete roles[id];
    return wait({ id });
  }
};
