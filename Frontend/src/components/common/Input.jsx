import React from "react";

const Input = React.forwardRef(
  (
    {
      label,
      type = "text",
      placeholder = "",
      error,
      helperText,
      disabled = false,
      required = false,
      className = "",
      id,
      icon: Icon,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-rose-500 ml-1 font-semibold">*</span>}
            </span>
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            id={id}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full ${Icon ? "pl-9" : "px-3.5"} py-2 text-sm bg-white dark:bg-slate-900 border ${
              error
                ? "border-rose-400 dark:border-rose-500/80 focus:ring-rose-500/20 focus:border-rose-500"
                : "border-slate-300 dark:border-slate-750 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500"
            } rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs focus:outline-none focus:ring-3 transition-all duration-150 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:cursor-not-allowed`}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

