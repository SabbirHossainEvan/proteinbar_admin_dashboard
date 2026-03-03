import { customers } from "@/data/admin/mock";

export default function CustomersPage() {
  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Branch Management</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Locations</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage branches, contact channels, and delivery coverage.</p>
      </div>

      <div className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
        <table className="admin-table min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className="pb-2 pr-4 font-medium">Branch</th>
              <th className="pb-2 pr-4 font-medium">Email</th>
              <th className="pb-2 pr-4 font-medium">City</th>
              <th className="pb-2 pr-4 font-medium">Monthly Orders</th>
              <th className="pb-2 font-medium">Availability</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="py-3.5 pr-4 text-zinc-100">{customer.name}</td>
                <td className="py-3.5 pr-4 text-zinc-300">{customer.email}</td>
                <td className="py-3.5 pr-4 text-zinc-300">{customer.city}</td>
                <td className="py-3.5 pr-4 text-zinc-300">{customer.orders}</td>
                <td className="py-3.5 text-zinc-200">{customer.totalSpent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
