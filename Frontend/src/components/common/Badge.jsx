import React from "react";

const Badge = ({ children, status = "default", className = "", dot = false }) => {
  const baseStyles =
    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border select-none transition-colors duration-150";

  const statusStyles = {
    active:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50",
    pending:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50",
    failed:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50",
    released:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50",
    approved:
      "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50",
    rejected:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50",
    verification_required:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/50",
    admin_review:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50",
    nominee_requested:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50",
    default:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:border-slate-750",
  };

  const dotStyles = {
    active: "bg-emerald-500",
    pending: "bg-amber-500",
    failed: "bg-rose-500",
    released: "bg-sky-500",
    approved: "bg-teal-500",
    rejected: "bg-rose-500",
    verification_required: "bg-orange-500",
    admin_review: "bg-indigo-500",
    nominee_requested: "bg-purple-500",
    default: "bg-slate-400",
  };

  const key = (status || "default").toLowerCase();
  const currentStyle = statusStyles[key] || statusStyles.default;
  const currentDot = dotStyles[key] || dotStyles.default;

  return (
    <span className={`${baseStyles} ${currentStyle} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} />}
      {children}
    </span>
  );
};

export default Badge;

