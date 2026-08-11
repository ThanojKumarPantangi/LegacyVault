import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, clearError } from "../../features/auth/authSlice.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

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
    if (!validate()) return;

    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      const user = result.payload.user;
      if (user.role === "ADMIN") navigate("/admin/dashboard");
      else if (user.role === "NOMINEE") navigate("/nominee/dashboard");
      else navigate("/user/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg">
          {error}
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

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link
            to="/register"
            onClick={() => dispatch(clearError())}
            className="font-medium text-blue-500 hover:text-blue-400"
          >
            Don't have an account? Register
          </Link>
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Sign In
      </Button>
    </form>
  );
};

export default Login;
