"use client";

import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteAdminRoleMutation,
  useGetAdminRolesQuery,
  useUpsertAdminRoleMutation
} from "@/redux/api/adminApi";
import type { AdminRoleRecord } from "@/redux/backoffice/types";

const initialForm: AdminRoleRecord = {
  id: "",
  name: "",
  description: "",
  scopes: [],
  canPublish: false,
  canManageUsers: false,
  memberCount: 0
};

export default function UsersPermissionsPage() {
  const { data, isLoading, isError } = useGetAdminRolesQuery();
  const [upsertRole, { isLoading: isSaving }] = useUpsertAdminRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteAdminRoleMutation();
  const [form, setForm] = useState(initialForm);
  const [scopeInput, setScopeInput] = useState("");
  const [message, setMessage] = useState("");

  const roles = useMemo(() => data?.data ?? [], [data]);

  const onSave = async () => {
    setMessage("");
    await upsertRole(form).unwrap();
    setForm(initialForm);
    setScopeInput("");
    setMessage("Role saved.");
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Settings</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Users & Permissions</h2>
        <p className="mt-2 text-sm text-zinc-300">Set up roles with clear scopes so content, operations, and admin access stay separated and understandable.</p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Role Name</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Member Count</span>
            <input type="number" min={0} value={form.memberCount} onChange={(event) => setForm((current) => ({ ...current, memberCount: Number(event.target.value) || 0 }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Description</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Scopes</span>
            <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-600 bg-zinc-900/70 p-3">
              <input
                value={scopeInput}
                onChange={(event) => setScopeInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  const nextScope = scopeInput.trim();
                  if (!nextScope) return;
                  setForm((current) => ({ ...current, scopes: [...current.scopes, nextScope] }));
                  setScopeInput("");
                }}
                placeholder="Type a scope and press Enter"
                className="min-w-[220px] flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              {form.scopes.map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, scopes: current.scopes.filter((item) => item !== scope) }))}
                  className="rounded-full border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200 transition hover:border-rose-300/40 hover:text-rose-100"
                >
                  {scope} ×
                </button>
              ))}
            </div>
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
            <input type="checkbox" checked={form.canPublish} onChange={(event) => setForm((current) => ({ ...current, canPublish: event.target.checked }))} className="mt-1 h-4 w-4 accent-amber-300" />
            <span>
              <span className="block text-sm font-medium text-zinc-100">Can publish content</span>
              <span className="block text-xs text-zinc-400">Allow this role to publish website-page or content changes.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
            <input type="checkbox" checked={form.canManageUsers} onChange={(event) => setForm((current) => ({ ...current, canManageUsers: event.target.checked }))} className="mt-1 h-4 w-4 accent-amber-300" />
            <span>
              <span className="block text-sm font-medium text-zinc-100">Can manage users</span>
              <span className="block text-xs text-zinc-400">Give this role permission to create or edit admin roles and users.</span>
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => void onSave()} disabled={isSaving} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60">
            {isSaving ? "Saving..." : form.id ? "Update Role" : "Create Role"}
          </button>
          {form.id ? (
            <button type="button" onClick={() => { setForm(initialForm); setScopeInput(""); }} className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100">
              Cancel Edit
            </button>
          ) : null}
          {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
        </div>
      </section>

      {isLoading ? <LoadingState label="Loading roles..." /> : null}
      {isError ? <ErrorState label="Failed to load roles." /> : null}

      {!isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <article key={role.id} className="admin-panel rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{role.description}</p>
                </div>
                <span className="rounded-full border border-zinc-600 px-2 py-1 text-xs text-zinc-200">{role.memberCount} users</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {role.scopes.map((scope) => (
                  <span key={scope} className="rounded-full border border-zinc-600 px-2 py-1 text-xs text-zinc-300">
                    {scope}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-zinc-400">
                Publish: {role.canPublish ? "Yes" : "No"} • Manage Users: {role.canManageUsers ? "Yes" : "No"}
              </p>
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => setForm(role)} className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900">
                  Edit
                </button>
                <button type="button" onClick={() => void deleteRole(role.id)} disabled={isDeleting} className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 disabled:opacity-60">
                  Delete
                </button>
              </div>
            </article>
          ))}
          {!roles.length ? <EmptyState label="No roles found yet." /> : null}
        </section>
      ) : null}
    </section>
  );
}
