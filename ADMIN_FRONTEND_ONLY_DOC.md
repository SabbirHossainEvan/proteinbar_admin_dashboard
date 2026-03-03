# Proteinbar Admin Dashboard (Frontend Only) Document

## Scope
This document is for a **frontend-only admin dashboard** (no backend integration yet).
All data will be static/mock and managed in local files/state.

## Objective
Create an admin interface to manage and monitor storefront flows:
- Products and collections
- Orders and customers
- Monthly plans and subscriptions
- Basic content/settings screens

## Admin Flow (Frontend Only)

1. Admin opens `/admin/login`
2. Clicks demo login button
3. Lands on `/admin` dashboard
4. Uses sidebar to navigate:
   - Products
   - Orders
   - Customers
   - Monthly Plans
   - Subscriptions
   - Content
   - Settings

## Implemented Route Structure

- `/admin/login`
- `/admin`
- `/admin/products`
- `/admin/orders`
- `/admin/customers`
- `/admin/monthly-plans`
- `/admin/subscriptions`
- `/admin/content`
- `/admin/settings`

## Implemented Frontend Modules

1. Dashboard
- KPI cards (orders, revenue, pending, active subscriptions)
- Latest orders table

2. Products
- Product listing table UI
- “Add Product” button UI (no API action)

3. Orders
- Orders list with statuses

4. Customers
- Customer summary table

5. Monthly Plans
- Plan cards with base pricing and status

6. Subscriptions
- Subscription list table

7. Content
- Homepage/section content placeholders

8. Settings
- Tax, payment, notification, security placeholder blocks

## Data Source (Mock)

All admin pages consume static mock data from:
- `data/admin/mock.ts`

No database/API dependency in current version.

## UI Structure

1. Shared admin layout:
- Left sidebar navigation
- Right content panel

2. Components:
- `components/admin/AdminSidebar.tsx`

3. Styling:
- Existing Tailwind setup
- Proteinbar visual theme (black/zinc/white)

## Current Limitations

1. No real authentication
2. No API calls
3. No database persistence
4. No create/edit/delete actions saved
5. No role-based access control logic yet

## Next Step (When Backend Starts)

1. Add real auth/session for `/admin/*`
2. Replace mock data with API calls
3. Add CRUD actions with form validation
4. Add pagination/filter/search from backend
5. Add audit logs and role permissions

## Acceptance Criteria (Frontend-Only)

1. All admin routes render correctly
2. Sidebar navigation works and active state is visible
3. Mock data appears in tables/cards on all pages
4. UI is responsive on desktop/tablet/mobile

