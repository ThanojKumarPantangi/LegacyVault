import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, clearError } from "../../features/auth/authSlice.js";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [fieldErrors, setFieldErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
      const user = result.payload.user;
      if (user.role === "ADMIN") navigate("/admin/dashboard");
      else if (user.role === "NOMINEE") navigate("/nominee/dashboard");
      else navigate("/user/dashboard");
    }
  };

  const roleOptions = [
    { value: "USER", label: "Asset Owner" },
    { value: "NOMINEE", label: "Trusted Nominee" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg">
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

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link
            to="/login"
            onClick={() => dispatch(clearError())}
            className="font-medium text-blue-500 hover:text-blue-400"
          >
            Already have an account? Login
          </Link>
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Register Account
      </Button>
    </form>
  );
};

export default Register;
