import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { registerUser, clearError } from "../../features/auth/authSlice.js";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import { CheckCircle2, ArrowRight } from "lucide-react";

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
    if (!name) errors.name = "Name is required";
    if (!email) errors.email = "Email is required";
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
    { value: "USER", label: "Asset Owner" },
    { value: "NOMINEE", label: "Trusted Nominee" },
  ];

  if (success) {
    return (
      <div className="text-center flex flex-col items-center py-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Verification Sent!</h2>
        <p className="text-sm text-slate-650 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
          We have sent a verification link to <strong className="text-slate-900 dark:text-white">{email}</strong>.
          Please check your inbox and verify your email address to activate your account.
        </p>
        <Link to="/login" className="w-full">
          <Button className="w-full flex items-center justify-center gap-2">
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs font-semibold rounded-lg">
          {error}
        </div>
      )}

      <Input
        label="Full Name"
        type="text"
        id="name"
        placeholder="John Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
        required
      />

      <Input
        label="Email Address"
        type="email"
        id="email"
        placeholder="john@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        required
      />

      <Input
        label="Password"
        type="password"
        id="password"
        placeholder="Min 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        required
      />

      <Select
        label="Account Role"
        id="role"
        options={roleOptions}
        placeholder=""
        value={role}
        onChange={(e) => setRole(e.target.value)}
        required
      />

      <div className="flex items-center justify-between text-xs font-semibold">
        <Link
          to="/login"
          onClick={() => dispatch(clearError())}
          className="text-blue-500 hover:text-blue-400"
        >
          Already have an account? Login
        </Link>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Register Account
      </Button>
    </form>
  );
};

export default Register;
