"use client";

import { useMemo, useState } from "react";
import { adminNavSections } from "@/data/admin/navigation";
import { getAdminAuth } from "@/lib/adminAuth";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteAdminRoleMutation,
  useDeleteAdminUserMutation,
  useGetAdminRolesQuery,
  useGetAdminUsersQuery,
  useUpsertAdminRoleMutation,
  useUpsertAdminUserMutation
} from "@/redux/api/adminApi";
import type { AdminRoleRecord, AdminUserRecord } from "@/redux/backoffice/types";

type ManageTab = "admins" | "roles";

type AdminUserForm = {
  id?: string;
  fullName: string;
  email: string;
  password: string;
  role: AdminUserRecord["role"];
  adminRoleId: string;
  allowedPages: string[];
  canPublish: boolean;
  canManageUsers: boolean;
  isActive: boolean;
};

const initialRoleForm: AdminRoleRecord = {
  id: "",
  name: "",
  description: "",
  scopes: [],
  allowedPages: [],
  canPublish: false,
  canManageUsers: false,
  memberCount: 0
};

const initialAdminForm: AdminUserForm = {
  fullName: "",
  email: "",
  password: "",
  role: "admin",
  adminRoleId: "",
  allowedPages: ["/admin"],
  canPublish: false,
  canManageUsers: false,
  isActive: true
};

function togglePageAccess(list: string[], href: string) {
  return list.includes(href) ? list.filter((item) => item !== href) : [...list, href];
}

