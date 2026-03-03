import StatusBadge from "@/components/admin/StatusBadge";
import { orders } from "@/data/admin/mock";

export default function OrdersPage() {
  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Commerce</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Orders</h2>
        <p className="mt-2 text-sm text-zinc-300">Track live orders coming from website and subscriptions.</p>
      </div>

      <div className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
        <table className="admin-table min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className="pb-2 pr-4 font-medium">Order ID</th>
              <th className="pb-2 pr-4 font-medium">Customer</th>
              <th className="pb-2 pr-4 font-medium">Items</th>
              <th className="pb-2 pr-4 font-medium">Total</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="py-3.5 pr-4 text-zinc-200">{order.id}</td>
                <td className="py-3.5 pr-4 text-zinc-100">{order.customer}</td>
                <td className="py-3.5 pr-4 text-zinc-300">{order.itemCount}</td>
                <td className="py-3.5 pr-4 text-zinc-200">{order.total}</td>
                <td className="py-3 pr-4">
                  <StatusBadge label={order.status} />
                </td>
                <td className="py-3.5 text-zinc-300">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
