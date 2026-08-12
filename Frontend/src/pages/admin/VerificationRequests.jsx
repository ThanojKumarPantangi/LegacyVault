import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} from "../../features/admin/adminSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import Input from "../../components/common/Input.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Badge from "../../components/common/Badge.jsx";
import { ShieldCheck, UserCheck, AlertTriangle, XOctagon, Calendar, CheckSquare } from "lucide-react";

const VerificationRequests = () => {
  const dispatch = useDispatch();
  const { requests, loading, error } = useSelector((state) => state.admin);

  // Modal states
  const [approveRequestId, setApproveRequestId] = useState(null);
  const [rejectRequestId, setRejectRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAccessRequests());
  }, [dispatch]);

  const handleApproveConfirm = async () => {
    if (approveRequestId) {
      const result = await dispatch(approveAccessRequest(approveRequestId));
      if (approveAccessRequest.fulfilled.match(result)) {
        setApproveRequestId(null);
        dispatch(fetchAccessRequests());
      }
    }
  };

  const handleOpenReject = (requestId) => {
    setRejectRequestId(requestId);
    setRejectReason("");
    setIsRejectOpen(true);
  };

  const handleRejectConfirm = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert("Reject reason is required");
      return;
    }

    const result = await dispatch(
      rejectAccessRequest({ requestId: rejectRequestId, reason: rejectReason })
    );
    if (rejectAccessRequest.fulfilled.match(result)) {
      setIsRejectOpen(false);
      setRejectRequestId(null);
      dispatch(fetchAccessRequests());
    }
  };

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
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
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
                    <td className="px-6 py-4">
                      <Badge status={req.status}>{req.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(req.status === "ADMIN_REVIEW" || req.status === "PENDING") ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => setApproveRequestId(req._id)}
                            variant="success"
                            size="sm"
                            icon={UserCheck}
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleOpenReject(req._id)}
                            variant="danger"
                            size="sm"
                            icon={XOctagon}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!approveRequestId}
        onClose={() => setApproveRequestId(null)}
        onConfirm={handleApproveConfirm}
        title="Approve Asset Release?"
        message="This will authorize the release of the specific digital asset. The designated nominee will immediately be able to decrypt contents and download document files."
        confirmText="Release Asset"
        variant="success"
        loading={loading}
      />

      {/* Rejection Reason Modal */}
      <Modal isOpen={isRejectOpen} onClose={() => setIsRejectOpen(false)} title="Reject Claim Request">
        <form onSubmit={handleRejectConfirm} className="space-y-4">
          <p className="text-xs text-slate-450 leading-relaxed bg-red-500/5 border border-red-500/10 p-3 rounded-lg flex gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>
              Rejecting this request blocks nominee access to the asset content. You must specify a reason to notify the nominee.
            </span>
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
              Rejection Details / Reason
            </label>
            <textarea
              placeholder="Provide a clear explanation for the rejection (e.g., Inactivity period was a false alarm, mismatching verification details)."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={loading}>
              Reject Claim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VerificationRequests;
