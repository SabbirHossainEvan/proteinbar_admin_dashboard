import Link from "next/link";

const recentActivity = [
  { id: "ACT-1", action: "Updated location timing", target: "Proteinbar CFC", date: "Mar 04, 2026" },
  { id: "ACT-2", action: "Added new menu item", target: "High Protein Wrap", date: "Mar 03, 2026" },
  { id: "ACT-3", action: "Reviewed order issue", target: "ORD-2081", date: "Mar 03, 2026" },
];

export default function ProfilePage() {
  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Account Center</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Admin Profile</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage your account, security preferences, and quick admin actions.</p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">Profile Details</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Full Name</p>
            <p className="mt-1 text-sm text-zinc-100">Demo Admin</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Email</p>
            <p className="mt-1 text-sm text-zinc-100">admin@proteinbar.ma</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Role</p>
            <p className="mt-1 text-sm text-zinc-100">Super Admin</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Last Login</p>
            <p className="mt-1 text-sm text-zinc-100">Mar 04, 2026 10:14 AM</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="admin-panel rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white">Security</h3>
          <p className="mt-2 text-sm text-zinc-300">Change sign-in credentials and keep your account secure.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/forgot-password" className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-200">
              Change Password
            </Link>
            <Link href="/admin/otp-verification" className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-100 hover:border-zinc-500">
              Verify OTP
            </Link>
          </div>
        </section>

        <section className="admin-panel rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <p className="mt-2 text-sm text-zinc-300">Shortcuts for common admin tasks.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/admin/menu" className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100 hover:border-zinc-500">
              Manage Menu
            </Link>
            <Link href="/admin/orders" className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100 hover:border-zinc-500">
              Review Orders
            </Link>
            <Link href="/admin/customers" className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100 hover:border-zinc-500">
              Manage Locations
            </Link>
            <Link href="/admin/sign-out" className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-100 hover:bg-rose-400/20">
              Sign Out
            </Link>
          </div>
        </section>
      </div>

      <section className="admin-panel rounded-2xl p-4 md:p-5">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Action</th>
                <th className="pb-2 pr-4 font-medium">Target</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity) => (
                <tr key={activity.id}>
                  <td className="py-3.5 pr-4 text-zinc-100">{activity.action}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{activity.target}</td>
                  <td className="py-3.5 text-zinc-300">{activity.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
