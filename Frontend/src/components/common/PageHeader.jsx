import React from "react";

const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};

export default PageHeader;
