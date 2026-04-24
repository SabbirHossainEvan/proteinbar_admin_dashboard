import AdminEditablePage from "@/components/admin/AdminEditablePage";

export default function MealPrepMenusPage() {
  return (
    <AdminEditablePage
      eyebrow="Meal Prep"
      title="Meal Prep Menus"
      description="Plan weekly meal-prep drops, assign themes, and define when each meal-prep menu should be active."
      stats={[
        { label: "Active Menus", value: "4" },
        { label: "Upcoming Menus", value: "2" },
        { label: "Production Windows", value: "7" },
        { label: "Linked Meals", value: "46" }
      ]}
      sections={[
        {
          title: "Weekly Menu",
          description: "High-level configuration for one meal-prep cycle.",
          fields: [
            { label: "Menu Name", value: "Week 18 Performance Menu" },
            { label: "Date Range", value: "May 01 - May 07" },
            { label: "Production Note", value: "Focus on higher-protein lunch and dinner options.", type: "textarea" }
          ]
        },
        {
          title: "Operational Rules",
          description: "Control cutoff and publishing behavior for the selected meal-prep menu.",
          fields: [
            { label: "Publishing Status", value: "Scheduled" },
            { label: "Order Cutoff", value: "10:00 AM previous day" },
            { label: "Kitchen Priority", value: "High" }
          ]
        }
      ]}
      toggles={[
        { label: "Enable weekly publish lock", hint: "Freeze edits after kitchen approval.", enabled: true },
        { label: "Show sold-out meals", hint: "Keep meals visible with sold-out status.", enabled: false },
        { label: "Allow add-on bundles", hint: "Offer drink/sauce/add-on bundles in meal prep.", enabled: true },
        { label: "Auto-rollover draft", hint: "Duplicate last week as a new draft.", enabled: true }
      ]}
      table={{
        title: "Current Meal Prep Batches",
        columns: ["Batch", "Window", "Meals", "Status"],
        rows: [
          ["Morning Prep A", "07:00 - 10:00", "18", "Ready"],
          ["Lunch Prep B", "10:30 - 13:30", "14", "In Progress"],
          ["Dinner Prep C", "14:00 - 17:30", "14", "Queued"]
        ]
      }}
    />
  );
}
