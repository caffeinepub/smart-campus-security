import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { Role } from "./backend.d";
import Navigation from "./components/Navigation";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import StudentDashboard from "./pages/StudentDashboard";

export type AppRole = Role | null;

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [selectedRole, setSelectedRole] = useState<AppRole>(null);
  const [currentPage, setCurrentPage] = useState<"dashboard" | "profile">(
    "dashboard",
  );

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse-ring" />
            <div
              className="absolute inset-2 rounded-full border-2 border-primary/60 animate-pulse-ring"
              style={{ animationDelay: "0.5s" }}
            />
            <div className="absolute inset-4 rounded-full bg-primary/80 animate-pulse-dot" />
          </div>
          <p className="text-muted-foreground text-sm font-mono tracking-widest uppercase">
            Initializing Secure Session
          </p>
        </div>
      </div>
    );
  }

  if (!identity || !selectedRole) {
    return (
      <>
        <LoginPage onRoleSelect={setSelectedRole} />
        <Toaster theme="dark" position="top-right" />
      </>
    );
  }

  const isAdmin =
    selectedRole === Role.admin ||
    selectedRole === Role.campus_police ||
    selectedRole === Role.security_guard;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation
        role={selectedRole}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onRoleChange={() => setSelectedRole(null)}
      />
      <main className="flex-1">
        {currentPage === "profile" ? (
          <ProfilePage />
        ) : isAdmin ? (
          <AdminDashboard />
        ) : (
          <StudentDashboard />
        )}
      </main>
      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
