import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAuditLogs } from "../../features/admin/adminSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import Badge from "../../components/common/Badge.jsx";
import { History, User, Activity, Globe, Calendar } from "lucide-react";

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
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Platform security event logs tracking all sensitive actions, decrypts, and downloads."
      />

      {loading && auditLogs.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-emerald-500" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Security Action</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Resource</th>
                  <th className="px-6 py-4">IP / User Agent</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-350">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/40 transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-slate-500" />
                        <Badge status={getActionBadgeStatus(log.action)}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.actorId ? (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <div>
                            <div className="font-bold text-slate-200">{log.actorId.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {log.actorId.email} | {log.actorId.role}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">SYSTEM AUTO</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-250">{log.resourceType}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[140px]">
                        {log.resourceId || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Globe className="w-3.5 h-3.5 text-slate-550" />
                        <span>{log.ipAddress || "localhost"}</span>
                      </div>
                      <div className="text-[9px] text-slate-550 truncate max-w-[150px] mt-0.5" title={log.userAgent}>
                        {log.userAgent || "Unknown UA"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 font-mono">
                      <div className="flex items-center justify-end gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(log.timestamp).toLocaleString()}
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
