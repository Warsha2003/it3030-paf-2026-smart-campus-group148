import ProtectedRoute from "./ProtectedRoute.jsx";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function AppRoutes() {
  return (
    <ProtectedRoute>
      <main className="app-shell">
        <section className="app-shell__intro">
          <p className="app-shell__eyebrow">Smart Campus Workspace</p>
          <h1>Frontend Workspace</h1>
          <p>
            
          </p>
        </section>
        <section className="app-shell__frame">
          <iframe
            src={backendUrl}
            title="Smart Campus Backend Starter Page"
            className="app-shell__iframe"
          />
        </section>
      </main>
    </ProtectedRoute>
  );
}
