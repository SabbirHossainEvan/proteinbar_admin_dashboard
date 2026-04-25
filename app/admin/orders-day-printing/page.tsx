import AdminOverviewPage from "@/components/admin/AdminOverviewPage";

export default function OrdersDayPrintingPage() {
  return (
    <AdminOverviewPage
      eyebrow="Kitchen & Dispatch"
      title="Orders of the Day & Printing"
      description="Single access point for daily production sheets and printable order labels."
      stats={[
        { label: "Daily Sheets", value: "2" },
        { label: "Labels Ready", value: "53" },
        { label: "Pickup Orders", value: "18" },
        { label: "Delivery Orders", value: "66" }
      ]}
      cards={[
        { href: "/admin/orders-of-day", title: "Orders of the Day", description: "Open grouped daily orders for kitchen prep and driver handover." },
        { href: "/admin/printing", title: "Printing", description: "Print single labels or batch labels for all ready meals." }
      ]}
    />
  );
}
