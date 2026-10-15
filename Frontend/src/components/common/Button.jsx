import React from "react";
import Spinner from "./Spinner.jsx";

const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  className = "",
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.99]";

  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs border border-blue-500/30 dark:border-blue-400/20 focus-visible:ring-blue-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
    secondary:
      "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
    outline:
      "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
    danger:
      "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-rose-500/30 focus-visible:ring-rose-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
    success:
      "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs border border-emerald-500/30 focus-visible:ring-emerald-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
    ghost:
      "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 border border-transparent",
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" className="shrink-0 text-current opacity-80" />}
      {!loading && Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </button>
  );
};

export default Button;

