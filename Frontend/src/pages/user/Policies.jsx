import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from "../../features/policies/policySlice.js";
import { fetchNominees } from "../../features/nominees/nomineeSlice.js";
import { fetchAssets } from "../../features/assets/assetSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import Badge from "../../components/common/Badge.jsx";
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Shield,
  Users,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";

const Policies = () => {
  const dispatch = useDispatch();
  const { items: policies = [], loading, error } = useSelector((state) => state.policies);
  const nominees = useSelector((state) => state.nominees.items) || [];
  const assets = useSelector((state) => state.assets.items) || [];

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [deletePolicyId, setDeletePolicyId] = useState(null);
  const [editingPolicy, setEditingPolicy] = useState(null);

  // Form states
  const [nomineeId, setNomineeId] = useState("");
  const [inactivityDays, setInactivityDays] = useState(30);
  const [ownerResponseDays, setOwnerResponseDays] = useState(3);
  const [nomineeResponseDays, setNomineeResponseDays] = useState(7);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [adminApprovalRequired, setAdminApprovalRequired] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchPolicies());
    dispatch(fetchNominees());
    dispatch(fetchAssets());
  }, [dispatch]);

  const handleOpenAdd = () => {
    setEditingPolicy(null);
    setNomineeId(nominees[0]?._id || "");
    setInactivityDays(30);
    setOwnerResponseDays(3);
    setNomineeResponseDays(7);
    setSelectedAssets([]);
    setAdminApprovalRequired(true);
    setFormErrors({});
    setIsOpen(true);
  };

  const handleOpenEdit = (policy) => {
    setEditingPolicy(policy);
    setNomineeId(policy.nomineeId?._id || policy.nomineeId || "");
    setInactivityDays(policy.inactivityDays);
    setOwnerResponseDays(policy.ownerResponseDays || 3);
    setNomineeResponseDays(policy.nomineeResponseDays || 7);
    setSelectedAssets(policy.assets.map((a) => a._id || a));
    setAdminApprovalRequired(policy.adminApprovalRequired);
    setFormErrors({});
    setIsOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!nomineeId) errors.nomineeId = "A designated nominee is required";
    if (!inactivityDays || Number(inactivityDays) <= 0) {
      errors.inactivityDays = "Inactivity period must be at least 1 day";
    }
    if (!ownerResponseDays || Number(ownerResponseDays) <= 0) {
      errors.ownerResponseDays = "Owner response period must be at least 1 day";
    }
    if (!nomineeResponseDays || Number(nomineeResponseDays) <= 0) {
      errors.nomineeResponseDays = "Nominee response period must be at least 1 day";
    }
    if (selectedAssets.length === 0) {
      errors.assets = "Please assign at least one vault asset to this policy";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      nomineeId,
      inactivityDays: Number(inactivityDays),
      ownerResponseDays: Number(ownerResponseDays),
      nomineeResponseDays: Number(nomineeResponseDays),
      assets: selectedAssets,
      adminApprovalRequired,
    };

    if (editingPolicy) {
      const result = await dispatch(
        updatePolicy({ policyId: editingPolicy._id, policyData: payload })
      );
      if (updatePolicy.fulfilled.match(result)) {
        setIsOpen(false);
        dispatch(fetchPolicies());
      }
    } else {
      const result = await dispatch(createPolicy(payload));
      if (createPolicy.fulfilled.match(result)) {
        setIsOpen(false);
        dispatch(fetchPolicies());
      }
    }
  };

  const handleAssetToggle = (assetId) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter((id) => id !== assetId));
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletePolicyId) {
      const result = await dispatch(deletePolicy(deletePolicyId));
      if (deletePolicy.fulfilled.match(result)) {
        setDeletePolicyId(null);
      }
    }
  };

  const nomineeOptions = nominees.map((n) => ({
    value: n._id,
    label: `${n.name} (${n.relationship})`,
  }));

  return (
    <div>
      <PageHeader
        title="Inheritance Policies"
        subtitle="Configure automated succession triggers, timeout windows, and assign confidential assets to nominees."
        action={
          <Button onClick={handleOpenAdd} icon={Plus} size="md" disabled={nominees.length === 0}>
            New Policy
          </Button>
        }
      />

      {error && (
        <div className="p-3.5 mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {nominees.length === 0 ? (
        <EmptyState
          title="Appoint a Nominee First"
          description="Inheritance policies link confidential assets to a specific nominee appointee. You must register at least one trusted nominee before configuring succession rules."
          icon={Users}
          actionText="Appoint Nominee"
          onAction={() => navigate("/user/nominees")}
        />
      ) : loading && policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-slate-500">Loading inheritance policies...</span>
        </div>
      ) : policies.length === 0 ? (
        <EmptyState
          title="No Active Policies Created"
          description="Create your first policy to map files and credentials to nominees and configure the inactivity delay threshold."
          icon={BookOpen}
          actionText="Create Succession Policy"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {policies.map((policy) => {
            const nomineeObj = policy.nomineeId || {};
            return (
              <div
                key={policy._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      {policy.triggerType} Trigger
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(policy)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Edit Policy"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePolicyId(policy._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors cursor-pointer"
                        title="Delete Policy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Nominee: {nomineeObj.name || "Appointed Nominee"}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Relationship: {nomineeObj.relationship || "Designated Successor"}
                  </p>

                  {/* Trigger Timeline Grid */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Inactivity
                      </span>
                      <strong className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {policy.inactivityDays} Days
                      </strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Owner Grace
                      </span>
                      <strong className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {policy.ownerResponseDays || 3} Days
                      </strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Nominee Window
                      </span>
                      <strong className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {policy.nomineeResponseDays || 7} Days
                      </strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Admin Review
                      </span>
                      <strong className={`text-xs font-semibold ${policy.adminApprovalRequired ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {policy.adminApprovalRequired ? "Required" : "Automatic"}
                      </strong>
                    </div>
                  </div>

                  {/* Assigned Assets */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Assigned Vault Assets ({policy.assets.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {policy.assets.map((asset) => (
                        <span
                          key={asset._id || asset}
                          className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md"
                        >
                          {asset.title || "Unknown Asset"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 mt-5 pt-3.5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Policy active status</span>
                  <Badge status="active" dot>{policy.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Policy Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingPolicy ? "Modify Succession Policy" : "Set Up Inheritance Policy"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Designated Nominee Successor"
            id="nomineeId"
            options={nomineeOptions}
            placeholder="Choose nominee appointee"
            value={nomineeId}
            onChange={(e) => setNomineeId(e.target.value)}
            error={formErrors.nomineeId}
            helperText="Nominee who will receive access to the assigned assets upon inactivity completion."
            required
            disabled={!!editingPolicy}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Inactivity Threshold (Days)"
              id="inactivityDays"
              type="number"
              min="1"
              placeholder="30"
              value={inactivityDays}
              onChange={(e) => setInactivityDays(e.target.value)}
              error={formErrors.inactivityDays}
              helperText="Days of account silence before verification triggers"
              required
            />

            <Input
              label="Owner Grace Period (Days)"
              id="ownerResponseDays"
              type="number"
              min="1"
              placeholder="3"
              value={ownerResponseDays}
              onChange={(e) => setOwnerResponseDays(e.target.value)}
              error={formErrors.ownerResponseDays}
              helperText="Window for you to confirm you are active"
              required
            />

            <Input
              label="Nominee Window (Days)"
              id="nomineeResponseDays"
              type="number"
              min="1"
              placeholder="7"
              value={nomineeResponseDays}
              onChange={(e) => setNomineeResponseDays(e.target.value)}
              error={formErrors.nomineeResponseDays}
              helperText="Window for nominee to respond"
              required
            />
          </div>

          {/* Asset Selection checklist */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Assign Vault Assets to this Policy</span>
              <span className="text-[11px] font-mono text-slate-500">
                {selectedAssets.length} of {assets.length} selected
              </span>
            </label>

            {assets.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                No vault assets deposited yet. Deposit assets first before assigning.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 rounded-lg p-2 space-y-1">
                {assets.map((asset) => {
                  const isChecked = selectedAssets.includes(asset._id);
                  return (
                    <div
                      key={asset._id}
                      onClick={() => handleAssetToggle(asset._id)}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs select-none transition-colors ${
                        isChecked
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-medium"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{asset.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono ml-2 shrink-0">
                        {asset.category.replace(/_/g, " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {formErrors.assets && (
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">{formErrors.assets}</span>
            )}
          </div>

          {/* Admin Approval Checkbox */}
          <div
            onClick={() => setAdminApprovalRequired(!adminApprovalRequired)}
            className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-slate-900 transition-colors"
          >
            <div className="mt-0.5">
              {adminApprovalRequired ? (
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div>
              <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Require Independent Admin Verification Review
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Recommended. Once inactivity is reached, an administrator must manually review and validate the case before releasing decrypted credentials.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingPolicy ? "Update Policy" : "Activate Policy"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletePolicyId}
        onClose={() => setDeletePolicyId(null)}
        onConfirm={handleDeleteConfirm}
        title="Revoke Succession Policy?"
        message="This will delete this policy configuration. Nominees will no longer be eligible to claim access to these assets on inactivity."
        confirmText="Revoke Policy"
        loading={loading}
      />
    </div>
  );
};

export default Policies;

