"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative p-2 rounded-full hover:bg-white/5 transition focus:outline-none focus:ring-2 focus:ring-cyan-400 group overflow-hidden"
      aria-label="Changer de thème"
    >
      <div className="relative z-10">
        {theme === "dark" ? (
          <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 group-hover:scale-110 transition-transform" />
        ) : (
          <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 group-hover:scale-110 transition-transform" />
        )}
      </div>
      <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors" />
    </button>
  );
}
