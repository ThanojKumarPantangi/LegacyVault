import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  fetchAssets,
  fetchAssetDetails,
  createAsset,
  deleteAsset,
  clearAssetDetails,
} from "../../features/assets/assetSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import Badge from "../../components/common/Badge.jsx";
import { FolderLock, Plus, FileText, Download, Eye, Trash2, Calendar, FileBox } from "lucide-react";
import apiClient from "../../services/apiClient.js";

const CATEGORIES = [
  { value: "BANK_ACCOUNT", label: "Bank Account Credentials" },
  { value: "INSURANCE", label: "Insurance Policy" },
  { value: "INVESTMENT", label: "Investment Details" },
  { value: "PROPERTY", label: "Property Deed/Document" },
  { value: "DIGITAL_WALLET", label: "Crypto/Digital Wallet" },
  { value: "PASSWORD", label: "Sensitive Passwords" },
  { value: "LEGAL_DOCUMENT", label: "Legal Wills/Powers" },
  { value: "IDENTITY_DOCUMENT", label: "Passport/ID Cards" },
  { value: "PERSONAL_DOCUMENT", label: "Personal Photos/Letters" },
  { value: "OTHER", label: "Other Confidential Asset" },
];

const Assets = () => {
  const dispatch = useDispatch();
  const { items, selectedAsset, loading, error } = useSelector((state) => state.assets);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleteAssetId, setDeleteAssetId] = useState(null);

  // Add Asset form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("BANK_ACCOUNT");
  const [description, setDescription] = useState("");
  const [sensitiveData, setSensitiveData] = useState("");
  const [file, setFile] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchAssets());
  }, [dispatch]);

  const handleAddOpen = () => {
    setTitle("");
    setCategory("BANK_ACCOUNT");
    setDescription("");
    setSensitiveData("");
    setFile(null);
    setFormErrors({});
    setIsAddOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!title.trim()) errors.title = "Title is required";
    if (!category) errors.category = "Category is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("description", description);
    if (sensitiveData) formData.append("sensitiveData", sensitiveData);
    if (file) formData.append("file", file);

    const result = await dispatch(createAsset(formData));
    if (createAsset.fulfilled.match(result)) {
      setIsAddOpen(false);
      dispatch(fetchAssets());
    }
  };

  const handleViewDetails = (assetId) => {
    dispatch(clearAssetDetails());
    dispatch(fetchAssetDetails(assetId));
    setIsDetailsOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteAssetId) {
      const result = await dispatch(deleteAsset(deleteAssetId));
      if (deleteAsset.fulfilled.match(result)) {
        setDeleteAssetId(null);
      }
    }
  };

  const handleDownloadFile = async (assetId, originalName) => {
    try {
      const res = await apiClient.get(
        `/assets/${assetId}/file`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(res.data);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(
        "Failed to download decrypted file. Unauthorized or file corrupted."
      );
    }
  };
  
  return (
    <div>
      <PageHeader
        title="Secure Digital Assets"
        subtitle="Manage confidential passwords, accounts, documents, and upload private files."
        action={
          <Button onClick={handleAddOpen} icon={Plus}>
            New Asset
          </Button>
        }
      />

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-blue-500" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No Secure Assets Deposited"
          description="Deposited assets are encrypted inside your digital vault. Assign policies to Nominees so they can inherit them safely."
          icon={FolderLock}
          actionText="Add First Asset"
          onAction={handleAddOpen}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((asset) => (
            <div
              key={asset._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge status="default">{asset.category.replace("_", " ")}</Badge>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(asset._id)}
                      className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteAssetId(asset._id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-100 truncate">{asset.title}</h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {asset.description || "No description provided."}
                </p>
              </div>

              <div className="border-t border-slate-800 mt-6 pt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(asset.createdAt).toLocaleDateString()}
                </span>
                {asset.fileMetadata?.originalName ? (
                  <span className="text-[10px] text-slate-350 bg-slate-800/40 px-2.5 py-1 rounded-md border border-slate-750 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span className="max-w-[100px] truncate">{asset.fileMetadata.originalName}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Text details only</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Deposit Asset into Vault">
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <Input
            label="Asset Title"
            id="title"
            placeholder="e.g. Primary Bank Account PINs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={formErrors.title}
            required
          />

          <Select
            label="Category"
            id="category"
            options={CATEGORIES}
            placeholder=""
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Description (Plaintext)
            </label>
            <textarea
              placeholder="Provide a general description of the asset (this will not be encrypted)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Sensitive Credentials / Notes (Encrypted)
            </label>
            <textarea
              placeholder="Paste password keys, account details, seed phrases, or private pins here. (This text will be encrypted using AES-256-GCM before storage)"
              value={sensitiveData}
              onChange={(e) => setSensitiveData(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Upload Confidential File (Encrypted)
            </label>

            <div className="w-full border border-slate-700 rounded-lg p-4 bg-slate-900">
              {!file ? (
                <div className="flex flex-col items-center justify-center">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0] || null;
                      setFile(selectedFile);
                    }}
                    className="text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white file:hover:bg-blue-500 cursor-pointer"
                  />

                  <p className="text-xs text-slate-500 mt-2">
                    Supported: PDF, JPG, JPEG, PNG, WebP
                  </p>

                  <p className="text-xs text-slate-500">
                    Maximum size: 40 MB
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-blue-400 shrink-0" />

                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">
                        {file.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Encrypt & Store
            </Button>
          </div>
        </form>
      </Modal>

      {/* Asset Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Asset Decrypted Profile">
        {loading && !selectedAsset ? (
          <div className="flex justify-center py-6">
            <Spinner size="md" className="text-blue-500" />
          </div>
        ) : selectedAsset ? (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</p>
              <h4 className="text-base font-bold text-slate-150 mt-1">{selectedAsset.title}</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</p>
                <Badge className="mt-1" status="default">
                  {selectedAsset.category.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</p>
                <Badge className="mt-1" status="active">
                  {selectedAsset.status}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Description (Plaintext)
              </p>
              <p className="text-sm text-slate-350 mt-1 leading-relaxed">
                {selectedAsset.description || "No description provided."}
              </p>
            </div>

            {selectedAsset.sensitiveData ? (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl relative group">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">
                  Encrypted Notes (Decrypted in-memory)
                </p>
                <pre className="text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {selectedAsset.sensitiveData}
                </pre>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Encrypted Notes</p>
                <p className="text-xs font-medium text-slate-500 mt-1">None provided.</p>
              </div>
            )}

            {selectedAsset.fileMetadata ? (
              <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileBox className="w-8 h-8 text-blue-500" />
                  <div>
                    <h5 className="text-sm font-bold text-slate-200 truncate max-w-[200px]">
                      {selectedAsset.fileMetadata.originalName}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(selectedAsset.fileMetadata.size / 1024).toFixed(1)} KB |{" "}
                      {selectedAsset.fileMetadata.mimeType}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    handleDownloadFile(selectedAsset._id, selectedAsset.fileMetadata.originalName)
                  }
                  icon={Download}
                  variant="outline"
                  size="sm"
                >
                  Download Decrypted
                </Button>
              </div>
            ) : null}

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Failed to load asset details.</p>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteAssetId}
        onClose={() => setDeleteAssetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Asset permanently?"
        message="This will delete the digital asset record and purge the encrypted document files from storage. You cannot undo this action."
        confirmText="Purge Asset"
        loading={loading}
      />
    </div>
  );
};

export default Assets;
