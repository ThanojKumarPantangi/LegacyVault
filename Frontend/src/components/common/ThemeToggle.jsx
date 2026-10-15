import React from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 cursor-pointer flex items-center justify-center ${className}`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4.5 h-4.5 text-amber-400" />
      ) : (
        <Moon className="w-4.5 h-4.5 text-indigo-600" />
      )}
    </button>
  );
};

export default ThemeToggle;
