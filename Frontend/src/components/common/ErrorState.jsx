import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button.jsx";

const ErrorState = ({
  title = "Failed to load data",
  message = "An error occurred while loading this content.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-10 border border-rose-200 dark:border-rose-900/40 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 max-w-md mx-auto my-6">
      <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 mb-5 leading-relaxed max-w-xs">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={RefreshCw}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;

