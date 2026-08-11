import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../features/admin/adminSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import Badge from "../../components/common/Badge.jsx";
import { Users as UsersIcon, Mail, Shield, Calendar } from "lucide-react";

const Users = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  return (
    <div>
      <PageHeader
        title="Users Directory"
        subtitle="Manage registered digital inheritance accounts, nominees, and administrator credentials."
      />

      {loading && users.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-emerald-500" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Last Pulse Active</th>
                  <th className="px-6 py-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/50 transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-slate-850 text-slate-400 border border-slate-750">
                          <UsersIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          u.role === "ADMIN"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : u.role === "NOMINEE"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-450">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(u.lastActiveAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
