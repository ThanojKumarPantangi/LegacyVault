import React from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Sun, Moon, Monitor } from "lucide-react";

const ThemeToggle = ({ className = "", showLabel = false }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const getLabel = () => {
    if (theme === "system") return "System";
    return theme === "dark" ? "Dark" : "Light";
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-all duration-150 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium ${className}`}
      aria-label={`Current theme: ${theme}. Click to change theme`}
      title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (Click to switch)`}
    >
      {theme === "system" ? (
        <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      ) : resolvedTheme === "dark" ? (
        <Sun className="w-3.5 h-3.5 text-amber-500" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-indigo-600" />
      )}
      {showLabel && <span>{getLabel()}</span>}
    </button>
  );
};

export default ThemeToggle;

