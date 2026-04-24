import AdminEditablePage from "@/components/admin/AdminEditablePage";

export default function ClientsPage() {
  return (
    <AdminEditablePage
      eyebrow="Client Database"
      title="Clients"
      description="Central database of all past clients with contact context, ordering history, and subscription notes."
      stats={[
        { label: "Total Clients", value: "1,284" },
        { label: "Active Subscribers", value: "512" },
        { label: "Repeat Customers", value: "347" },
        { label: "Needs Follow-up", value: "19" }
      ]}
      sections={[
        {
          title: "Client Filters",
          description: "Example search and segmentation controls for support and sales.",
          fields: [
            { label: "Search", value: "Name, phone, email, order ID" },
            { label: "Segment", value: "Past monthly plan customers" },
            { label: "Internal Note", value: "VIP follow-up, paused subscriptions, and failed payments can be surfaced here.", type: "textarea" }
          ]
        }
      ]}
      table={{
        title: "Recent Client Records",
        columns: ["Client", "Last Order", "Plan History", "Status"],
        rows: [
          ["Sara Benali", "Apr 20, 2026", "3 days/week for 4 weeks", "Active"],
          ["Yassine Hadi", "Apr 19, 2026", "2 days/week for 6 weeks", "Paused"],
          ["Nora Ilyas", "Apr 18, 2026", "5 days/week for 4 weeks", "Active"]
        ]
      }}
    />
  );
}
