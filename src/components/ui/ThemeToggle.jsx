import { useTheme } from "../../context/theme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <label className="theme-switch" title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <input
        className="theme-switch__input"
        type="checkbox"
        role="switch"
        checked={isDark}
        onChange={toggleTheme}
      />
      <span className="theme-switch__icon">
        {Array.from({ length: 11 }, (_, index) => (
          <span
            key={index + 1}
            className={`theme-switch__icon-part theme-switch__icon-part--${index + 1}`}
          />
        ))}
      </span>
      <span className="theme-switch__sr">Dark Mode</span>
    </label>
  );
}


