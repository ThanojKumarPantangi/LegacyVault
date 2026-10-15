import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiClient from "../../services/apiClient.js";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import Button from "../../components/common/Button.jsx";

const VerifyUserEmail = () => {
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
        const response = await apiClient.get(`/auth/verify-email?token=${token}`);
        setStatus("success");
        setMessage(response.message || "Email verified successfully.");
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Invalid or expired verification link.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl shadow-slate-950/5 dark:shadow-slate-950/50 flex flex-col items-center text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Verifying Account</h2>
            <p className="text-sm text-slate-500 mt-2">Please wait while we activate your LegacyVault account...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6 animate-bounce" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Email Verified!</h2>
            <p className="text-sm text-slate-650 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
              {message}
            </p>
            <Link to="/login" className="w-full">
              <Button className="w-full flex items-center justify-center gap-2">
                Continue to Login
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mb-6" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Verification Failed</h2>
            <p className="text-sm text-slate-650 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
              {message}
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link to="/login" className="w-full">
                <Button variant="secondary" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyUserEmail;
