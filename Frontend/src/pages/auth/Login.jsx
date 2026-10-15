import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, clearError } from "../../features/auth/authSlice.js";
import apiClient from "../../services/apiClient.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [resendStatus, setResendStatus] = useState(""); // "", "loading", "success", "error"
  const [cooldown, setCooldown] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const validate = () => {
    const errors = {};
    if (!email) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format";
    if (!password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setResendStatus("");
    if (!validate()) return;

    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      const user = result.payload.user;
      if (user.role === "ADMIN") navigate("/admin/dashboard");
      else if (user.role === "NOMINEE") navigate("/nominee/released");
      else navigate("/user/dashboard");
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;

    setResendStatus("loading");
    try {
      await apiClient.post("/auth/resend-verification", { email });
      setResendStatus("success");
      setCooldown(60);
    } catch (err) {
      setResendStatus("error");
    }
  };

  const isUnverified = error && (error.toLowerCase().includes("verify") || error.toLowerCase().includes("verified"));

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Sign In to Your Vault
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Access your encrypted assets, nominees, and inheritance policies
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">
              <span>{error}</span>
              {isUnverified && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || resendStatus === "loading"}
                    className={`font-semibold underline transition-colors cursor-pointer text-xs ${
                      cooldown > 0
                        ? "text-slate-400 dark:text-slate-500"
                        : "text-blue-600 dark:text-blue-400 hover:text-blue-700"
                    }`}
                  >
                    {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend verification email"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {resendStatus === "success" && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Verification link resent successfully! Please check your inbox.</span>
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          id="email"
          icon={Mail}
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          id="password"
          icon={Lock}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <Link
            to="/register"
            onClick={() => dispatch(clearError())}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Create an account
          </Link>
          <Link
            to="/forgot-password"
            onClick={() => dispatch(clearError())}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full mt-2" size="md">
          <span>Sign In</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>
    </div>
  );
};

export default Login;

