"use client";

import { useEffect, useState } from "react";
import { fetchAuth, adminUpdateUserStatus } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Trash2, UserCog, Ban, ShieldOff, ShieldCheck } from "lucide-react";

type User = { id: string; username: string; email: string; role: string; gender: string; status: string; created_at: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await fetchAuth("/api/admin/users");
      setUsers(data.users);
    } catch (err) {
      console.error(err);
      addToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleRole(id: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Are you sure you want to make this user an ${newRole}?`)) return;

    try {
      await fetchAuth(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      addToast(`User role updated to ${newRole}`, "success");
      loadUsers();
    } catch (err) {
      addToast("Failed to update role", "error");
    }
  }

  async function changeStatus(id: string, status: 'active' | 'suspended' | 'banned') {
    const labels: Record<string, string> = { active: 'activate', suspended: 'suspend', banned: 'ban' };
    if (!window.confirm(`Are you sure you want to ${labels[status]} this user?`)) return;

    try {
      await adminUpdateUserStatus(id, status);
      addToast(`User ${status} successfully`, "success");
      loadUsers();
    } catch (err: any) {
      addToast(err.message || "Failed to update user status", "error");
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm("WARNING: This will permanently delete the user and all their trips. Continue?")) return;

    try {
      await fetchAuth(`/api/admin/users/${id}`, { method: "DELETE" });
      addToast("User deleted successfully", "success");
      loadUsers();
    } catch (err) {
      addToast("Failed to delete user", "error");
    }
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-50 text-green-700',
    suspended: 'bg-amber-50 text-amber-700',
    banned: 'bg-red-50 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#25343F]">Users Management</h1>
        <span className="bg-[#F2F4F7] text-[#25343F] px-4 py-1.5 rounded-full text-sm font-medium">
          {users.length} Users
        </span>
      </div>

      {loading ? (
        <p className="text-[#BFC9D1]">Loading users...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#BFC9D1]/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#BFC9D1]/30">
                <th className="p-4 font-semibold text-sm text-[#25343F]">Username</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Email</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Role</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Status</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Joined</th>
                <th className="p-4 font-semibold text-sm text-[#25343F]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#BFC9D1]/10 hover:bg-[#F8FAFC]/50 transition-colors">
                  <td className="p-4 font-medium text-[#25343F]">{user.username}</td>
                  <td className="p-4 text-sm text-[#25343F]/70">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-[#FF9B51]/10 text-[#FF9B51]' : 'bg-[#EAEFEF] text-[#25343F]/70'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[user.status] || statusColors.active}`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[#25343F]/70">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 flex gap-1.5">
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      className="p-2 text-[#25343F]/50 hover:text-[#FF9B51] hover:bg-[#FF9B51]/10 rounded-lg transition-colors"
                      title="Toggle Admin Role"
                    >
                      <UserCog size={18} />
                    </button>
                    {user.status !== 'suspended' ? (
                      <button
                        onClick={() => changeStatus(user.id, 'suspended')}
                        className="p-2 text-[#25343F]/50 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Suspend User"
                      >
                        <ShieldOff size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => changeStatus(user.id, 'active')}
                        className="p-2 text-amber-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Activate User"
                      >
                        <ShieldCheck size={18} />
                      </button>
                    )}
                    {user.status !== 'banned' ? (
                      <button
                        onClick={() => changeStatus(user.id, 'banned')}
                        className="p-2 text-[#25343F]/50 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Ban User"
                      >
                        <Ban size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => changeStatus(user.id, 'active')}
                        className="p-2 text-red-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Unban User"
                      >
                        <ShieldCheck size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 text-[#25343F]/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
             <div className="p-8 text-center text-[#BFC9D1]">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
