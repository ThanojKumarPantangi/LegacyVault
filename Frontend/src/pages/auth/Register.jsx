import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { registerUser, clearError } from "../../features/auth/authSlice.js";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import { CheckCircle2, ArrowRight, User, Mail, Lock, Shield, AlertCircle } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Full name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format";
    if (!password) errors.password = "Password is required";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (!validate()) return;

    const result = await dispatch(registerUser({ name, email, password, role }));
    if (registerUser.fulfilled.match(result)) {
      setSuccess(true);
    }
  };

  const roleOptions = [
    { value: "USER", label: "Asset Owner (Vault Creator)" },
    { value: "NOMINEE", label: "Trusted Nominee (Heir / Appointee)" },
  ];

  if (success) {
    return (
      <div className="text-center flex flex-col items-center py-2">
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Verification Link Sent
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-6 leading-relaxed max-w-sm">
          We sent an activation link to <strong className="text-slate-900 dark:text-slate-200">{email}</strong>.
          Please check your inbox to verify your email and activate your vault.
        </p>
        <Link to="/login" className="w-full">
          <Button className="w-full" size="md">
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Create Your Vault Account
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Begin securing digital assets and configuring succession policies
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Full Name"
          type="text"
          id="name"
          icon={User}
          placeholder="e.g. Eleanor Vance"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          required
        />

        <Input
          label="Email Address"
          type="email"
          id="email"
          icon={Mail}
          placeholder="eleanor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />

        <Input
          label="Master Password"
          type="password"
          id="password"
          icon={Lock}
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          helperText="Used to generate your secure vault encryption key."
          required
        />

        <Select
          label="Account Purpose & Role"
          id="role"
          options={roleOptions}
          placeholder=""
          value={role}
          onChange={(e) => setRole(e.target.value)}
          helperText={
            role === "USER"
              ? "Allows depositing confidential assets, assigning nominees, and establishing continuity rules."
              : "Allows claiming assigned inheritances upon authorized verification release."
          }
          required
        />

        <div className="pt-2">
          <Button type="submit" loading={loading} className="w-full" size="md">
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Already registered?{" "}
          <Link
            to="/login"
            onClick={() => dispatch(clearError())}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;

