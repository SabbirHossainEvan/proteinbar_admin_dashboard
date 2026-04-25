# Proteinbar Full Website Review + Admin Control Prompt

## 1. Goal

This document is prepared after reviewing the current Proteinbar frontend so the full website can be controlled from the existing admin dashboard.

Main goal:

- Every major website page should be editable from admin
- Hero image should be changeable from admin
- Section titles, subtitles, descriptions, CTA labels, CTA links, cards, stats, contact info, and repeated content blocks should be editable from admin
- Existing dynamic modules like menu, locations, and monthly plans should remain connected to API data, but their page-level content should also be admin-manageable
- Admin should behave like a real CMS, not just a settings panel
- Existing admin dashboard features should remain unchanged and this CMS capability should be added on top of the current dashboard

Target pages:

- Home
- Locations
- Menu
- About Us
- Contact Us
- Meal Prep / Monthly Plans
- Shared global content like Header, Footer, legal links, and contact info

## 2. Current Website Review

Based on the current codebase, the website is a mix of:

- Hardcoded frontend content
- API-driven menu/locations/monthly plans
- Static images from `public/`

### Current content status by page

#### Home

Home page is composed of many separate sections:

- `components/home/HeroSection.tsx`
- `components/home/IntroStatementSection.tsx`
- `components/home/LocationsPreviewSection.tsx`
- `components/home/MissionSection.tsx`
- `components/home/ExperienceSection.tsx`
- `components/home/BrandValuesSection.tsx`
- `components/home/HealthyCustomersSection.tsx`
- `components/home/TestimonialsSection.tsx`

Current state:

- Hero text is hardcoded
- Hero image is hardcoded
- CTA labels and links are hardcoded
- Intro paragraph is hardcoded
- Several supporting sections are likely hardcoded or static-image based
- Locations preview partially uses API, but section heading structure is still frontend-controlled

#### Locations

Main files:

- `app/pages/locations/page.tsx`
- `components/locations/LocationsHeroSection.tsx`
- `components/locations/LocationsDeliverySection.tsx`
- `components/locations/LocationsShowcaseSection.tsx`

Current state:

- Hero title, label, and hero image are hardcoded
- Remaining location data and sections already exist
- Only the hero area needs CMS/admin control

#### Menu

Main files:

- `app/pages/menu/ManuPageContainer.tsx`
- `components/menu/MenuHeroSection.tsx`
- `components/menu/MenuCategoryJumpSection.tsx`
- `components/menu/MenuLocationModal.tsx`

Current state:

- Menu categories and items are API-driven
- Restaurant filtering is API-driven
- Hero section content is still frontend-defined
- Remaining menu functionality and data already exist
- Only the hero area needs CMS/admin control

#### About Us

Main files:

- `app/pages/about-us/page.tsx`
- `components/about/AboutHeroSection.tsx`
- `components/about/AboutStorySection.tsx`

Current state:

- Hero title, subtitle/eyebrow, and image are hardcoded
- Story section title, paragraph, and image are hardcoded
- Shared testimonial/customer sections appear reused from Home, so they are not page-specific from admin yet

#### Contact Us

Main files:

- `app/pages/contact/page.tsx`
- `components/contact/ContactHeroSection.tsx`
- `components/contact/ContactForm.tsx`
- `components/layout/Footer.tsx`

Current state:

- Hero content is hardcoded
- Contact heading and contact details are hardcoded
- Form fields are fixed in frontend
- Success/error messages are hardcoded
- Footer contact info is also hardcoded and duplicated

#### Meal Prep / Monthly Plans

Main files:

- `app/pages/monthly-plan/page.tsx`
- `app/plans/page.tsx`
- dynamic monthly plan flow pages under `app/pages/monthly-plan/...`
- plan data from API via `redux/api/publicApi.ts`

Current state:

- Plans list is API-driven
- Plan cards use API data
- Hero image, title, subtitle, loading text, button labels are hardcoded
- Remaining monthly plan logic and data flow already exist
- Only the hero area needs CMS/admin control

