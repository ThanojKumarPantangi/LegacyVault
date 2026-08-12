import React, { useEffect, useState } from "react";
import axios from "axios";
import PageHeader from "../../components/common/PageHeader.jsx";
import Badge from "../../components/common/Badge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { ShieldAlert, AlertTriangle, Calendar, Users, FolderLock } from "lucide-react";
import apiClient from "../../services/apiClient.js";

const AccessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/access-requests");
      // Filter requests or show them
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
    <div>
      <PageHeader
        title="Inheritance Access Requests"
        subtitle="Monitor verification request attempts, triggered workflows, and security releases relating to your assets."
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-blue-500" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="No Access Requests Logged"
          description="Your vault remains fully secure. No nominee requests have been triggered or reviewed."
          icon={ShieldAlert}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Verification Access Log</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                History of nominee claims and administrative decisions.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {requests.map((req) => (
              <div
                key={req._id}
                className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-200">
                      {req.assetId?.title || "Unknown Asset"}
                    </span>
                    <Badge status={req.status}>{req.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Nominee: {req.nomineeId?.name || "Revoked Link"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Claim date: {new Date(req.requestedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {req.releasedAt && (
                  <div className="text-xs text-slate-500">
                    Released on {new Date(req.releasedAt).toLocaleDateString()}
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
