import React from "react";
import { Outlet, Navigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Shield, Lock } from "lucide-react";
import ThemeToggle from "../components/common/ThemeToggle.jsx";

const AuthLayout = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated && user) {
    // Redirect if already logged in based on role
    if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "NOMINEE") return <Navigate to="/nominee/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md px-6 py-3.5 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-tight">
                LegacyVault
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Digital Inheritance
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>AES-256-GCM Encrypted</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto z-10">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-950/5 dark:shadow-slate-950/30 p-6 sm:p-8">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/70 dark:border-slate-800/70 py-4 px-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} LegacyVault. All rights reserved.</span>
          <span className="text-[11px]">Confidential Digital Asset Custody & Succession</span>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;

