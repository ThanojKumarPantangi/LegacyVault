import React, { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import { Mail, CheckCircle2, ArrowLeft, Shield } from "lucide-react";

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
              Forgot Password
            </h2>
            <p className="text-sm text-slate-500 mt-2 mb-6 text-center leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                required
              />

              <Button type="submit" loading={loading} className="w-full flex items-center justify-center gap-2 mt-2">
                <Mail className="w-4 h-4" />
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6 animate-bounce" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Reset Link Sent</h2>
            <p className="text-sm text-slate-650 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
              {message}
            </p>
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

export default ForgotPassword;
