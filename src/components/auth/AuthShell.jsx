import AuthCard from "./AuthCard";

const taskEaseLogo = "/taskease-logo-light.png";

export default function AuthShell({ title, subtitle, children }) {
  const features = [
    {
      title: "Plan your day",
      description: "Create tasks, set priority, add due dates, and keep everything in one dashboard.",
    },
    {
      title: "Stay focused",
      description: "Use Pomodoro, Focus Mode, voice commands, and ADHD-friendly prompts when work gets noisy.",
    },
    {
      title: "Work together",
      description: "Invite collaborators, share checklists, comment on tasks, and keep files beside the work.",
    },
  ];

  return (
    <div
      className="auth-page"
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-background)",
        display: "grid",
        gridTemplateRows: "1fr auto",
        padding: "1.5rem",
      }}
    >
      <main
        className="auth-landing"
        style={{
          width: "min(1120px, 100%)",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(360px, 460px)",
          gap: "2rem",
          alignItems: "center",
        }}
      >
        <section
          className="auth-intro"
          aria-label="TaskEase overview"
          style={{
            display: "grid",
            gap: "1.5rem",
            minWidth: 0,
          }}
        >
          <div style={{ display: "grid", gap: "1rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.7rem",
                width: "fit-content",
                color: "var(--color-muted)",
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              <img
                src={taskEaseLogo}
                alt=""
                style={{
                  width: "2.4rem",
                  height: "2.4rem",
                  objectFit: "contain",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface-strong)",
                }}
              />
              TaskEase
            </div>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              <h1
                style={{
                  margin: 0,
                  maxWidth: "760px",
                  color: "var(--color-foreground)",
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(2rem, 5vw, 4rem)",
                  lineHeight: 1,
                  letterSpacing: 0,
                }}
              >
                A calmer workspace for tasks, focus, and teamwork.
              </h1>
              <p
                style={{
                  margin: 0,
                  maxWidth: "650px",
                  color: "var(--color-muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  lineHeight: 1.7,
                }}
              >
                TaskEase helps you capture work quickly, organize it into useful views, protect focus time, and collaborate without losing the thread.
              </p>
            </div>
          </div>

          <div
            className="auth-feature-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "0.85rem",
            }}
          >
            {features.map((feature, index) => (
              <article
                key={feature.title}
                style={{
                  minHeight: "150px",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-subtle)",
                  display: "grid",
                  alignContent: "start",
                  gap: "0.65rem",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "10px",
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: "var(--color-primary-soft)",
                    color: "var(--color-primary)",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 900,
                  }}
                >
                  {index + 1}
                </span>
                <h2
                  style={{
                    margin: 0,
                    color: "var(--color-foreground)",
                    fontFamily: "var(--font-heading)",
                    fontSize: "1rem",
                    lineHeight: 1.2,
                  }}
                >
                  {feature.title}
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-muted)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.86rem",
                    lineHeight: 1.55,
                  }}
                >
                  {feature.description}
                </p>
              </article>
            ))}
          </div>

          <div
            className="auth-preview"
            aria-label="TaskEase feature preview"
            style={{
              display: "grid",
              gridTemplateColumns: "180px minmax(0, 1fr)",
              gap: "1rem",
              alignItems: "center",
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <img
              src={taskEaseLogo}
              alt="TaskEase logo"
              style={{
                width: "100%",
                aspectRatio: "4 / 3",
                objectFit: "contain",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface-strong)",
              }}
            />
            <div style={{ display: "grid", gap: "0.75rem", minWidth: 0 }}>
              {["Dashboard overview", "Voice task capture", "Shared task details"].map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: "0.7rem",
                    alignItems: "center",
                    minHeight: "42px",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-subtle)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.88rem",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: "0.55rem",
                      height: "0.55rem",
                      borderRadius: "999px",
                      backgroundColor: index === 1 ? "#10B981" : "var(--color-primary)",
                    }}
                  />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item}</span>
                  <span style={{ color: "var(--color-muted)", fontSize: "0.76rem", fontWeight: 800 }}>
                    {index === 0 ? "Track" : index === 1 ? "Speak" : "Share"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="auth-form-panel" aria-label={title} style={{ minWidth: 0 }}>
          <AuthCard title={title} subtitle={subtitle}>
            {children}
          </AuthCard>
        </section>
      </main>

      <footer
        className="auth-footer"
        style={{
          width: "min(1120px, 100%)",
          margin: "1.5rem auto 0",
          paddingTop: "1.1rem",
          borderTop: "1px solid var(--color-border)",
          display: "grid",
          gridTemplateColumns: "minmax(220px, 1.2fr) repeat(3, minmax(140px, auto))",
          gap: "1.25rem",
          color: "var(--color-muted)",
          fontFamily: "var(--font-body)",
          fontSize: "0.82rem",
        }}
      >
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <strong style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)", fontSize: "0.95rem" }}>
            TaskEase
          </strong>
          <span>Tasks, focus sessions, and collaboration in one calm workspace.</span>
          <span>2026 TaskEase. Built for focused everyday planning.</span>
        </div>

        <div style={{ display: "grid", gap: "0.45rem" }}>
          <strong style={{ color: "var(--color-foreground)", fontSize: "0.82rem" }}>Explore</strong>
          <span>Dashboard</span>
          <span>Tasks</span>
          <span>Pomodoro</span>
          <span>Focus Mode</span>
        </div>

        <div style={{ display: "grid", gap: "0.45rem" }}>
          <strong style={{ color: "var(--color-foreground)", fontSize: "0.82rem" }}>Contact</strong>
          <a
            href="https://github.com/Chwasabiii/TaskEase/issues"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--color-muted)", textDecoration: "none" }}
          >
            Report an issue
          </a>
          <a
            href="https://github.com/Chwasabiii/TaskEase/issues/new"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--color-muted)", textDecoration: "none" }}
          >
            Send feedback
          </a>
        </div>

        <div style={{ display: "grid", gap: "0.45rem", alignContent: "start" }}>
          <strong style={{ color: "var(--color-foreground)", fontSize: "0.82rem" }}>Source</strong>
          <a
            href="https://github.com/Chwasabiii/TaskEase"
            target="_blank"
            rel="noreferrer"
            aria-label="Open TaskEase GitHub repository"
            title="GitHub repository"
            style={{
              width: "2.15rem",
              height: "2.15rem",
              display: "inline-grid",
              placeItems: "center",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-subtle)",
              color: "var(--color-foreground)",
              textDecoration: "none",
            }}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.1.79-.25.79-.56v-2.02c-3.23.7-3.91-1.38-3.91-1.38-.53-1.35-1.29-1.71-1.29-1.71-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.73 1.26 3.39.96.11-.75.41-1.26.74-1.55-2.58-.29-5.29-1.29-5.29-5.73 0-1.27.45-2.3 1.2-3.11-.12-.29-.52-1.48.11-3.07 0 0 .98-.31 3.17 1.19a10.92 10.92 0 0 1 5.78 0c2.19-1.5 3.17-1.19 3.17-1.19.63 1.59.23 2.78.11 3.07.75.81 1.2 1.84 1.2 3.11 0 4.46-2.72 5.43-5.31 5.72.42.36.79 1.07.79 2.16v3.06c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}


