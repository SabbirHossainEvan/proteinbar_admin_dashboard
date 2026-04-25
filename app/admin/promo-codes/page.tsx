import AdminEditablePage from "@/components/admin/AdminEditablePage";

export default function PromoCodesPage() {
  return (
    <AdminEditablePage
      eyebrow="Promotions"
      title="Promo Codes"
      description="Manage discount codes, validity dates, audience rules, and plan eligibility."
      stats={[
        { label: "Active Codes", value: "5" },
        { label: "Scheduled", value: "2" },
        { label: "Expired", value: "7" },
        { label: "Redeemed", value: "318" }
      ]}
      sections={[
        {
          title: "Create or Edit Code",
          description: "Basic information for a website or subscription promotion.",
          fields: [
            { label: "Code", value: "WELCOME15" },
            { label: "Discount Rule", value: "15% off first order" },
            { label: "Eligibility Note", value: "New customers only, applies to direct order and monthly plans.", type: "textarea" }
          ]
        },
        {
          title: "Validity Window",
          description: "Define when the code should start and stop working.",
          fields: [
            { label: "Start Date", value: "2026-04-25" },
            { label: "End Date", value: "2026-05-31" },
            { label: "Usage Limit", value: "200" }
          ]
        }
      ]}
      toggles={[
        { label: "Apply to restaurant menu orders", hint: "Website direct ordering flow.", enabled: true },
        { label: "Apply to monthly plans", hint: "Subscription/meal plan flow.", enabled: true },
        { label: "Stack with referral codes", hint: "Allow combined discounts.", enabled: false },
        { label: "Show code on homepage", hint: "Make the promotion visible publicly.", enabled: true }
      ]}
      table={{
        title: "Recent Codes",
        columns: ["Code", "Offer", "Status", "Uses"],
        rows: [
          ["WELCOME15", "15% first order", "Active", "89 / 200"],
          ["APRILMEAL", "$12 off monthly plan", "Scheduled", "0 / 100"],
          ["TEAMLUNCH", "Free add-on", "Active", "44 / 75"]
        ]
      }}
    />
  );
}
