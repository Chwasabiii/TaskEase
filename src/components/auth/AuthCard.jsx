import Card from "../ui/Card";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <Card title={title} subtitle={subtitle} style={{ maxWidth: "460px", padding: "2rem" }}>
      {children}
    </Card>
  );
}


