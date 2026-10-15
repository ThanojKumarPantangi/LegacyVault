import React from "react";

const PageHeader = ({ title, subtitle, action, breadcrumb }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="space-y-1">
        {breadcrumb && (
          <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
            {breadcrumb}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

