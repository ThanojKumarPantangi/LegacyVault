import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button.jsx";

const ErrorState = ({
  message = "An error occurred while loading this content.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-red-500/10 rounded-2xl bg-red-500/5 max-w-md mx-auto my-6">
      <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-pulse" />
      <h3 className="text-base font-bold text-slate-200">Load Failure</h3>
      <p className="text-sm text-slate-400 mt-1 mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} icon={RefreshCw}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
