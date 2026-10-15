import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAccessRequests } from "../../features/admin/adminSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Badge from "../../components/common/Badge.jsx";
import { ShieldCheck, User, FolderLock, AlertTriangle } from "lucide-react";

const VerificationRequests = () => {
  const dispatch = useDispatch();
  const { requests, loading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAccessRequests());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nominee Verification Claims"
        subtitle="Review active nominee inheritance claims, verify supporting evidence, and track automated or manual release status."
      />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm font-medium rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && requests.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-emerald-600 dark:text-emerald-500" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="No Claims Pending Review"
          description="There are currently no active nominee claims or pending access verification cases across the vault platform."
          icon={ShieldCheck}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors duration-200">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Active Claim Cases
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {requests.length} {requests.length === 1 ? "Case" : "Cases"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Asset Owner</th>
                  <th className="px-6 py-3.5">Claiming Nominee</th>
                  <th className="px-6 py-3.5">Designated Asset</th>
                  <th className="px-6 py-3.5 text-right">Workflow Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {requests.map((req) => (
                  <tr
                    key={req._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/40 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {req.ownerId?.name || "Unknown Owner"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {req.ownerId?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {req.nomineeId?.name || "Revoked Nominee"}
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 uppercase tracking-wider">
                          {req.nomineeId?.relationship || "Nominee"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <FolderLock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.assetId?.title || "Unknown Asset"}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {req.assetId?.category?.replace(/_/g, " ") || "Protected Asset"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge status={req.status}>{req.status}</Badge>
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

export default VerificationRequests;
