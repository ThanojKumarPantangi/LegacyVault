import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiClient from "../../services/apiClient.js";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Spinner from "../../components/common/Spinner.jsx";

const VerifyNomineeEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the link.");
      return;
    }

    const verify = async () => {
      try {
        const response = await apiClient.post(`/nominees/verify-email`, { token });
        setStatus("success");
        setMessage(response.message || "Nominee email verified successfully.");
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Invalid or expired verification link.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="flex flex-col items-center text-center py-2">
      {status === "loading" && (
        <div className="py-6 flex flex-col items-center">
          <Spinner size="lg" className="text-indigo-600 dark:text-indigo-400 mb-4" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Verifying Nominee Link
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs leading-relaxed">
            Please wait while we confirm your appointment as a trusted nominee...
          </p>
        </div>
      )}

      {status === "success" && (
        <>
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Nominee Confirmed!
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-2 leading-relaxed max-w-sm">
            {message}
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-lg text-left text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            If you already have a LegacyVault account with this email, you can access your released inheritances upon sign in. If you are new, please register using this email.
          </div>
          <Link to="/login" className="w-full">
            <Button className="w-full" size="md">
              <span>Continue to Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center mb-4">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Verification Link Expired
          </h2>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 mb-6 leading-relaxed max-w-sm">
            {message}
          </p>
          <Link to="/login" className="w-full">
            <Button variant="secondary" className="w-full" size="md">
              Return to Sign In
            </Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default VerifyNomineeEmail;

