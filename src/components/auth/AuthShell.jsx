import AuthCard from "./AuthCard";

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <AuthCard title={title} subtitle={subtitle}>
        {children}
      </AuthCard>
    </div>
  );
}


