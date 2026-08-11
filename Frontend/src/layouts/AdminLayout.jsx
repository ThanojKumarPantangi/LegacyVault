import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../features/auth/authSlice.js";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  History,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";

const AdminLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users Directory", href: "/admin/users", icon: Users },
    { name: "Verification Cases", href: "/admin/access-requests", icon: ShieldCheck },
    { name: "Audit Logging", href: "/admin/audit-logs", icon: History },
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Navbar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between w-full z-20">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          <span className="font-bold text-slate-100 text-sm tracking-wide">
            LegacyVault (Admin)
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-400 hover:text-slate-100 p-1 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div
        className={`fixed md:sticky top-0 left-0 w-64 h-full bg-slate-900/60 md:bg-slate-900 border-r border-slate-800 p-5 flex flex-col z-30 transition-transform duration-300 transform md:transform-none ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="hidden md:flex items-center gap-2.5 mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-white text-lg tracking-wide">
            LegacyVault
          </span>
        </div>

        {/* Admin Quick Info */}
        <div className="mb-6 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Signed in as
          </p>
          <h4 className="text-sm font-bold text-slate-200 mt-1 truncate">
            {user?.name}
          </h4>
          <span className="inline-block bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/20 mt-1.5">
            {user?.role}
          </span>
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  active
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 mt-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-25 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
