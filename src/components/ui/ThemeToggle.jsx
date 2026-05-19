import { useTheme } from "../../context/theme";
import Button from "./Button";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      onClick={toggleTheme}
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
        color: "var(--color-foreground)",
        minWidth: "auto",
        padding: "0.65rem 0.95rem",
      }}
    >
      <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>
        {nextTheme === "dark" ? "Dark" : "Light"}
      </span>
      <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>
        mode
      </span>
    </Button>
  );
}


