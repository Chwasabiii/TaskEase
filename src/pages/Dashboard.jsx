import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../hooks/useTasks";

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, loading } = useTasks();

  const total       = tasks.length;
  const inProgress  = tasks.filter((t) => t.status === "in_progress").length;
  const today       = new Date().toDateString();
  const doneToday   = tasks.filter(
    (t) => t.status === "done" && new Date(t.updated_at).toDateString() === today
  ).length;
  const overdue = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
  ).length;

  const stats = [
    { label: "Total Tasks",     value: total,      icon: "✓", color: "#5B8CFF" },
    { label: "In Progress",     value: inProgress,  icon: "◷", color: "#7C5CFF" },
    { label: "Completed Today", value: doneToday,   icon: "⚡", color: "#10B981" },
    { label: "Overdue",         value: overdue,     icon: "⚠", color: "#EF4444" },
  ];

  const recentTasks = tasks.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Welcome */}
      <div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "#F1F5F9", marginBottom: "0.25rem" }}>
          Good morning 👋
        </h2>
        <p style={{ color: "#64748B", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          Here's what's on your plate today.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.25rem" }}>{stat.icon}</span>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: stat.color }} />
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, color: stat.color, marginBottom: "0.25rem" }}>
              {loading ? "—" : stat.value}
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#64748B" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent tasks */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 600, color: "#F1F5F9", marginBottom: "1rem" }}>
          Recent Tasks
        </h3>
        {loading ? (
          <p style={{ color: "#475569", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>Loading...</p>
        ) : recentTasks.length === 0 ? (
          <p style={{ color: "#475569", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
            No tasks yet — go to My Tasks to create one!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {recentTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span style={{
                  width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                  backgroundColor: task.status === "done" ? "#10B981" : task.status === "in_progress" ? "#7C5CFF" : "#5B8CFF",
                }} />
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: "0.875rem",
                  color: task.status === "done" ? "#475569" : "#CBD5E1",
                  textDecoration: task.status === "done" ? "line-through" : "none",
                  flex: 1,
                }}>
                  {task.title}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#475569" }}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}