import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import {
  FolderLock,
  Plus,
  FileText,
  Download,
  Eye,
  Trash2,
  Calendar,
  FileBox,
  Lock,
  Search,
  UploadCloud,
  X,
  Copy,
  Check,
} from "lucide-react";
import apiClient from "../../services/apiClient.js";

const CATEGORIES = [
  { value: "BANK_ACCOUNT", label: "Bank Account Credentials" },
  { value: "INSURANCE", label: "Insurance Policy" },
  { value: "INVESTMENT", label: "Investment Details" },
  { value: "PROPERTY", label: "Property Deed/Document" },
  { value: "DIGITAL_WALLET", label: "Crypto / Digital Wallet" },
  { value: "PASSWORD", label: "Master Credentials / Passwords" },
  { value: "LEGAL_DOCUMENT", label: "Legal Wills & Directives" },
  { value: "IDENTITY_DOCUMENT", label: "Passport / ID Documents" },
  { value: "PERSONAL_DOCUMENT", label: "Personal Photos & Letters" },
  { value: "OTHER", label: "Other Confidential Asset" },
];

const Assets = () => {
  const dispatch = useDispatch();
  const { items = [], selectedAsset, loading } = useSelector((state) => state.assets);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleteAssetId, setDeleteAssetId] = useState(null);
  const [copied, setCopied] = useState(false);

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
    if (!title.trim()) errors.title = "Asset title is required";
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
    setCopied(false);
  };

  const handleCopyNotes = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      const res = await apiClient.get(`/assets/${assetId}/file`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download decrypted file. Unauthorized or file corrupted.");
    }
  };

  const filteredAssets = useMemo(() => {
    return items.filter((asset) => {
      const matchesSearch =
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.description && asset.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = !selectedCategoryFilter || asset.category === selectedCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [items, searchQuery, selectedCategoryFilter]);

  return (
    <div>
      <PageHeader
        title="Confidential Vault Assets"
        subtitle="Manage encrypted accounts, private notes, credentials, and confidential succession documents."
        action={
          <Button onClick={handleAddOpen} icon={Plus} size="md">
            New Vault Asset
          </Button>
        }
      />

      {/* Controls Bar */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-2xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="w-full sm:w-60">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="">All Categories ({items.length})</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-slate-500">Decrypting vault index...</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No Confidential Assets Deposited"
          description="Assets deposited here are encrypted with AES-256-GCM. Map them to your appointed nominees via Inheritance Policies."
          icon={FolderLock}
          actionText="Deposit First Asset"
          onAction={handleAddOpen}
        />
      ) : filteredAssets.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl my-6">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No assets match your search
          </p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the category filter or search query.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategoryFilter("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <div
              key={asset._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge status="default">
                    {asset.category.replace(/_/g, " ")}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(asset._id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                      title="Decrypt & View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteAssetId(asset._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors cursor-pointer"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {asset.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {asset.description || "No public summary provided."}
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 mt-5 pt-3.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {new Date(asset.createdAt).toLocaleDateString()}
                </span>
                {asset.fileMetadata?.originalName ? (
                  <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40 flex items-center gap-1 truncate max-w-[130px]">
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="truncate">{asset.fileMetadata.originalName}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    <Lock className="w-3 h-3" /> Encrypted text
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Deposit Asset into Secure Vault" size="lg">
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <Input
            label="Asset Title"
            id="title"
            placeholder="e.g. Primary Commercial Bank PINs & Wire Info"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={formErrors.title}
            required
          />

          <Select
            label="Asset Classification"
            id="category"
            options={CATEGORIES}
            placeholder=""
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Public Description (Unencrypted index reference)
            </label>
            <textarea
              placeholder="Provide a general summary (e.g. 'Account held at Chase Bank, branch #441')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 min-h-[75px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Sensitive Credentials & Notes (AES-256 Encrypted)</span>
              </label>
            </div>
            <textarea
              placeholder="Paste password keys, seed phrases, PINs, or security notes here. This data is strictly encrypted prior to database storage."
              value={sensitiveData}
              onChange={(e) => setSensitiveData(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-750 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 min-h-[100px]"
            />
          </div>

          {/* Confidential File Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Attach Confidential File (Encrypted)
            </label>

            <div className="w-full border border-dashed border-slate-300 dark:border-slate-750 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/40">
              {!file ? (
                <div className="flex flex-col items-center justify-center text-center py-3">
                  <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                  <label
                    htmlFor="asset-file-upload"
                    className="cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Select confidential document to encrypt
                    <input
                      id="asset-file-upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="sr-only"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports PDF, JPG, PNG, WebP (Max 40 MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Encrypt & Store Asset
            </Button>
          </div>
        </form>
      </Modal>

      {/* Asset Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Decrypted Asset Record" size="lg">
        {loading && !selectedAsset ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Spinner size="md" className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-slate-500">Decrypting master record...</span>
          </div>
        ) : selectedAsset ? (
          <div className="space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Asset Title
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {selectedAsset.title}
              </h4>
              <div className="flex items-center gap-2 mt-2">
                <Badge status="default">{selectedAsset.category.replace(/_/g, " ")}</Badge>
                <Badge status="active" dot>
                  {selectedAsset.status}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Public Description
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-800/70">
                {selectedAsset.description || "No public summary provided."}
              </p>
            </div>

            {/* Decrypted Notes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Decrypted Credentials (In-Memory Only)
                </span>
                {selectedAsset.sensitiveData && (
                  <button
                    type="button"
                    onClick={() => handleCopyNotes(selectedAsset.sensitiveData)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy to clipboard"}</span>
                  </button>
                )}
              </div>

              {selectedAsset.sensitiveData ? (
                <div className="p-3.5 bg-slate-900 text-slate-100 dark:bg-slate-950 rounded-lg border border-slate-800">
                  <pre className="text-xs font-mono text-emerald-400 dark:text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {selectedAsset.sensitiveData}
                  </pre>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No sensitive text notes recorded.</p>
              )}
            </div>

            {/* Attached File Card */}
            {selectedAsset.fileMetadata ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                    <FileBox className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {selectedAsset.fileMetadata.originalName}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {(selectedAsset.fileMetadata.size / 1024).toFixed(1)} KB • {selectedAsset.fileMetadata.mimeType}
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

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-rose-500">Failed to decrypt asset details.</p>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteAssetId}
        onClose={() => setDeleteAssetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Permanently Purge Vault Asset?"
        message="This will securely destroy this record and purge its encrypted document from storage. This action cannot be reversed."
        confirmText="Purge Asset"
        loading={loading}
      />
    </div>
  );
};

export default Assets;

