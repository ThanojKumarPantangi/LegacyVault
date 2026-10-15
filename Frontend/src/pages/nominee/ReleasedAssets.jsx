import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAvailableInheritances,
  fetchReleasedAsset,
  clearReleasedAsset,
} from "../../features/verification/verificationSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import Badge from "../../components/common/Badge.jsx";
import { KeyRound, Eye, Download, FileText, Calendar, ShieldCheck, FileBox, Copy, Check, Lock, User } from "lucide-react";
import apiClient from "../../services/apiClient.js";

const ReleasedAssets = () => {
  const dispatch = useDispatch();
  const { inheritances, releasedAsset, loading } = useSelector((state) => state.verification);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchAvailableInheritances());
  }, [dispatch]);

  // Extract all approved or released assets
  const releasedItems = [];
  inheritances.forEach((inh) => {
    inh.assets?.forEach((asset) => {
      if (asset.requestStatus === "APPROVED" || asset.requestStatus === "RELEASED") {
        releasedItems.push({
          ...asset,
          ownerName: inh.owner.name,
          ownerEmail: inh.owner.email,
          relationship: inh.relationship,
        });
      }
    });
  });

  const handleOpenDecrypt = (assetId) => {
    setCopied(false);
    dispatch(clearReleasedAsset());
    dispatch(fetchReleasedAsset(assetId));
    setIsOpen(true);
  };

  const handleCopyCredentials = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadFile = async (assetId, originalName) => {
    try {
      const res = await apiClient.get(
        `/verification/released/${assetId}/file`,
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
      alert("Failed to download decrypted file. Unauthorized or file corrupted.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Released Inheritance Assets"
        subtitle="Access authorized digital legacies, decrypt secure credentials in-memory, and retrieve confidential documents released to you."
      />

      {loading && releasedItems.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-emerald-600 dark:text-emerald-500" />
        </div>
      ) : releasedItems.length === 0 ? (
        <EmptyState
          title="No Released Assets Yet"
          description="Your approved assets will show up here. Once an inheritance verification workflow concludes and authorizes release, you will be able to inspect decrypted notes and download protected files."
          icon={KeyRound}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {releasedItems.map((asset) => (
            <div
              key={asset._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <Badge status="released">APPROVED RELEASE</Badge>
                  <Button
                    onClick={() => handleOpenDecrypt(asset._id)}
                    variant="secondary"
                    size="sm"
                    icon={Eye}
                  >
                    Inspect
                  </Button>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate" title={asset.title}>
                  {asset.title}
                </h3>
                
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Benefactor: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{asset.ownerName}</strong> ({asset.relationship})</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                  {asset.description || "No description provided."}
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 mt-5 pt-4 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Decryption Authorized
                </span>
                {asset.hasFile && (
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Encrypted File
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decrypt Details Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Decrypted Digital Asset Record"
        maxWidth="max-w-xl"
      >
        {loading && !releasedAsset ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" className="text-emerald-600 dark:text-emerald-500" />
          </div>
        ) : releasedAsset ? (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asset Title</p>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{releasedAsset.title}</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</p>
                <div className="mt-1">
                  <Badge status="default">
                    {releasedAsset.category?.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Security Release</p>
                <div className="mt-1">
                  <Badge status="approved">
                    AUTHORIZED RELEASE
                  </Badge>
                </div>
              </div>
            </div>

            {releasedAsset.description && (
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Description / Context
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed bg-slate-50 dark:bg-slate-850/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {releasedAsset.description}
                </p>
              </div>
            )}

            {/* Decrypted credentials in-memory */}
            {releasedAsset.sensitiveData ? (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Decrypted Credentials & Confidential Notes
                  </p>
                  <button
                    onClick={() => handleCopyCredentials(releasedAsset.sensitiveData)}
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-xs font-mono text-emerald-950 dark:text-emerald-200 bg-white/70 dark:bg-slate-900/70 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                  {releasedAsset.sensitiveData}
                </pre>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No encrypted credentials or sensitive text notes attached.
              </div>
            )}

            {/* Decrypted File Download */}
            {releasedAsset.fileMetadata ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileBox className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {releasedAsset.fileMetadata.originalName}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {(releasedAsset.fileMetadata.size / 1024).toFixed(1)} KB • {releasedAsset.fileMetadata.mimeType}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    handleDownloadFile(releasedAsset._id, releasedAsset.fileMetadata.originalName)
                  }
                  icon={Download}
                  variant="success"
                  size="sm"
                  className="shrink-0"
                >
                  Download Decrypted
                </Button>
              </div>
            ) : null}

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-sm">Failed to decrypt asset details.</p>
        )}
      </Modal>
    </div>
  );
};

export default ReleasedAssets;
