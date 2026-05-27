import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./theme";

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = localStorage.getItem("taskease-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return "light";
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("taskease-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}


