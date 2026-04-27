import type {
  AdminRoleRecord,
  WebsiteMenuCategoryRecord,
  WebsitePageRecord,
  WebsitePageSection,
  WebsiteRepeaterItem,
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

const createRepeaterItem = (id: string, title: string, body: string, extra: Partial<WebsiteRepeaterItem> = {}): WebsiteRepeaterItem => ({
  id,
  title,
  body,
  ...extra
});

const createSection = ({
  id,
  heading,
  body,
  image,
  sectionType = "richText",
  eyebrow = "",
  buttonLabel = "",
  buttonLink = "",
  isVisible = true,
  sortOrder = 0,
  items = []
}: {
  id: string;
  heading: string;
  body: string;
  image?: string;
  sectionType?: WebsitePageSection["sectionType"];
  eyebrow?: string;
  buttonLabel?: string;
  buttonLink?: string;
  isVisible?: boolean;
  sortOrder?: number;
  items?: WebsiteRepeaterItem[];
}): WebsitePageSection => ({
  id,
  sectionKey: slugify(heading || id),
  sectionType,
  isVisible,
  sortOrder,
  heading,
  body,
  eyebrow,
  image,
  buttonLabel,
  buttonLink,
  items
});

const createPage = (page: WebsitePageRecord): WebsitePageRecord => ({
  heroEyebrow: "",
  heroSubtitle: "",
  heroPrimaryCtaLabel: "",
  heroPrimaryCtaLink: "",
  heroSecondaryCtaLabel: "",
  heroSecondaryCtaLink: "",
  ...page,
  sections: page.sections.map((section, index) => ({
    items: [],
    eyebrow: "",
    buttonLabel: "",
    buttonLink: "",
    sectionType: "richText",
    isVisible: true,
    sortOrder: index,
    sectionKey: section.heading ? slugify(section.heading) : `section-${index + 1}`,
    ...section
  }))
});

const pages: Record<string, WebsitePageRecord> = {
  home: createPage({
    id: "home",
    slug: "home",
    title: "Home",
    navLabel: "Home",
    summary: "Homepage hero, featured meals, trust points, and CTA sections.",
    kind: "system",
    status: "published",
    showInTopNav: true,
    heroEyebrow: "Fresh every week",
    heroTitle: "Protein-forward meals for busy weeks",
    heroSubtitle: "Flexible pickup, delivery, and meal plans with a real CMS layer for every section.",
    heroBody: "Control hero copy, supporting text, and featured sections from the backoffice.",
    heroImage: "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200",
    heroPrimaryCtaLabel: "Browse plans",
    heroPrimaryCtaLink: "/plans",
    heroSecondaryCtaLabel: "View menu",
    heroSecondaryCtaLink: "/menu",
    seoTitle: "Proteinbar | Healthy Meals & Meal Plans",
    seoDescription: "Fresh meals, flexible plans, and delivery that fits your week.",
    updatedAt: "2026-04-22T10:15:00.000Z",
    sections: [
      createSection({
        id: "home-section-1",
        sectionType: "cards",
        eyebrow: "Why it works",
        heading: "Why customers stay",
        body: "Protein-first recipes, clean ingredients, and easy pickup or delivery every week.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200",
        items: [
          createRepeaterItem("home-card-1", "Chef-built meals", "Rotate weekly favorites without rebuilding the page."),
          createRepeaterItem("home-card-2", "Simple subscriptions", "Keep customers in one repeatable meal-prep flow."),
          createRepeaterItem("home-card-3", "Store + website aligned", "Ops modules and CMS content stay connected.")
        ]
      }),
      createSection({
        id: "home-section-2",
        sectionType: "testimonials",
        heading: "Featured weekly drops",
        body: "Highlight meal-prep launches, promo banners, or chef specials here.",
        buttonLabel: "See weekly menu",
        buttonLink: "/menu",
        items: [
          createRepeaterItem("home-testimonial-1", "Samira R.", "The admin now lets us refresh homepage highlights without touching code.", { subtitle: "Weekly subscriber" }),
          createRepeaterItem("home-testimonial-2", "Marcus T.", "Plan updates and menu messaging finally feel coordinated.", { subtitle: "Meal-prep customer" })
        ]
      })
    ]
  }),
  locations: createPage({
    id: "locations",
    slug: "locations",
    title: "Locations",
    navLabel: "Locations",
    summary: "Hero content and supporting notes around data-driven location listings.",
    kind: "system",
    status: "published",
    showInTopNav: true,
    heroEyebrow: "Pickup and delivery",
    heroTitle: "Find the most convenient Proteinbar location",
    heroSubtitle: "Keep the hero and support messaging editable while location entities stay data-driven.",
    heroBody: "This page wraps your delivery zones, pickup points, and customer reassurance content.",
    heroImage: "https://images.unsplash.com/photo-1481833761820-0509d3217039?w=1200",
    seoTitle: "Proteinbar Locations",
    seoDescription: "Pickup points, delivery zones, and branch guidance.",
    updatedAt: "2026-04-24T09:00:00.000Z",
    sections: [
      createSection({
        id: "locations-section-1",
        sectionType: "richText",
        heading: "Before you order",
        body: "Use this section for delivery notes, pickup timing, or branch-specific reminders."
      })
    ]
  }),
  menu: createPage({
    id: "menu",
    slug: "menu",
    title: "Menu",
    navLabel: "Menu",
    summary: "Hero content and helper copy around the live menu module.",
    kind: "system",
    status: "published",
    showInTopNav: true,
    heroEyebrow: "Built around real inventory",
    heroTitle: "Browse the menu without losing operational control",
    heroSubtitle: "Categories and items stay data-driven while page-level storytelling stays editable.",
    heroBody: "Use this page to manage the menu hero, intro notes, and CTA messaging around the existing menu experience.",
    heroImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200",
    heroPrimaryCtaLabel: "Start order",
    heroPrimaryCtaLink: "/menu",
    seoTitle: "Proteinbar Menu",
    seoDescription: "Browse categories, featured meals, and restaurant-specific menu options.",
    updatedAt: "2026-04-24T09:10:00.000Z",
    sections: [
      createSection({
        id: "menu-section-1",
        sectionType: "ctaBanner",
        heading: "Need help choosing?",
        body: "Add helper copy above the menu grid for location filters, notes, or chef suggestions.",
        buttonLabel: "See meal plans",
        buttonLink: "/plans"
      })
    ]
  }),
  "about-us": createPage({
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
      createSection({
        id: "about-section-1",
        sectionType: "imageText",
        heading: "Our philosophy",
        body: "Food should be practical, macro-aware, and genuinely enjoyable.",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200"
      }),
      createSection({
        id: "about-section-2",
        sectionType: "stats",
        heading: "What we stand for",
        body: "Use this section for values, milestones, or sourcing proof points.",
        items: [
          createRepeaterItem("about-stat-1", "Meals delivered", "", { value: "250K+" }),
          createRepeaterItem("about-stat-2", "Repeat customers", "", { value: "68%" }),
          createRepeaterItem("about-stat-3", "Active pickup points", "", { value: "12" })
        ]
      })
    ]
  }),
  contact: createPage({
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
      createSection({
        id: "contact-section-1",
        sectionType: "contactInfo",
        heading: "Support hours",
        body: "Mon-Sat, 9:00 AM to 7:00 PM. Fastest help through WhatsApp and phone.",
        items: [
          createRepeaterItem("contact-item-1", "Phone", "+1 202 555 0199", { label: "Call now", link: "tel:+12025550199" }),
          createRepeaterItem("contact-item-2", "Email", "support@proteinbar.com", { label: "Send email", link: "mailto:support@proteinbar.com" })
        ]
      })
    ]
  }),
  "meal-prep": createPage({
    id: "meal-prep",
    slug: "meal-prep",
    title: "Meal Prep",
    navLabel: "Meal Prep",
    summary: "Page-level content around the existing monthly plans and meal-prep flow.",
    kind: "system",
    status: "published",
    showInTopNav: true,
    heroEyebrow: "Subscription-friendly nutrition",
    heroTitle: "Turn the meal-prep flow into a CMS-managed landing page",
    heroSubtitle: "Plan logic stays operational while the page hero, support copy, and CTAs stay editable.",
    heroBody: "Use this page for hero messaging, intro copy, FAQs, and conversion nudges around the existing plan builder.",
    heroImage: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=1200",
    heroPrimaryCtaLabel: "Choose a plan",
    heroPrimaryCtaLink: "/plans",
    seoTitle: "Proteinbar Meal Prep Plans",
    seoDescription: "Meal-prep subscriptions, flexible plan options, and onboarding copy.",
    updatedAt: "2026-04-24T09:30:00.000Z",
    sections: [
      createSection({
        id: "meal-prep-section-1",
        sectionType: "faq",
        heading: "Most common questions",
        body: "Keep the page-level onboarding and FAQ editable without altering plan rules.",
        items: [
          createRepeaterItem("meal-prep-faq-1", "How often can customers pause?", "Pause rules still come from operational settings; this block controls how you explain them."),
          createRepeaterItem("meal-prep-faq-2", "Can I switch pickup to delivery?", "Use this answer space for your current logistics policy.")
        ]
      })
    ]
  }),
  terms: createPage({
    id: "terms",
    slug: "terms-and-conditions",
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
      createSection({
        id: "terms-section-1",
        heading: "Orders and fulfillment",
        body: "All meals are prepared based on availability, delivery window, and payment confirmation."
      }),
      createSection({
        id: "terms-section-2",
        heading: "Subscription rules",
        body: "Subscriptions may be paused based on cutoff rules set in the backoffice."
      })
    ]
  }),
  privacy: createPage({
    id: "privacy",
    slug: "privacy-policy",
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
      createSection({
        id: "privacy-section-1",
        heading: "What we collect",
        body: "We collect account details, order history, delivery preferences, and support messages."
      })
    ]
  })
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
    allowedPages: ["/admin", "/admin/users-permissions", "/admin/profile", "/admin/website"],
    canPublish: true,
    canManageUsers: true,
    memberCount: 2
  },
  "role-ops": {
    id: "role-ops",
    name: "Operations Manager",
    description: "Focuses on subscriptions, daily orders, labels, and locations.",
    scopes: ["orders", "subscriptions", "locations", "printing"],
    allowedPages: ["/admin", "/admin/orders", "/admin/subscriptions", "/admin/locations", "/admin/profile"],
    canPublish: false,
    canManageUsers: false,
    memberCount: 5
  },
  "role-content": {
    id: "role-content",
    name: "Content Manager",
    description: "Owns website pages, menu category visibility, and legal content.",
    scopes: ["website-pages", "menu-categories", "legal-pages"],
    allowedPages: ["/admin", "/admin/website-pages", "/admin/header-navigation", "/admin/profile"],
    canPublish: true,
    canManageUsers: false,
    memberCount: 4
  }
};

