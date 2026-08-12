import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAvailableInheritances,
  submitNomineeAccessRequest,
} from "../../features/verification/verificationSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Badge from "../../components/common/Badge.jsx";
import { Gift, FileText, ArrowRight, UserCheck, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const AvailableInheritances = () => {
  const dispatch = useDispatch();
  const { inheritances, loading, error } = useSelector((state) => state.verification);
  const [requestLoadingId, setRequestLoadingId] = useState(null);

  useEffect(() => {
    dispatch(fetchAvailableInheritances());
  }, [dispatch]);

  const handleRequestAccess = async (nomineeId, assetId) => {
    setRequestLoadingId(assetId);
    const result = await dispatch(submitNomineeAccessRequest({ nomineeId, assetId }));
    setRequestLoadingId(null);
    if (submitNomineeAccessRequest.fulfilled.match(result)) {
      dispatch(fetchAvailableInheritances());
    }
  };

  const getBadgeStatus = (status) => {
    switch (status) {
      case "OWNER_CONFIRMATION_PENDING": return "pending";
      case "NOMINEE_CONFIRMATION_PENDING": return "verification_required";
      case "ASSET_RELEASE_AUTHORIZED": return "released";
      case "RELEASED": return "approved";
      case "OWNER_AVAILABLE":
      case "NOMINEE_OWNER_AVAILABLE":
        return "active";
      default: return "default";
    }
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, " ");
  };

  return (
    <div>
      <PageHeader
        title="Available Inheritances"
        subtitle="Claim access to secure assets assigned to you after inactivity conditions are met."
      />

      {error && (
        <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg">
          {error}
        </div>
      )}

      {loading && inheritances.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-indigo-500" />
        </div>
      ) : inheritances.length === 0 ? (
        <EmptyState
          title="No Active Inheritances"
          description="You do not have any inheritance claims available. Assets only appear here once their respective owners become inactive and verification starts."
          icon={Gift}
        />
      ) : (
        <div className="space-y-8">
          {inheritances.map((inh) => (
            <div
              key={inh.verificationCaseId}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
            >
              {/* Owner Info Bar */}
              <div className="bg-slate-950/60 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      Vault Owner: {inh.owner.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Relationship: {inh.relationship} | Email: {inh.owner.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Inactivity trigger status:</span>
                  <Badge status={getBadgeStatus(inh.verificationStatus)}>
                    {getStatusLabel(inh.verificationStatus)}
                  </Badge>
                </div>
              </div>

              {/* Status explanation warning banners */}
              {inh.verificationStatus === "NOMINEE_CONFIRMATION_PENDING" && (
                <div className="p-4 mx-6 mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Action Required: Availability check is waiting for nominee confirmation response. Please check your email for the secure link.</span>
                </div>
              )}
              {inh.verificationStatus === "OWNER_CONFIRMATION_PENDING" && (
                <div className="p-4 mx-6 mt-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Waiting for owner availability confirmation. Escalation to nominee starts if the owner does not respond within their deadline.</span>
                </div>
              )}
              {(inh.verificationStatus === "OWNER_AVAILABLE" || inh.verificationStatus === "NOMINEE_OWNER_AVAILABLE") && (
                <div className="p-4 mx-6 mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Owner has been confirmed available. Workflow stopped. Please ask the owner to log in to LegacyVault to keep their account active.</span>
                </div>
              )}

              {/* Assets list */}
              <div className="divide-y divide-slate-800">
                {inh.assets.map((asset) => {
                  const isRequesting = requestLoadingId === asset._id;
                  return (
                    <div
                      key={asset._id}
                      className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:bg-slate-900/40 transition-all duration-150"
                    >
                      <div className="space-y-1 md:max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-200">{asset.title}</h4>
                          <Badge status="default">{asset.category.replace("_", " ")}</Badge>
                          {asset.hasFile && (
                            <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase">
                              <FileText className="w-3 h-3" /> File Attached
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {asset.description || "No description provided."}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {asset.requestStatus === "NONE" && (
                          <Button
                            onClick={() => handleRequestAccess(inh.nomineeId, asset._id)}
                            loading={isRequesting}
                            variant="primary"
                            size="sm"
                          >
                            Request Access
                          </Button>
                        )}

                        {asset.requestStatus === "ADMIN_REVIEW" && (
                          <Badge status="admin_review">Under Admin Review</Badge>
                        )}

                        {asset.requestStatus === "APPROVED" && (
                          <div className="flex items-center gap-3">
                            <Badge status="approved">Approved</Badge>
                            <Link to="/nominee/released">
                              <Button variant="outline" size="sm" icon={ArrowRight}>
                                View Released
                              </Button>
                            </Link>
                          </div>
                        )}

                        {asset.requestStatus === "REJECTED" && (
                          <Badge status="rejected">Request Rejected</Badge>
                        )}

                        {asset.requestStatus === "RELEASED" && (
                          <div className="flex items-center gap-3">
                            <Badge status="released">Released</Badge>
                            <Link to="/nominee/released">
                              <Button variant="outline" size="sm" icon={ArrowRight}>
                                View Released
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableInheritances;
