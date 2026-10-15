import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Shield, CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import apiClient from "../../services/apiClient.js";
import Button from "../../components/common/Button.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md px-6 py-3.5 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-tight">
                LegacyVault
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Availability Verification
              </span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto z-10">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-950/5 dark:shadow-slate-950/30 p-6 sm:p-8">
            
            {loading && (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Validating Security Signature...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  Please hold while we record your cryptographic response token.
                </p>
              </div>
            )}

            {!loading && successMessage && (
              <div className="text-center py-2 space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Response Confirmed
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-left">
                  {successMessage}
                </p>
                <Link to="/login" className="block pt-2">
                  <Button className="w-full" size="md">
                    <span>Go to Vault Portal</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}

            {!loading && errorMessage && (
              <div className="text-center py-2 space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Verification Error
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed bg-rose-50/50 dark:bg-rose-950/20 p-4 border border-rose-200 dark:border-rose-900/40 rounded-xl text-left">
                  {errorMessage}
                </p>
                <Link to="/login" className="block pt-2">
                  <Button variant="secondary" className="w-full" size="md">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            )}

            {!loading && !successMessage && !errorMessage && type === "nominee" && !choice && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Confirm Account Owner's Availability
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    We are verifying the owner's status as part of the digital inheritance workflow. Please confirm whether the account owner is available.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    onClick={() => submitResponse("available")}
                    variant="success"
                    className="w-full justify-center"
                    size="md"
                  >
                    Yes, Account Owner is Available
                  </Button>
                  <Button
                    onClick={() => submitResponse("unavailable")}
                    variant="danger"
                    className="w-full justify-center"
                    size="md"
                  >
                    No, Account Owner is Not Available
                  </Button>
                </div>
              </div>
            )}

            {!loading && !successMessage && !errorMessage && (!token || (type !== "owner" && type !== "nominee")) && (
              <div className="text-center py-2 space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Invalid Verification Link</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This availability check link is missing required security parameters or has expired.
                </p>
                <Link to="/login" className="block pt-2">
                  <Button variant="secondary" className="w-full" size="md">
                    Return to Home
                  </Button>
                </Link>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/70 dark:border-slate-800/70 py-4 px-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} LegacyVault. Cryptographic Proof of Continuity.</span>
          <span className="text-[11px]">Authorized Succession & Verification Service</span>
        </div>
      </footer>
    </div>
  );
};

export default VerifyRespond;

