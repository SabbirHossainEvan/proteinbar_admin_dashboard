import AdminEditablePage from "@/components/admin/AdminEditablePage";

export default function MenuCategoriesPage() {
  return (
    <AdminEditablePage
      eyebrow="Restaurants Menus"
      title="Menu Categories"
      description="Create menu groups, define their order, and decide which categories should stay visible on the website."
      stats={[
        { label: "Total Categories", value: "8" },
        { label: "Visible", value: "6" },
        { label: "Hidden", value: "2" },
        { label: "Restaurant Groups", value: "3" }
      ]}
      sections={[
        {
          title: "Category Setup",
          description: "Main labels used by the website and by restaurant-specific menus.",
          fields: [
            { label: "Category Name", value: "Chef Specials" },
            { label: "Slug", value: "chef-specials" },
            { label: "Sort Order", value: "3" }
          ]
        },
        {
          title: "Category Copy",
          description: "Short supporting copy shown below the category tab or section title.",
          fields: [
            { label: "Short Intro", value: "Limited weekly dishes curated for members and direct customers.", type: "textarea" },
            { label: "Badge", value: "Limited Edition" }
          ]
        }
      ]}
      toggles={[
        { label: "Breakfast", hint: "Visible on top menu and category grid.", enabled: true },
        { label: "Lunch", hint: "Visible on top menu and category grid.", enabled: true },
        { label: "Dinner", hint: "Visible on top menu and category grid.", enabled: true },
        { label: "Snacks", hint: "Visible as an optional browsing tab.", enabled: true },
        { label: "Add-ons", hint: "Shown during upsell and custom plan flow.", enabled: true },
        { label: "Seasonal", hint: "Temporary campaign category.", enabled: false }
      ]}
      note="This screen now covers the requested show/hide control for menu categories. Persisting those toggles to the live site still needs backend and public-site wiring."
    />
  );
}
