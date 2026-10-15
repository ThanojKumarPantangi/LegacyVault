import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAuditLogs } from "../../features/admin/adminSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Badge from "../../components/common/Badge.jsx";
import { Shield, User, Activity, Globe, Calendar, FileText } from "lucide-react";

const AuditLogs = () => {
  const dispatch = useDispatch();
  const { auditLogs, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  const getActionBadgeStatus = (action) => {
    if (action.includes("CREATED") || action.includes("ADDED")) return "active";
    if (action.includes("DELETED") || action.includes("REMOVED") || action.includes("REJECTED")) return "failed";
    if (action.includes("APPROVED") || action.includes("RELEASED")) return "approved";
    if (action.includes("REQUESTED") || action.includes("STARTED")) return "admin_review";
    return "default";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Audit Logs"
        subtitle="Immutable security event logging tracking all authentication attempts, asset cryptographic actions, and authorization changes."
      />

      {loading && auditLogs.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-emerald-600 dark:text-emerald-500" />
        </div>
      ) : auditLogs.length === 0 ? (
        <EmptyState
          title="No Audit Records"
          description="Security logs will be automatically generated as cryptographic actions and authorization decisions occur."
          icon={FileText}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors duration-200">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Event Ledger
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {auditLogs.length} {auditLogs.length === 1 ? "Event" : "Events"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Security Event</th>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Target Resource</th>
                  <th className="px-6 py-3.5">Origin / Client</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {auditLogs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/40 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <Badge status={getActionBadgeStatus(log.action)}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.actorId ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {log.actorId.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {log.actorId.email} • <span className="font-semibold uppercase">{log.actorId.role}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          SYSTEM ENGINE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {log.resourceType}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-[150px]">
                        {log.resourceId || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{log.ipAddress || "127.0.0.1"}</span>
                      </div>
                      <div
                        className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[160px] mt-0.5"
                        title={log.userAgent}
                      >
                        {log.userAgent || "Unknown Client"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <div className="flex items-center justify-end gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
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

export default AuditLogs;
