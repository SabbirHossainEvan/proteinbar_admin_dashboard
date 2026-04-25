export type AdminNavItem = {
  href: string;
  label: string;
  description?: string;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    title: "Dashboard",
    items: [{ href: "/admin", label: "Dashboard", description: "Overview and quick jumps." }]
  },
  {
    title: "Restaurants Menus",
    items: [
      { href: "/admin/menu", label: "Restaurants Menus", description: "Client-facing menu cards and visibility rules." },
      { href: "/admin/products", label: "Add Product", description: "SKU-level catalog items." },
      { href: "/admin/menu-categories", label: "Menu Categories", description: "Organize restaurant-facing menu groups." },
      { href: "/admin/restaurants", label: "Restaurants", description: "Manage branches shown on the website." }
    ]
  },
  {
    title: "Mealprep Menus",
    items: [
      { href: "/admin/meal-prep-menus", label: "Meal Prep Menus", description: "Weekly menu themes and production windows." },
      { href: "/admin/monthly-plans", label: "Meal Plans", description: "Create and manage meal plans with frequency rules." },
      { href: "/admin/meal-library", label: "Meal Library", description: "Meal creation, variants, and add-ons." },
      { href: "/admin/custom-plan-food-items", label: "Custom Food Items", description: "Custom flow item options." },
      { href: "/admin/custom-plan-categories", label: "Custom Categories", description: "Custom flow categories and selection logic." }
    ]
  },
  {
    title: "Mealprep Management",
    items: [
      { href: "/admin/meal-prep-management", label: "Meal Prep Management", description: "Operational hub for day-to-day work." },
      { href: "/admin/orders", label: "Orders", description: "Daily and subscription order management." },
      { href: "/admin/subscriptions", label: "Subscriptions", description: "Track remaining time and pause, resume, or cancel plans." },
      { href: "/admin/orders-day-printing", label: "Orders of the Day & Printing", description: "Kitchen sheets, labels, and dispatch printing." },
      { href: "/admin/locations", label: "Pickup & Delivery Areas", description: "Add and manage which areas support pickup, delivery, or both." },
      { href: "/admin/promo-codes", label: "Promo Codes", description: "Offers, expiry, and eligibility." },
      { href: "/admin/customers", label: "Clients", description: "Database of all past clients." }
    ]
  },
  {
    title: "Website Pages",
    items: [
      { href: "/admin/website-pages", label: "Pages Overview", description: "Manage public content and navigation surfaces." },
      { href: "/admin/website-pages/pages", label: "Pages", description: "Create, edit, publish, and archive website pages." },
      { href: "/admin/website-pages/home", label: "Home", description: "Homepage text, imagery, and section content." },
      { href: "/admin/website-pages/menu", label: "Menu", description: "Hero, helper copy, and CTA content around the live menu." },
      { href: "/admin/website-pages/locations", label: "Locations", description: "Hero and supporting content for public location pages." },
      { href: "/admin/website-pages/meal-prep", label: "Meal Prep", description: "Page-level content for the meal-prep and plan builder flow." },
      { href: "/admin/website-pages/about-us", label: "About Us", description: "Brand story and trust-building content." },
      { href: "/admin/website-pages/contact", label: "Contact", description: "Support details, CTA blocks, and contact copy." }
    ]
  },
  {
    title: "Settings",
    items: [
      { href: "/admin/profile", label: "Profile", description: "Your admin account settings." },
      { href: "/admin/website", label: "Website", description: "Favicon, language, locale, and support basics." },
      { href: "/admin/users-permissions", label: "Users & Permissions", description: "Access roles and admin rights." }
    ]
  }
];

export const adminPageTitleMap = Object.fromEntries(
  adminNavSections.flatMap((section) => section.items.map((item) => [item.href, item.label]))
) as Record<string, string>;
