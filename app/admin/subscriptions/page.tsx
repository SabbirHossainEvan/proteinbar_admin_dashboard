import StatusBadge from "@/components/admin/StatusBadge";
import { subscriptions } from "@/data/admin/mock";

export default function SubscriptionsPage() {
  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Lifecycle</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Subscriptions</h2>
        <p className="mt-2 text-sm text-zinc-300">Monitor monthly subscribers and billing lifecycle states.</p>
      </div>

      <div className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
        <table className="admin-table min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className="pb-2 pr-4 font-medium">Subscription ID</th>
              <th className="pb-2 pr-4 font-medium">Customer</th>
              <th className="pb-2 pr-4 font-medium">Plan</th>
              <th className="pb-2 pr-4 font-medium">Next Billing</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr key={subscription.id}>
                <td className="py-3.5 pr-4 text-zinc-200">{subscription.id}</td>
                <td className="py-3.5 pr-4 text-zinc-100">{subscription.customer}</td>
                <td className="py-3.5 pr-4 text-zinc-300">{subscription.plan}</td>
                <td className="py-3.5 pr-4 text-zinc-300">{subscription.nextBilling}</td>
                <td className="py-3">
                  <StatusBadge label={subscription.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
