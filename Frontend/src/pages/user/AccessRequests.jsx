import React, { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader.jsx";
import Badge from "../../components/common/Badge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { ShieldAlert, AlertTriangle, Calendar, User, Clock, CheckCircle2 } from "lucide-react";
import apiClient from "../../services/apiClient.js";

const AccessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/access-requests");
      setRequests(response.data.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load access logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inheritance Access Requests"
        subtitle="Monitor verification claims, triggered succession workflows, and release history relating to your protected assets."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-blue-600 dark:text-blue-500" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm font-medium rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="No Access Requests Logged"
          description="Your vault remains fully secure and locked. No nominee claims have been initiated or approved."
          icon={ShieldAlert}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors duration-200">
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Verification Access Log</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Audit trail of nominee claim activity and administrative decisions.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {requests.length} {requests.length === 1 ? "Record" : "Records"}
            </span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {requests.map((req) => (
              <div
                key={req._id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors duration-150"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {req.assetId?.title || "Unknown Asset"}
                    </span>
                    <Badge status={req.status}>{req.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Nominee: <span className="text-slate-700 dark:text-slate-300 font-semibold">{req.nomineeId?.name || "Revoked Link"}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Claim date: {new Date(req.requestedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>

                {req.releasedAt && (
                  <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 self-start sm:self-auto bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Released on {new Date(req.releasedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessRequests;
