import React from "react";

const Badge = ({ children, status = "default", className = "" }) => {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider";

  const statusStyles = {
    active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    failed: "bg-red-500/10 text-red-400 border border-red-500/20",
    released: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    approved: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
    rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    verification_required: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    admin_review: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    nominee_requested: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    default: "bg-slate-800 text-slate-300 border border-slate-700",
  };

  const currentStyle = statusStyles[status.toLowerCase()] || statusStyles.default;

  return <span className={`${baseStyles} ${currentStyle} ${className}`}>{children}</span>;
};

export default Badge;
