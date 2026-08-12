import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Shield, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import apiClient from "../../services/apiClient.js";
import Button from "../../components/common/Button.jsx";

const VerifyRespond = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const type = searchParams.get("type"); // 'owner' or 'nominee'
  const choice = searchParams.get("choice"); // 'available' or 'unavailable' (optional for nominee)

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const submitResponse = async (nomineeChoice) => {
    if (!token) {
      setErrorMessage("Missing secure token parameter.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      if (type === "owner") {
        const res = await apiClient.post("/verification/respond/owner", { token });
        setSuccessMessage(res.message || "Your availability has been confirmed successfully.");
      } else if (type === "nominee") {
        const finalChoice = nomineeChoice || choice;
        if (!finalChoice) {
          setErrorMessage("Please select a valid availability confirmation.");
          setLoading(false);
          return;
        }
        const res = await apiClient.post("/verification/respond/nominee", { token, choice: finalChoice });
        setSuccessMessage(res.message || "The owner availability response has been recorded.");
      } else {
        setErrorMessage("Invalid verification request type.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Verification response failed. The token may be expired or already used.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If it's the owner, or nominee with pre-selected choice in query params, submit automatically
    if (type === "owner" || (type === "nominee" && choice)) {
      submitResponse();
    }
  }, [type, choice]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Accent Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[80px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="flex justify-center items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-wide">
            LegacyVault
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-slate-100 tracking-tight">
          Availability Check response
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-4 border border-slate-800 shadow-2xl sm:rounded-2xl sm:px-10">
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Validating response token secure signature...</p>
            </div>
          )}

          {!loading && successMessage && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Response Recorded</h3>
              <p className="text-sm text-slate-350 leading-relaxed bg-slate-950/40 p-4 border border-slate-805 rounded-xl">
                {successMessage}
              </p>
            </div>
          )}

          {!loading && errorMessage && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <XCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Verification Error</h3>
              <p className="text-sm text-rose-400/90 leading-relaxed bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl">
                {errorMessage}
              </p>
            </div>
          )}

          {!loading && !successMessage && !errorMessage && type === "nominee" && !choice && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-150">Confirm Account Owner's Availability</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  We are checking whether the LegacyVault account owner is currently available. Please select the appropriate response below.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => submitResponse("available")}
                  variant="success"
                  className="w-full justify-center py-2.5"
                >
                  Yes, Owner is Available
                </Button>
                <Button
                  onClick={() => submitResponse("unavailable")}
                  variant="danger"
                  className="w-full justify-center py-2.5"
                >
                  No, Owner is Not Available
                </Button>
              </div>
            </div>
          )}

          {!loading && !successMessage && !errorMessage && (!token || (type !== "owner" && type !== "nominee")) && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Invalid Link</h3>
              <p className="text-sm text-slate-400">
                This verification check url is invalid or missing required parameters.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyRespond;
