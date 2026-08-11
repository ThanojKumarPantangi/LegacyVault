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
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 max-w-md mx-auto my-6">
      {Icon && <Icon className="w-12 h-12 text-slate-500 mb-4" />}
      <h3 className="text-base font-bold text-slate-200">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} icon={Plus}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
