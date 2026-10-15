import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAccessRequests } from "../../features/admin/adminSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Badge from "../../components/common/Badge.jsx";
import { ShieldCheck } from "lucide-react";

const VerificationRequests = () => {
  const dispatch = useDispatch();
  const { requests, loading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAccessRequests());
  }, [dispatch]);

  return (
    <div>
      <PageHeader
        title="Nominee Verification Cases"
        subtitle="Review active nominee inheritance requests, verify claims, and approve or reject asset release."
      />

      {error && (
        <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg">
          {error}
        </div>
      )}

      {loading && requests.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-emerald-500" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="No Claims Pending Review"
          description="There are currently no active nominee claims or pending access requests."
          icon={ShieldCheck}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Owner (Inactive)</th>
                  <th className="px-6 py-4">Nominee appointee</th>
                  <th className="px-6 py-4">Assigned Asset</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-350">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-900/40 transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{req.ownerId?.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{req.ownerId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{req.nomineeId?.name}</div>
                      <div className="text-xs text-slate-450 mt-0.5 bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded-full inline-block">
                        {req.nomineeId?.relationship}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-250">
                        {req.assetId?.title || "Unknown Asset"}
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5">
                        {req.assetId?.category?.replace(/_/g, " ") || "Unknown Category"}
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
