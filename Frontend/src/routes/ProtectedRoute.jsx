import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { loadCurrentUser } from "../features/auth/authSlice.js";
import Spinner from "../components/common/Spinner.jsx";

const ProtectedRoute = () => {
  const { isAuthenticated, token, user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (token && !user) {
      dispatch(loadCurrentUser());
    }
  }, [token, user, dispatch]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading session...</span>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
