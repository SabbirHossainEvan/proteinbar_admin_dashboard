import AdminEditablePage from "@/components/admin/AdminEditablePage";

export default function SettingsPage() {
  return (
    <AdminEditablePage
      eyebrow="Admin Settings"
      title="Settings"
      description="Business-wide settings for operations, customer support, and internal defaults."
      sections={[
        {
          title: "Business Settings",
          description: "High-level business defaults used across the admin and storefront.",
          fields: [
            { label: "Business Name", value: "Proteinbar" },
            { label: "Default Currency", value: "USD" },
            { label: "Support Email", value: "support@proteinbar.com" }
          ]
        },
        {
          title: "Operational Defaults",
          description: "Basic settings shared by order and subscription flows.",
          fields: [
            { label: "Default Cutoff Time", value: "10:00 AM" },
            { label: "Default Delivery Fee", value: "5.00" },
            { label: "Internal Note", value: "Review tax and delivery logic once backend persistence is added.", type: "textarea" }
          ]
        }
      ]}
    />
  );
}
