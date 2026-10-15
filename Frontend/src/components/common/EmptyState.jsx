import React from "react";
import { Plus } from "lucide-react";
import Button from "./Button.jsx";

const EmptyState = ({
  title = "No data found",
  description = "Get started by creating a new record.",
  icon: Icon,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/40 max-w-lg mx-auto my-6">
      {Icon && (
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 mb-4 border border-slate-200/60 dark:border-slate-700/60">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-6 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} icon={Plus} size="md">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

