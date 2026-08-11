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
import { Users, Plus, Edit3, Trash2, Mail, Link as LinkIcon, Heart } from "lucide-react";

const Nominees = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.nominees);

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
    if (!name.trim()) errors.name = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format";
    if (!relationship.trim()) errors.relationship = "Relationship is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (editingNominee) {
      // Edit mode
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
      // Add mode
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
        subtitle="Manage secure inheritance recipients who can request access to your designated assets."
        action={
          <Button onClick={handleOpenAdd} icon={Plus}>
            Add Nominee
          </Button>
        }
      />

      {error && (
        <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-blue-500" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No Nominees Appointed"
          description="Nominees are designated members (family, legal heirs, or trust funds) who inherit access. You must appoint a nominee before creating policies."
          icon={Users}
          actionText="Appoint Nominee"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((nominee) => (
            <div
              key={nominee._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    {nominee.relationship}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(nominee)}
                      className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteNomineeId(nominee._id)}
                      className="p-1.5 text-slate-400 hover:text-red-450 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-100 truncate">{nominee.name}</h3>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-450 truncate">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{nominee.email}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 mt-6 pt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" />
                  Account state
                </span>
                <Badge status={nominee.status === "ACTIVE" ? "active" : "pending"}>
                  {nominee.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Nominee Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingNominee ? "Modify Nominee Link" : "Appoint New Nominee"}>
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
            placeholder="nominee@test.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={formErrors.email}
            required
            disabled={!!editingNominee} // Block changing email on edit to keep mapping reliable
          />

          <Input
            label="Relationship"
            id="relationship"
            placeholder="e.g. Spouse, Attorney, Child"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            error={formErrors.relationship}
            required
          />

          {!editingNominee && (
            <p className="text-[11px] text-slate-500 leading-relaxed mt-2 bg-slate-950/20 p-2.5 rounded-lg border border-slate-850">
              Note: If the nominee already has a registered nominee account with this email address, their status will immediately change to <strong>ACTIVE</strong>. Otherwise, they will remain <strong>PENDING</strong> until they register with the same email.
            </p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingNominee ? "Update Nominee" : "Save Nominee"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteNomineeId}
        onClose={() => setDeleteNomineeId(null)}
        onConfirm={handleDeleteConfirm}
        title="Revoke Nominee Appointee?"
        message="This will remove the nominee from your list. They will lose access to any inheritance policies that map assets to them."
        confirmText="Revoke Nominee"
        loading={loading}
      />
    </div>
  );
};

export default Nominees;
