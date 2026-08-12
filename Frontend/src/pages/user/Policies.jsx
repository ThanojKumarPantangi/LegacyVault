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
import { BookOpen, Plus, Edit3, Trash2, Calendar, Shield, Users, CheckSquare, Square } from "lucide-react";

const Policies = () => {
  const dispatch = useDispatch();
  const { items: policies, loading, error } = useSelector((state) => state.policies);
  const nominees = useSelector((state) => state.nominees.items);
  const assets = useSelector((state) => state.assets.items);

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
    if (!nomineeId) errors.nomineeId = "Nominee is required";
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
      errors.assets = "Please select at least one asset to assign";
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
        subtitle="Configure triggers and assign encrypted assets to trusted nominees."
        action={
          <Button onClick={handleOpenAdd} icon={Plus} disabled={nominees.length === 0}>
            New Policy
          </Button>
        }
      />

      {error && (
        <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg">
          {error}
        </div>
      )}

      {nominees.length === 0 ? (
        <EmptyState
          title="Appoint a Nominee First"
          description="Inheritance policies link secure assets to a specific nominee appointee. You need to register at least one nominee before you can set up policies."
          icon={Users}
          actionText="Add a Nominee"
          onAction={() => navigate("/user/nominees")}
        />
      ) : loading && policies.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-blue-500" />
        </div>
      ) : policies.length === 0 ? (
        <EmptyState
          title="No Active Policies"
          description="Create your first policy to map files/passwords to nominees and configure the inactivity delay trigger."
          icon={BookOpen}
          actionText="Set Up Policy"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {policies.map((policy) => {
            const nomineeObj = policy.nomineeId || {};
            return (
              <div
                key={policy._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                      {policy.triggerType} TRIGGER
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(policy)}
                        className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletePolicyId(policy._id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    Nominee: {nomineeObj.name || "Revoked appointee"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Relationship: {nomineeObj.relationship || "Unknown"}
                  </p>

                  <div className="mt-5 space-y-3.5 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-500" /> Inactivity Period
                      </span>
                      <strong className="text-slate-200">{policy.inactivityDays} Days</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-500" /> Owner Response
                      </span>
                      <strong className="text-slate-200">{policy.ownerResponseDays || 3} Days</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-500" /> Nominee Response
                      </span>
                      <strong className="text-slate-200">{policy.nomineeResponseDays || 7} Days</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-slate-500" /> Admin Verification
                      </span>
                      <strong className="text-slate-200">
                        {policy.adminApprovalRequired ? "Required" : "Auto-Release"}
                      </strong>
                    </div>
                  </div>

                  {/* Assigned Assets list */}
                  <div className="mt-5">
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                      Assigned Vault Assets
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {policy.assets.map((asset) => (
                        <span
                          key={asset._id || asset}
                          className="text-[10px] font-medium bg-slate-800 border border-slate-750 text-slate-300 px-2.5 py-1 rounded-md"
                        >
                          {asset.title || "Unknown Asset"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 mt-6 pt-4 flex items-center justify-between">
                  <span className="text-[10px] text-slate-550">Policy status</span>
                  <Badge status="active">{policy.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Policy Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingPolicy ? "Modify Inheritance Policy" : "Set Up Inheritance Policy"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Designated Nominee"
            id="nomineeId"
            options={nomineeOptions}
            placeholder="Select a nominee"
            value={nomineeId}
            onChange={(e) => setNomineeId(e.target.value)}
            error={formErrors.nomineeId}
            required
            disabled={!!editingPolicy} // Block editing nominee to keep state transitions clean
          />

          <Input
            label="Inactivity Trigger Delay (Days)"
            id="inactivityDays"
            type="number"
            min="1"
            placeholder="30"
            value={inactivityDays}
            onChange={(e) => setInactivityDays(e.target.value)}
            error={formErrors.inactivityDays}
            required
          />

          <Input
            label="Owner Response Period (Days)"
            id="ownerResponseDays"
            type="number"
            min="1"
            placeholder="3"
            value={ownerResponseDays}
            onChange={(e) => setOwnerResponseDays(e.target.value)}
            error={formErrors.ownerResponseDays}
            required
          />

          <Input
            label="Nominee Response Period (Days)"
            id="nomineeResponseDays"
            type="number"
            min="1"
            placeholder="7"
            value={nomineeResponseDays}
            onChange={(e) => setNomineeResponseDays(e.target.value)}
            error={formErrors.nomineeResponseDays}
            required
          />

          {/* Asset Selection checklist */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Assign Vault Assets to Nominee
            </label>
            {assets.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-2 bg-slate-900 border border-slate-800 rounded-lg">
                No vault assets created. Add assets to vault first.
              </p>
            ) : (
              <div className="max-h-[160px] overflow-y-auto border border-slate-700 bg-slate-900 rounded-lg p-3 space-y-2">
                {assets.map((asset) => {
                  const isChecked = selectedAssets.includes(asset._id);
                  return (
                    <div
                      key={asset._id}
                      onClick={() => handleAssetToggle(asset._id)}
                      className="flex items-center gap-3 p-1.5 hover:bg-slate-800 rounded-md cursor-pointer text-sm text-slate-350 select-none"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                      <span>{asset.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {formErrors.assets && (
              <span className="text-xs text-red-500 font-medium">{formErrors.assets}</span>
            )}
          </div>

          {/* Admin Approval checkbox */}
          <div className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-800 rounded-xl mt-3 select-none cursor-pointer" onClick={() => setAdminApprovalRequired(!adminApprovalRequired)}>
            {adminApprovalRequired ? (
              <CheckSquare className="w-4 h-4 text-blue-500" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <div>
              <h5 className="text-xs font-bold text-slate-200">Require Admin verification review</h5>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Recommended. Release will require Admin validation of inactivity before access is granted.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
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
        title="Revoke Inheritance Policy?"
        message="This will delete the inheritance policy. Nominees will no longer be able to claim access to these assets on inactivity."
        confirmText="Revoke Policy"
        loading={loading}
      />
    </div>
  );
};

export default Policies;
