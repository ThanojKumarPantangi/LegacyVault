import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiClient from "../../services/apiClient.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import { CheckCircle2, Lock, ArrowLeft, Shield } from "lucide-react";

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
      setError("Reset token is missing.");
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl shadow-slate-950/5 dark:shadow-slate-950/50 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white text-lg tracking-wide">
            LegacyVault
          </span>
        </div>

        {!success ? (
          <>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 text-center">
              Reset Password
            </h2>
            <p className="text-sm text-slate-500 mt-2 mb-6 text-center leading-relaxed">
              Enter your new secure password below to complete the reset.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm New Password"
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={error}
                required
              />

              <Button type="submit" loading={loading} className="w-full flex items-center justify-center gap-2 mt-2">
                <Lock className="w-4 h-4" />
                Reset Password
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6 animate-bounce" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Password Reset!</h2>
            <p className="text-sm text-slate-650 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
              {message}
            </p>
            <Link to="/login" className="w-full">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        )}

        <div className="mt-8 border-t border-slate-150 dark:border-slate-800/80 pt-5 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
