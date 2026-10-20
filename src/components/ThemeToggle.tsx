import { useState } from "react";

// Same storage key as Karlsen AI ("kls_theme"); each site keeps its own value
// because browser storage is per origin.
const KEY = "kls_theme";

type Theme = "dark" | "light";

function current(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(current);
  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage unavailable; the choice lasts for this page view.
    }
    setTheme(next);
  };
  const label = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  return (
    <button type="button" className="theme-btn" onClick={toggle} aria-label={label} title={label}>
      {theme === "light" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M13.5 9.5A5.5 5.5 0 016.5 2.5a5.5 5.5 0 107 7z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