function PermissionPicker({
  value,
  onChange
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-4">
      {adminNavSections.map((section) => (
        <div key={section.title} className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{section.title}</p>
              <p className="mt-1 text-xs text-zinc-400">{section.items.length} linked page permissions</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const allSelected = section.items.every((item) => value.includes(item.href));
                onChange(
                  allSelected
                    ? value.filter((item) => !section.items.some((page) => page.href === item))
                    : Array.from(new Set([...value, ...section.items.map((item) => item.href)]))
                );
              }}
              className="rounded-lg border border-zinc-600 px-3 py-1 text-xs text-zinc-200"
            >
              {section.items.every((item) => value.includes(item.href)) ? "Clear Section" : "Allow Section"}
            </button>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {section.items.map((item) => (
              <label key={item.href} className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-950/50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={value.includes(item.href)}
                  onChange={() => onChange(togglePageAccess(value, item.href))}
                  className="mt-1 h-4 w-4 accent-amber-300"
                />
                <span>
                  <span className="block text-sm font-medium text-zinc-100">{item.label}</span>
                  <span className="block text-xs text-zinc-500">{item.href}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UsersPermissionsPage() {
  const auth = useMemo(() => getAdminAuth(), []);
  const canManageUsers = auth?.user?.role === "super_admin" || auth?.user?.canManageUsers;
  const [activeTab, setActiveTab] = useState<ManageTab>("admins");
  const [roleForm, setRoleForm] = useState(initialRoleForm);
  const [adminForm, setAdminForm] = useState<AdminUserForm>(initialAdminForm);
  const [roleScopeInput, setRoleScopeInput] = useState("");
  const [message, setMessage] = useState("");

  const {
    data: rolesResponse,
    isLoading: rolesLoading,
    isError: rolesError
  } = useGetAdminRolesQuery(undefined, { skip: !canManageUsers });
  const {
    data: usersResponse,
    isLoading: usersLoading,
    isError: usersError
  } = useGetAdminUsersQuery(undefined, { skip: !canManageUsers });
  const [upsertRole, { isLoading: roleSaving }] = useUpsertAdminRoleMutation();
  const [deleteRole, { isLoading: roleDeleting }] = useDeleteAdminRoleMutation();
  const [upsertAdminUser, { isLoading: userSaving }] = useUpsertAdminUserMutation();
  const [deleteAdminUser, { isLoading: userDeleting }] = useDeleteAdminUserMutation();

  const roles = useMemo(() => rolesResponse?.data ?? [], [rolesResponse]);
  const users = useMemo(() => usersResponse?.data ?? [], [usersResponse]);

  const applyRoleTemplate = (roleId: string) => {
    const selectedRole = roles.find((role) => role.id === roleId);
    setAdminForm((current) => ({
      ...current,
      adminRoleId: roleId,
      allowedPages: selectedRole ? Array.from(new Set(["/admin", ...selectedRole.allowedPages])) : current.allowedPages,
      canPublish: selectedRole?.canPublish ?? current.canPublish,
      canManageUsers: selectedRole?.canManageUsers ?? current.canManageUsers
    }));
  };

  const saveRole = async () => {
    setMessage("");
    await upsertRole(roleForm).unwrap();
    setRoleForm(initialRoleForm);
    setRoleScopeInput("");
    setMessage("Role saved.");
  };

  const saveAdmin = async () => {
    setMessage("");
    await upsertAdminUser({
      ...adminForm,
      allowedPages: Array.from(new Set(["/admin", ...adminForm.allowedPages]))
    }).unwrap();
    setAdminForm(initialAdminForm);
    setMessage("Admin account saved.");
  };

  if (!canManageUsers) {
    return (
      <section className="space-y-7">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Settings</p>
          <h2 className="mt-1 text-3xl font-semibold text-white">Users & Permissions</h2>
          <p className="mt-2 text-sm text-zinc-300">This area is reserved for super admins or admins with user-management access.</p>
        </div>
        <ErrorState label="You do not have permission to manage admin users." />
      </section>
    );
  }

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Settings</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Users & Permissions</h2>
        <p className="mt-2 text-sm text-zinc-300">Create admins or employees, choose exactly which dashboard pages they can access, and keep reusable role templates in sync.</p>
      </div>

      <section className="admin-panel rounded-2xl p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("admins")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${activeTab === "admins" ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 bg-zinc-900/60 text-zinc-100"}`}
          >
            Add New Admin / Employee
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("roles")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${activeTab === "roles" ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 bg-zinc-900/60 text-zinc-100"}`}
          >
            Permission Roles
          </button>
        </div>
      </section>

      {activeTab === "admins" ? (
        <>
          <section className="admin-panel rounded-2xl p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Full Name</span>
                <input value={adminForm.fullName} onChange={(event) => setAdminForm((current) => ({ ...current, fullName: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Email</span>
                <input value={adminForm.email} onChange={(event) => setAdminForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Password</span>
                <input type="password" value={adminForm.password} onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))} placeholder={adminForm.id ? "Leave blank to keep current password" : "Minimum 6 characters"} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Account Type</span>
                <select value={adminForm.role} onChange={(event) => setAdminForm((current) => ({ ...current, role: event.target.value as AdminUserRecord["role"] }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300">
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </label>
              <label className="space-y-1 lg:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Role Template</span>
                <select
                  value={adminForm.adminRoleId}
                  onChange={(event) => applyRoleTemplate(event.target.value)}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                >
                  <option value="">Custom permissions</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
                <input type="checkbox" checked={adminForm.canPublish} onChange={(event) => setAdminForm((current) => ({ ...current, canPublish: event.target.checked }))} className="mt-1 h-4 w-4 accent-amber-300" />
                <span>
                  <span className="block text-sm font-medium text-zinc-100">Can publish</span>
                  <span className="block text-xs text-zinc-400">Publish content and page updates.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
                <input type="checkbox" checked={adminForm.canManageUsers} onChange={(event) => setAdminForm((current) => ({ ...current, canManageUsers: event.target.checked }))} className="mt-1 h-4 w-4 accent-amber-300" />
                <span>
                  <span className="block text-sm font-medium text-zinc-100">Can manage users</span>
                  <span className="block text-xs text-zinc-400">Open this screen and manage admin accounts.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
                <input type="checkbox" checked={adminForm.isActive} onChange={(event) => setAdminForm((current) => ({ ...current, isActive: event.target.checked }))} className="mt-1 h-4 w-4 accent-amber-300" />
                <span>
                  <span className="block text-sm font-medium text-zinc-100">Active account</span>
                  <span className="block text-xs text-zinc-400">Disable login without deleting history.</span>
                </span>
              </label>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-sm font-medium text-white">Page Access</p>
              <PermissionPicker value={adminForm.allowedPages} onChange={(next) => setAdminForm((current) => ({ ...current, allowedPages: next }))} />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => void saveAdmin()} disabled={userSaving} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60">
                {userSaving ? "Saving..." : adminForm.id ? "Update Admin" : "Create Admin"}
              </button>
              {adminForm.id ? (
                <button type="button" onClick={() => setAdminForm(initialAdminForm)} className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100">
                  Cancel Edit
                </button>
              ) : null}
              {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
            </div>
          </section>

          {usersLoading ? <LoadingState label="Loading admin users..." /> : null}
          {usersError ? <ErrorState label="Failed to load admin users." /> : null}
          {!usersLoading ? (
            <section className="grid gap-4 lg:grid-cols-2">
              {users.map((user) => (
                <article key={user.id} className="admin-panel rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{user.fullName}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${user.isActive ? "border border-emerald-400/30 text-emerald-200" : "border border-zinc-600 text-zinc-300"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-300">
                    {user.role.replace("_", " ")}{user.roleName ? ` • ${user.roleName}` : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.allowedPages.slice(0, 6).map((page) => (
                      <span key={page} className="rounded-full border border-zinc-600 px-2 py-1 text-xs text-zinc-300">
                        {page}
                      </span>
                    ))}
                    {user.allowedPages.length > 6 ? <span className="rounded-full border border-zinc-600 px-2 py-1 text-xs text-zinc-400">+{user.allowedPages.length - 6} more</span> : null}
                  </div>
                  <p className="mt-4 text-xs text-zinc-400">
                    Publish: {user.canPublish ? "Yes" : "No"} • Manage Users: {user.canManageUsers ? "Yes" : "No"}
                  </p>
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAdminForm({
                          id: user.id,
                          fullName: user.fullName,
                          email: user.email,
                          password: "",
                          role: user.role,
                          adminRoleId: user.adminRoleId,
                          allowedPages: user.allowedPages,
                          canPublish: user.canPublish,
                          canManageUsers: user.canManageUsers,
                          isActive: user.isActive
                        })
                      }
                      className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => void deleteAdminUser(user.id)} disabled={userDeleting} className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 disabled:opacity-60">
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {!users.length ? <EmptyState label="No admin accounts found yet." /> : null}
            </section>
          ) : null}
        </>
      ) : (
        <>
          <section className="admin-panel rounded-2xl p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Role Name</span>
                <input value={roleForm.name} onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Member Count</span>
                <input type="number" value={roleForm.memberCount} readOnly className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-500 outline-none" />
              </label>
              <label className="space-y-1 lg:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Description</span>
                <textarea value={roleForm.description} onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
              </label>
              <label className="space-y-1 lg:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Scopes</span>
                <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-600 bg-zinc-900/70 p-3">
                  <input
                    value={roleScopeInput}
                    onChange={(event) => setRoleScopeInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      const nextScope = roleScopeInput.trim();
                      if (!nextScope) return;
                      setRoleForm((current) => ({ ...current, scopes: [...current.scopes, nextScope] }));
                      setRoleScopeInput("");
                    }}
                    placeholder="Type a scope and press Enter"
                    className="min-w-[220px] flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                  />
                  {roleForm.scopes.map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setRoleForm((current) => ({ ...current, scopes: current.scopes.filter((item) => item !== scope) }))}
                      className="rounded-full border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200 transition hover:border-rose-300/40 hover:text-rose-100"
                    >
                      {scope} x
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
                <input type="checkbox" checked={roleForm.canPublish} onChange={(event) => setRoleForm((current) => ({ ...current, canPublish: event.target.checked }))} className="mt-1 h-4 w-4 accent-amber-300" />
                <span>
                  <span className="block text-sm font-medium text-zinc-100">Can publish content</span>
                  <span className="block text-xs text-zinc-400">Allow this role to publish website-page or content changes.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
                <input type="checkbox" checked={roleForm.canManageUsers} onChange={(event) => setRoleForm((current) => ({ ...current, canManageUsers: event.target.checked }))} className="mt-1 h-4 w-4 accent-amber-300" />
                <span>
                  <span className="block text-sm font-medium text-zinc-100">Can manage users</span>
                  <span className="block text-xs text-zinc-400">Give this role permission to create or edit admin roles and users.</span>
                </span>
              </label>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-sm font-medium text-white">Role Page Access</p>
              <PermissionPicker value={roleForm.allowedPages} onChange={(next) => setRoleForm((current) => ({ ...current, allowedPages: next }))} />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={() => void saveRole()} disabled={roleSaving} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60">
                {roleSaving ? "Saving..." : roleForm.id ? "Update Role" : "Create Role"}
              </button>
              {roleForm.id ? (
                <button type="button" onClick={() => { setRoleForm(initialRoleForm); setRoleScopeInput(""); }} className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100">
                  Cancel Edit
                </button>
              ) : null}
              {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
            </div>
          </section>

          {rolesLoading ? <LoadingState label="Loading roles..." /> : null}
          {rolesError ? <ErrorState label="Failed to load roles." /> : null}
          {!rolesLoading ? (
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
                    Pages: {role.allowedPages.length} • Publish: {role.canPublish ? "Yes" : "No"} • Manage Users: {role.canManageUsers ? "Yes" : "No"}
                  </p>
                  <div className="mt-5 flex gap-2">
                    <button type="button" onClick={() => setRoleForm(role)} className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900">
                      Edit
                    </button>
                    <button type="button" onClick={() => void deleteRole(role.id)} disabled={roleDeleting} className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 disabled:opacity-60">
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {!roles.length ? <EmptyState label="No roles found yet." /> : null}
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}

