import React, { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import { Mail, CheckCircle2, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      setSuccess(true);
      setMessage(response.message || "If an account exists, a password reset link has been sent.");
    } catch (err) {
      setError(err.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Reset Your Password
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your registered email address to receive a secure recovery link
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
            label="Account Email Address"
            id="email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} className="w-full mt-2" size="md">
            <span>Send Reset Link</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>
      ) : (
        <div className="text-center flex flex-col items-center py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Reset Link Sent</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-4 leading-relaxed max-w-sm">
            {message}
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;

