import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNominees,
  addNominee,
  updateNominee,
  deleteNominee,
} from "../../features/nominees/nomineeSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import Input from "../../components/common/Input.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import Badge from "../../components/common/Badge.jsx";
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Mail,
  Heart,
  AlertCircle,
  ShieldCheck,
  Clock,
  UserCheck,
} from "lucide-react";

const Nominees = () => {
  const dispatch = useDispatch();
  const { items = [], loading, error } = useSelector((state) => state.nominees);

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [deleteNomineeId, setDeleteNomineeId] = useState(null);
  const [editingNominee, setEditingNominee] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchNominees());
  }, [dispatch]);

  const handleOpenAdd = () => {
    setEditingNominee(null);
    setName("");
    setEmail("");
    setRelationship("");
    setFormErrors({});
    setIsOpen(true);
  };

  const handleOpenEdit = (nominee) => {
    setEditingNominee(nominee);
    setName(nominee.name);
    setEmail(nominee.email);
    setRelationship(nominee.relationship);
    setFormErrors({});
    setIsOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Full name is required";
    if (!email.trim()) errors.email = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format";
    if (!relationship.trim()) errors.relationship = "Relationship is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (editingNominee) {
      const result = await dispatch(
        updateNominee({
          nomineeId: editingNominee._id,
          nomineeData: { name, email, relationship },
        })
      );
      if (updateNominee.fulfilled.match(result)) {
        setIsOpen(false);
      }
    } else {
      const result = await dispatch(addNominee({ name, email, relationship }));
      if (addNominee.fulfilled.match(result)) {
        setIsOpen(false);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteNomineeId) {
      const result = await dispatch(deleteNominee(deleteNomineeId));
      if (deleteNominee.fulfilled.match(result)) {
        setDeleteNomineeId(null);
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Trusted Nominees"
        subtitle="Manage designated succession recipients who can inherit assets following inactivity verification."
        action={
          <Button onClick={handleOpenAdd} icon={Plus} size="md">
            Appoint Nominee
          </Button>
        }
      />

      {error && (
        <div className="p-3.5 mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-slate-500">Loading appointed nominees...</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No Nominees Appointed"
          description="Designate trusted family members, legal counsel, or executors. Appointees can be assigned confidential assets via inheritance policies."
          icon={Users}
          actionText="Appoint First Nominee"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((nominee) => {
            const isActive = nominee.status === "ACTIVE";
            return (
              <div
                key={nominee._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/50 px-2.5 py-1 rounded-md">
                      <Heart className="w-3.5 h-3.5 fill-current opacity-80" />
                      <span>{nominee.relationship}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(nominee)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteNomineeId(nominee._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors cursor-pointer"
                        title="Revoke Appointment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {nominee.name}
                  </h3>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{nominee.email}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 mt-5 pt-3.5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    {isActive ? (
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{isActive ? "Verified Account" : "Pending Sign-Up"}</span>
                  </span>
                  <Badge status={isActive ? "active" : "pending"} dot>
                    {nominee.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Nominee Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingNominee ? "Modify Nominee Details" : "Appoint Trusted Nominee"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nominee Full Name"
            id="name"
            placeholder="e.g. Sarah Jenkins"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={formErrors.name}
            required
          />

          <Input
            label="Email Address"
            id="email"
            type="email"
            placeholder="sarah@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={formErrors.email}
            helperText={
              editingNominee
                ? "Email cannot be altered once appointed to protect identity integrity."
                : "Must match the email address the nominee uses to register."
            }
            required
            disabled={!!editingNominee}
          />

          <Input
            label="Relationship / Role"
            id="relationship"
            placeholder="e.g. Spouse, Eldest Daughter, Estate Attorney"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            error={formErrors.relationship}
            required
          />

          {!editingNominee && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-lg text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              If the nominee already holds a registered LegacyVault account with this email, their status will automatically transition to <strong>ACTIVE</strong> upon verification.
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingNominee ? "Update Nominee" : "Appoint Nominee"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteNomineeId}
        onClose={() => setDeleteNomineeId(null)}
        onConfirm={handleDeleteConfirm}
        title="Revoke Nominee Appointment?"
        message="This will remove this nominee from your designated successors list. They will lose access to any inheritance policies that assign assets to them."
        confirmText="Revoke Nominee"
        loading={loading}
      />
    </div>
  );
};

export default Nominees;

