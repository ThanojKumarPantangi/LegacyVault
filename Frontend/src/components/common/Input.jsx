import React from "react";

const Input = React.forwardRef(
  (
    {
      label,
      type = "text",
      placeholder = "",
      error,
      disabled = false,
      required = false,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-slate-400 uppercase tracking-wider"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          id={id}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-4 py-2 text-sm bg-slate-900 border ${
            error ? "border-red-500 focus:ring-red-500" : "border-slate-700 focus:ring-blue-500"
          } rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        />
        {error && (
          <span className="text-xs font-medium text-red-500 mt-0.5">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
