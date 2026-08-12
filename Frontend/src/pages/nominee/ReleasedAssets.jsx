import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
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
import { KeyRound, Eye, Download, FileText, Calendar, ShieldCheck, FileBox } from "lucide-react";
import apiClient from "../../services/apiClient.js";

const ReleasedAssets = () => {
  const dispatch = useDispatch();
  const { inheritances, releasedAsset, loading } = useSelector((state) => state.verification);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAvailableInheritances());
  }, [dispatch]);

  // Extract all approved or released assets
  const releasedItems = [];
  inheritances.forEach((inh) => {
    inh.assets.forEach((asset) => {
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
    dispatch(clearReleasedAsset());
    dispatch(fetchReleasedAsset(assetId));
    setIsOpen(true);
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
      alert(
        "Failed to download decrypted file. Unauthorized or file corrupted."
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Released Inheritance Assets"
        subtitle="View decrypted credentials, notes, and download documents released to you."
      />

      {loading && releasedItems.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-emerald-500" />
        </div>
      ) : releasedItems.length === 0 ? (
        <EmptyState
          title="No Released Assets"
          description="Your approved assets will show up here. Once an administrator approves your access request, you can decrypt details and download secure documents."
          icon={KeyRound}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {releasedItems.map((asset) => (
            <div
              key={asset._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge status="released">APPROVED RELEASE</Badge>
                  <button
                    onClick={() => handleOpenDecrypt(asset._id)}
                    className="p-1.5 text-slate-400 hover:text-emerald-450 hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <Eye className="w-4.5 h-4.5" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-100 truncate">{asset.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Owner: {asset.ownerName}</p>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {asset.description || "No description provided."}
                </p>
              </div>

              <div className="border-t border-slate-800 mt-6 pt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-550 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Decryption enabled
                </span>
                {asset.hasFile && (
                  <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                    <FileText className="w-3 h-3" /> File
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decrypt details Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Decrypted Digital Asset Profile">
        {loading && !releasedAsset ? (
          <div className="flex justify-center py-6">
            <Spinner size="md" className="text-emerald-500" />
          </div>
        ) : releasedAsset ? (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset Title</p>
              <h4 className="text-base font-bold text-slate-150 mt-1">{releasedAsset.title}</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</p>
                <Badge className="mt-1" status="default">
                  {releasedAsset.category.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Decryption State</p>
                <Badge className="mt-1" status="approved font-bold">
                  AUTHORIZED RELEASE
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Description (Plaintext)
              </p>
              <p className="text-sm text-slate-350 mt-1 leading-relaxed">
                {releasedAsset.description || "No description provided."}
              </p>
            </div>

            {releasedAsset.sensitiveData ? (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  Decrypted Credentials (Decrypted in-memory)
                </p>
                <pre className="text-xs font-mono text-emerald-350 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {releasedAsset.sensitiveData}
                </pre>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Encrypted Notes</p>
                <p className="text-xs font-medium text-slate-500 mt-1">None provided.</p>
              </div>
            )}

            {releasedAsset.fileMetadata ? (
              <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileBox className="w-8 h-8 text-emerald-500" />
                  <div>
                    <h5 className="text-sm font-bold text-slate-200 truncate max-w-[200px]">
                      {releasedAsset.fileMetadata.originalName}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(releasedAsset.fileMetadata.size / 1024).toFixed(1)} KB |{" "}
                      {releasedAsset.fileMetadata.mimeType}
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
                >
                  Download Decrypted
                </Button>
              </div>
            ) : null}

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Failed to decrypt asset details.</p>
        )}
      </Modal>
    </div>
  );
};

export default ReleasedAssets;
