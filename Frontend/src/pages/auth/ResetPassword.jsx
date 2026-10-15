import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiClient from "../../services/apiClient.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import { CheckCircle2, Lock, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing from the link.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/auth/reset-password", {
        token,
        newPassword,
      });
      setSuccess(true);
      setMessage(response.message || "Password has been reset successfully.");
    } catch (err) {
      setError(err.message || "Failed to reset password. Link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Set New Password
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter a secure replacement password for your LegacyVault account
        </p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="New Master Password"
            id="newPassword"
            type="password"
            icon={Lock}
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            id="confirmPassword"
            type="password"
            icon={Lock}
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} className="w-full mt-2" size="md">
            <span>Reset Password</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>
      ) : (
        <div className="text-center flex flex-col items-center py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Password Updated</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-6 leading-relaxed max-w-sm">
            {message}
          </p>
          <Link to="/login" className="w-full">
            <Button className="w-full" size="md">
              <span>Sign In with New Password</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;

