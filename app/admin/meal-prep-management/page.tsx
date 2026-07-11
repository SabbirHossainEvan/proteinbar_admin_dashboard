import AdminOverviewPage from "@/components/admin/AdminOverviewPage";

export default function MealPrepManagementPage() {
  return (
    <AdminOverviewPage
      eyebrow="Operations"
      title="Meal Prep Management"
      description="Day-to-day operations hub for kitchen prep, subscriptions, daily orders, labels, and pickup or delivery coordination."
      stats={[
        { label: "Today Orders", value: "84" },
        { label: "Labels Pending", value: "31" },
        { label: "Pickup Stops", value: "6" },
        { label: "Paused Subs", value: "9" }
      ]}
      cards={[
        { href: "/admin/orders", title: "Orders", description: "Review status, delivery method, payment state, and customer meal lines." },
        { href: "/admin/archived-orders", title: "Archived Orders", description: "Review archived test or cleanup orders without restoring deleted data." },
        { href: "/admin/subscriptions", title: "Subscriptions", description: "Pause, resume, and track progression of each active plan." },
        { href: "/admin/orders-of-day", title: "Orders of the Day", description: "Generate the kitchen and logistics sheet for the current day." },
        { href: "/admin/printing", title: "Printing", description: "Print labels, packing slips, and order identifiers." },
        { href: "/admin/locations", title: "Locations", description: "Coordinate pickup hubs, delivery zones, fees, and timing." },
        { href: "/admin/customers", title: "Clients", description: "Open the client history and contact database for support or operations." }
      ]}
      note="This consolidates the requested Meal Prep Management section while keeping the existing specialist screens available underneath it."
    />
  );
}