const clonePage = (page: WebsitePageRecord): WebsitePageRecord => ({
  ...page,
  sections: page.sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({ ...item }))
  }))
});

const cloneCategory = (category: WebsiteMenuCategoryRecord): WebsiteMenuCategoryRecord => ({ ...category });
const cloneRole = (role: AdminRoleRecord): AdminRoleRecord => ({ ...role, scopes: [...role.scopes], allowedPages: [...role.allowedPages] });
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
      heroEyebrow: payload.heroEyebrow?.trim() ?? "",
      heroTitle: payload.heroTitle.trim(),
      heroSubtitle: payload.heroSubtitle?.trim() ?? "",
      heroBody: payload.heroBody.trim(),
      heroPrimaryCtaLabel: payload.heroPrimaryCtaLabel?.trim() ?? "",
      heroPrimaryCtaLink: payload.heroPrimaryCtaLink?.trim() ?? "",
      heroSecondaryCtaLabel: payload.heroSecondaryCtaLabel?.trim() ?? "",
      heroSecondaryCtaLink: payload.heroSecondaryCtaLink?.trim() ?? "",
      seoTitle: payload.seoTitle.trim(),
      seoDescription: payload.seoDescription.trim(),
      sections: payload.sections
        .map((section, index) => ({
        ...section,
        id: section.id || `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sectionKey: slugify(section.sectionKey || section.heading || `section-${index + 1}`),
        sectionType: section.sectionType ?? "richText",
        isVisible: section.isVisible ?? true,
        sortOrder: Number.isFinite(section.sortOrder) ? section.sortOrder : index,
        heading: section.heading.trim(),
        body: section.body.trim(),
        eyebrow: section.eyebrow?.trim() ?? "",
        buttonLabel: section.buttonLabel?.trim() ?? "",
        buttonLink: section.buttonLink?.trim() ?? "",
        items: section.items.map((item) => ({
          ...item,
          id: item.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: item.title.trim(),
          subtitle: item.subtitle?.trim() ?? "",
          body: item.body?.trim() ?? "",
          label: item.label?.trim() ?? "",
          link: item.link?.trim() ?? "",
          value: item.value?.trim() ?? "",
          image: item.image?.trim() ?? ""
        }))
      }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
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
      scopes: payload.scopes.map((scope) => scope.trim()).filter(Boolean),
      allowedPages: payload.allowedPages.map((page) => page.trim()).filter(Boolean)
    };
    roles[id] = nextRole;
    return wait(cloneRole(nextRole));
  },

  async deleteAdminRole(id: string): Promise<{ id: string }> {
    delete roles[id];
    return wait({ id });
  }
};
