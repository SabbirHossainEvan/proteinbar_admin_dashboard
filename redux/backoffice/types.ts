export type WebsitePageKind = "system" | "custom" | "legal";
export type WebsitePageStatus = "draft" | "published";

export interface WebsitePageSection {
  id: string;
  heading: string;
  body: string;
  image?: string;
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
  heroTitle: string;
  heroBody: string;
  heroImage?: string;
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
