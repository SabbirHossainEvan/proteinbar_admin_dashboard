export type WebsitePageKind = "system" | "custom" | "legal";
export type WebsitePageStatus = "draft" | "published";
export type WebsiteSectionType =
  | "richText"
  | "imageText"
  | "cards"
  | "stats"
  | "testimonials"
  | "faq"
  | "ctaBanner"
  | "contactInfo"
  | "dynamicEmbed";

export interface WebsiteRepeaterItem {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  label?: string;
  link?: string;
  value?: string;
  image?: string;
}

export interface WebsitePageSection {
  id: string;
  sectionKey: string;
  sectionType: WebsiteSectionType;
  isVisible: boolean;
  sortOrder: number;
  heading: string;
  body: string;
  eyebrow?: string;
  image?: string;
  buttonLabel?: string;
  buttonLink?: string;
  items: WebsiteRepeaterItem[];
}

export interface WebsitePageRecord {
  id: string;
  slug: string;
  title: string;
  navLabel: string;
  summary: string;
  kind: WebsitePageKind;
  status: WebsitePageStatus;
  showInTopNav: boolean;
  heroEyebrow?: string;
  heroTitle: string;
  heroSubtitle?: string;
  heroBody: string;
  heroImage?: string;
  heroPrimaryCtaLabel?: string;
  heroPrimaryCtaLink?: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaLink?: string;
  seoTitle: string;
  seoDescription: string;
  sections: WebsitePageSection[];
  updatedAt: string;
}

export interface WebsiteMenuCategoryRecord {
  id: string;
  name: string;
  slug: string;
  intro: string;
  badge?: string;
  sortOrder: number;
  visible: boolean;
  showInTopNav: boolean;
}

export interface WebsiteSettingsRecord {
  id: string;
  siteName: string;
  faviconUrl: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  localeStrategy: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  supportEmail: string;
  supportPhone: string;
  contactAddress: string;
  rtlEnabled: boolean;
}

export interface AdminRoleRecord {
  id: string;
  name: string;
  description: string;
  scopes: string[];
  canPublish: boolean;
  canManageUsers: boolean;
  memberCount: number;
}

export interface BackofficeSnapshot {
  pages: WebsitePageRecord[];
  menuCategories: WebsiteMenuCategoryRecord[];
  settings: WebsiteSettingsRecord;
  roles: AdminRoleRecord[];
}
