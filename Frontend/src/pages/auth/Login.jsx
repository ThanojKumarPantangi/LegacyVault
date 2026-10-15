import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, clearError } from "../../features/auth/authSlice.js";
import apiClient from "../../services/apiClient.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg flex flex-col gap-2 leading-relaxed">
          <span>{error}</span>
          {isUnverified && (
            <div>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resendStatus === "loading"}
                className={`underline font-bold transition-all cursor-pointer ${
                  cooldown > 0 ? "text-slate-400" : "text-blue-500 hover:text-blue-405"
                }`}
              >
                {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend verification email"}
              </button>
            </div>
          )}
        </div>
      )}

      {resendStatus === "success" && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-450 text-xs font-semibold rounded-lg">
          Verification link resent successfully!
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        id="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        required
      />

      <Input
        label="Password"
        type="password"
        id="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        required
      />

      <div className="flex items-center justify-between text-xs font-semibold">
        <Link
          to="/register"
          onClick={() => dispatch(clearError())}
          className="text-blue-500 hover:text-blue-400"
        >
          Create Account
        </Link>
        <Link
          to="/forgot-password"
          onClick={() => dispatch(clearError())}
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Forgot Password?
        </Link>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Sign In
      </Button>
    </form>
  );
};

export default Login;
