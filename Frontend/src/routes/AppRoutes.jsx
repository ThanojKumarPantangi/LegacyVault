import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AuthLayout from "../layouts/AuthLayout.jsx";
import UserLayout from "../layouts/UserLayout.jsx";
import NomineeLayout from "../layouts/NomineeLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";

// Route Guards
import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";

// Auth Pages
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";

// User Pages
import UserDashboard from "../pages/user/Dashboard.jsx";
import UserAssets from "../pages/user/Assets.jsx";
import UserNominees from "../pages/user/Nominees.jsx";
import UserPolicies from "../pages/user/Policies.jsx";
import UserAccessRequests from "../pages/user/AccessRequests.jsx";
import UserProfile from "../pages/user/Profile.jsx";

// Nominee Pages
import NomineeDashboard from "../pages/nominee/Dashboard.jsx";
import AvailableInheritances from "../pages/nominee/AvailableInheritances.jsx";
import ReleasedAssets from "../pages/nominee/ReleasedAssets.jsx";

// Admin Pages
import AdminDashboard from "../pages/admin/Dashboard.jsx";
import AdminUsers from "../pages/admin/Users.jsx";
import AdminRequests from "../pages/admin/VerificationRequests.jsx";
import AdminLogs from "../pages/admin/AuditLogs.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirection */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public/Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Private/Protected Routes */}
      <Route element={<ProtectedRoute />}>
        
        {/* User Role Group */}
        <Route element={<RoleRoute allowedRole="USER" />}>
          <Route element={<UserLayout />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/assets" element={<UserAssets />} />
            <Route path="/user/nominees" element={<UserNominees />} />
            <Route path="/user/policies" element={<UserPolicies />} />
            <Route path="/user/access-requests" element={<UserAccessRequests />} />
            <Route path="/user/profile" element={<UserProfile />} />
          </Route>
        </Route>

        {/* Nominee Role Group */}
        <Route element={<RoleRoute allowedRole="NOMINEE" />}>
          <Route element={<NomineeLayout />}>
            <Route path="/nominee/dashboard" element={<NomineeDashboard />} />
            <Route path="/nominee/available" element={<AvailableInheritances />} />
            <Route path="/nominee/released" element={<ReleasedAssets />} />
          </Route>
        </Route>

        {/* Admin Role Group */}
        <Route element={<RoleRoute allowedRole="ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/access-requests" element={<AdminRequests />} />
            <Route path="/admin/audit-logs" element={<AdminLogs />} />
          </Route>
        </Route>

      </Route>

      {/* Wildcard redirection */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