#### Global Shared Content

Main files:

- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`

Current state:

- Navigation labels are hardcoded
- Action button labels are hardcoded
- Footer phone/email/legal links/branding text are hardcoded

## 3. Key Review Findings

### What is already dynamic

- Menu categories/items
- Restaurant/location list
- Product list
- Monthly plans
- Contact form submission

### What still needs admin control

- Hero sections for all pages
- All static section titles and paragraphs
- All section images and gallery images
- CTA labels and CTA URLs
- Contact details used across multiple pages
- Footer and header text/links
- Static stats/counters
- Page SEO fields
- Empty-state and helper messages
- Repeater content like testimonials, values, FAQ, story blocks, delivery features

### Important implementation gap

The repo contains `ADMIN_FRONTEND_ONLY_DOC.md`, but actual `/admin/*` route files are not present in this codebase right now.

So this document assumes:

- An admin dashboard already exists in another branch/repo, or
- The dashboard UI exists conceptually and needs to be connected to this frontend structure

Important instruction:

- Do not remove or break any existing admin dashboard screens, modules, routes, or current functionality
- Add the CMS/page-control capability as an extension of the existing dashboard

## 4. Recommended CMS Architecture

Use a real page-based CMS structure inside admin.

The goal is:

- non-technical admin can update content without code changes
- each page is built from manageable sections
- sections can be added, removed, reordered, hidden, duplicated, and edited
- media can be changed from dashboard
- SEO and slug-level content can be managed centrally
- dynamic business data and CMS content stay separated but connected

### Recommended CMS modules

1. `Website Content`
2. `Media Library`
3. `Navigation`
4. `Footer`
5. `SEO Settings`
6. `Locations`
7. `Menu`
8. `Meal Prep / Monthly Plans`
9. `Contact Settings`
10. `Reusable Blocks`
11. `SEO Manager`
12. `Page Builder`

These modules should be added without replacing or disrupting the current dashboard modules that already exist.

### Recommended content model

Each page should have:

- `slug`
- `pageTitle`
- `seoTitle`
- `seoDescription`
- `seoImage`
- `hero`
- `sections[]`
- `cta[]`
- `faq[]`
- `meta`
- `status`
- `createdAt`
- `updatedAt`

Each section should support:

- `sectionKey`
- `sectionType`
- `isVisible`
- `title`
- `subtitle`
- `description`
- `image`
- `backgroundImage`
- `buttonLabel`
- `buttonLink`
- `items[]`
- `stats[]`
- `cards[]`
- `sortOrder`
- `styles`
- `layout`
- `variant`
- `metadata`

### Recommended section types

The CMS should support reusable page-builder section types such as:

- `hero`
- `richText`
- `imageText`
- `cards`
- `testimonials`
- `stats`
- `faq`
- `gallery`
- `locationList`
- `menuCategoryList`
- `plansGrid`
- `contactInfo`
- `formBlock`
- `ctaBanner`

### CMS behavior expectations

This should feel like a CMS similar to a website builder, meaning admin can:

- edit page content
- toggle section visibility
- reorder sections with drag and drop
- duplicate sections
- create reusable blocks
- assign reusable blocks to multiple pages
- update images from media library
- edit SEO per page
- save draft before publishing
- preview before publish
- roll back or track revisions if possible

Also:

- preserve the current dashboard navigation and existing admin pages
- add new CMS controls in a way that fits the current dashboard structure
- avoid refactoring unrelated existing admin functionality unless required

## 5. Page-by-Page Admin Control Requirements

### Home

Admin must be able to edit:

- Hero eyebrow
- Hero title
- Hero subtitle
- Hero background image
- Hero primary CTA label/link
- Hero secondary CTA label/link
- Intro statement text
- Locations preview heading
- Mission section content
- Experience section content
- Brand values cards
- Healthy customers section content
- Testimonials list

### Locations

Admin must be able to edit:

- Hero eyebrow
- Hero title
- Hero image

Note:

- Delivery section, showcase section, location data, and location entity management already exist
- Only the locations page hero section should be controlled from CMS/admin

### Menu

Admin must be able to edit:

- Hero eyebrow
- Hero title
- Hero subtitle
- Hero image

Note:

- Menu categories, items, filters, modal behavior, notes, and other menu data already exist
- Only the menu page hero section should be controlled from CMS/admin

### About Us

Admin must be able to edit:

- Hero eyebrow
- Hero title
- Hero image
- Story section title
- Story paragraph
- Story image
- Optional extra sections like values, timeline, team, gallery
- Testimonials shown on About page

### Contact Us

Admin must be able to edit:

- Hero eyebrow
- Hero title
- Hero image
- Contact section heading
- Phone numbers
- Email
- Website URL
- Address blocks
- Opening hours
- Form heading/subheading
- Submit button label
- Success message
- Error message
- Optional map embed or map image

### Meal Prep / Monthly Plans

Admin must be able to edit:

- Hero title
- Hero subtitle
- Hero image
- Hero eyebrow if needed
- Hero CTA label/link if used in design

Note:

- Plan cards, pricing, ordering, flow steps, helper logic, and plan data already exist
- Only the monthly plans page hero section should be controlled from CMS/admin

### Shared Global Settings

Admin must be able to edit:

- Header nav labels and links
- Header CTA labels and links
- Footer logo text
- Footer phone numbers
- Footer email
- Footer legal links
- Social links
- Branding tagline
- Site-wide announcement bar if needed
- Default SEO

## 6. Recommended CMS UX

Inside dashboard, create a `Content` area with tabs:

1. Home
2. Locations
3. Menu
4. About Us
5. Contact Us
6. Meal Prep
7. Header
8. Footer
9. SEO

Each page editor should support:

- Form fields for text
- Rich text editor for longer copy
- Media upload/select for hero and section images
- Repeater builder for cards/testimonials/stats/FAQ
- Drag-and-drop sorting
- Preview mode
- Save draft / Publish
- Active/inactive toggle for sections
- Duplicate section
- Reusable section library
- Per-page revision history if possible
- Live preview or staged preview

### Recommended page editor layout

For each page editor, use this structure:

1. Left sidebar: section list
2. Main panel: selected section form
3. Right sidebar: SEO, visibility, publish state, page settings

This makes it feel like a real CMS instead of a plain form screen.

## 7. Acceptance Criteria

The implementation should be considered complete only if:

1. Every major page can be edited from admin without code changes
2. Every page hero image can be replaced from admin
3. All major titles, paragraphs, buttons, and repeated content blocks are editable
4. Header and footer are editable from admin
5. Menu, locations, and meal prep remain dynamic and also have editable page-level content
6. Sections can be shown/hidden from admin
7. Sections can be reordered from admin
8. Repeater content can be managed from admin
9. Content supports draft/publish flow
10. Changes reflect on frontend without manual code edits
11. Mobile and desktop layouts remain intact
12. SEO title/description per page can be managed from admin
13. The editing experience feels like a CMS, not just a config/settings page
14. Existing admin dashboard features continue working without unwanted UI or behavior changes

## 8. Final Ready-to-Use CMS Prompt

Use the prompt below for your developer or AI implementation workflow.

```text
Review the full Proteinbar website and extend the existing admin dashboard into a real CMS so that all major public pages are fully manageable from admin without needing code changes.

Pages that must be controllable from admin:
- Home
- Locations
- Menu
- About Us
- Contact Us
- Meal Prep / Monthly Plans
- Shared Header
- Shared Footer
- Basic SEO settings

Current frontend reality:
- The site already has API-driven data for menu categories/items, restaurant locations, products, and monthly plans
- Many public pages still contain hardcoded hero sections, section titles, descriptions, CTA labels/links, helper text, stats, and static images
- Hero images for multiple pages are still hardcoded in frontend
- Header and footer content are also hardcoded

Your task:
Build or extend the admin dashboard into a page-based CMS so all page-level content can be managed there by non-technical admins.

Important:
- Do not remove, redesign unnecessarily, or break any existing admin dashboard functionality
- Keep all existing admin modules working as they are
- Add the new CMS capability on top of the existing admin dashboard structure

Requirements:
1. Add a Content Management area in admin with page editors for:
   - Home
   - Locations
   - Menu
   - About Us
   - Contact Us
   - Meal Prep / Monthly Plans
   - Header
   - Footer
   - SEO

2. The admin experience must behave like a CMS, not a simple settings page. Include:
   - page-based editing
   - section-based content model
   - drag-and-drop section ordering
   - section visibility toggle
   - duplicate section support
   - repeater management for cards/stats/testimonials/FAQ
   - media library or image picker
   - draft/publish workflow
   - preview before publish
   - reusable blocks if possible

3. For each page, make these editable from admin:
   - Hero eyebrow
   - Hero title
   - Hero subtitle
   - Hero background image
   - CTA labels and links
   - Section titles
   - Section descriptions
   - Section images
   - Cards/repeater items
   - Stats/counters
   - FAQ/testimonials where applicable
   - Visibility toggle per section
   - SEO title and SEO description

4. Keep existing dynamic business data modules, but connect them with CMS page content:
   - Menu categories/items should stay data-driven
   - Locations should stay data-driven
   - Meal prep / monthly plans should stay data-driven
   - Admin should still be able to control the page hero, intro, notes, CTA text, supporting sections, and section ordering around those dynamic modules

5. Menu page requirements:
   - Admin can update menu hero content and image
   - Existing menu categories, filters, modal logic, notes, and menu data should remain unchanged
   - Only hero-related content needs CMS control for this page

6. Locations page requirements:
   - Admin can update hero content/image
   - Existing delivery section, showcase section, and location entity data should remain unchanged
   - Only hero-related content needs CMS control for this page

7. About page requirements:
   - Admin can update hero content/image
   - Admin can update story section title, paragraph, and image
   - Admin can manage optional extra sections like values, gallery, timeline, testimonials

8. Contact page requirements:
   - Admin can update hero content/image
   - Admin can manage phone numbers, email, website, addresses, opening hours
   - Admin can manage form heading, submit button text, success/error messages

9. Meal Prep / Monthly Plans requirements:
   - Admin can update page hero content/image
   - Existing monthly plan cards, pricing, flow logic, and helper content should remain unchanged
   - Only hero-related content needs CMS control for this page

10. Shared layout requirements:
   - Admin can manage header navigation labels and links
   - Admin can manage header action buttons
   - Admin can manage footer logo text, phone numbers, email, social links, legal links, and tagline

11. Technical implementation expectations:
   - Create reusable content schemas/types for page content
   - Create reusable section schemas for CMS blocks
   - Add admin forms for nested/repeater content
   - Support image upload or media picker for hero and section images
   - Add draft/publish workflow if possible
   - Add section-level show/hide toggles
   - Add drag-and-drop sort ordering for sections and repeater items
   - Store page content separately from business entities
   - Preserve responsive frontend design
   - Replace hardcoded content in public pages with CMS/API content fetches
   - Keep clean separation between CMS page content and operational business entities
   - Preserve all existing admin dashboard features and avoid breaking current modules
   - Integrate the new CMS screens into the current dashboard instead of replacing the old structure

Deliverables:
- Updated CMS-style admin dashboard structure for full website content control
- Content schema/types for all editable page content
- Section schema/types for reusable page builder blocks
- Public content fetching integration on all target pages
- Clear fallback handling if admin content is missing
- Clean, maintainable implementation that avoids hardcoded page copy in the frontend
```

## 9. Suggested Next Step

Best next step:

- Build a single unified `page content schema` first
- Then connect one page end-to-end, preferably `Home`
- After that, reuse the same CMS pattern for `Locations`, `Menu`, `About`, `Contact`, and `Meal Prep`
