import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  Cpu,
  Eye,
  Lock,
  Radio,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { AppRole } from "../App";
import { Role } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LoginPageProps {
  onRoleSelect: (role: AppRole) => void;
}

const roles = [
  {
    role: Role.student,
    label: "Student",
    description: "Personal safety tools & incident reporting",
    icon: Users,
    color: "border-safe text-safe hover:bg-safe/10",
    badge: "Safe",
    badgeClass: "bg-safe/20 text-safe border-safe/40",
  },
  {
    role: Role.security_guard,
    label: "Security Guard",
    description: "Patrol monitoring & alert management",
    icon: Eye,
    color: "border-info text-info hover:bg-info/10",
    badge: "Guard",
    badgeClass: "bg-info/20 text-info border-info/40",
  },
  {
    role: Role.campus_police,
    label: "Campus Police",
    description: "Incident response & zone oversight",
    icon: AlertTriangle,
    color: "border-high text-high hover:bg-high/10",
    badge: "Police",
    badgeClass: "bg-high/20 text-high border-high/40",
  },
  {
    role: Role.admin,
    label: "Administrator",
    description: "Full system access & dashboard control",
    icon: Cpu,
    color: "border-critical text-critical hover:bg-critical/10",
    badge: "Admin",
    badgeClass: "bg-critical/20 text-critical border-critical/40",
  },
];

const features = [
  {
    icon: Shield,
    label: "Real-time Alerts",
    desc: "Instant emergency notifications",
  },
  { icon: Radio, label: "Live Tracking", desc: "Safe walk session monitoring" },
  {
    icon: Eye,
    label: "AI Surveillance",
    desc: "Suspicious activity detection",
  },
  {
    icon: Lock,
    label: "Secure Identity",
    desc: "Internet Identity authentication",
  },
];

export default function LoginPage({ onRoleSelect }: LoginPageProps) {
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const [showRoles, setShowRoles] = useState(false);

  const handleLogin = async () => {
    if (!identity) {
      await login();
    }
    setShowRoles(true);
  };

  const handleRoleSelect = (role: AppRole) => {
    onRoleSelect(role);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.6 0.18 240) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.6 0.18 240) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse-dot" />
              <img
                src="/assets/generated/campus-shield-logo-transparent.dim_200x200.png"
                alt="Campus Shield"
                className="relative w-20 h-20 object-contain drop-shadow-lg"
              />
            </div>
          </motion.div>

          <h1 className="font-display text-4xl font-bold text-foreground mb-2 tracking-tight">
            Smart Campus
            <span
              className="block text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.62 0.18 240), oklch(0.7 0.2 200))",
              }}
            >
              Security
            </span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            AI-powered campus safety ecosystem — protecting students, staff, and
            facilities in real time.
          </p>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {features.map(({ icon: Icon, label, desc }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {label}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Login / Role selection */}
        {!showRoles ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full h-12 text-sm font-semibold glow-primary transition-all duration-300 hover:scale-[1.02]"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {identity ? "Select Role" : "Sign In with Internet Identity"}
                </>
              )}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground mt-4">
              Secured by Internet Computer Protocol • Decentralized
              Authentication
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs text-muted-foreground text-center mb-4 font-mono uppercase tracking-widest">
              Select your role to continue
            </p>
            <div className="grid grid-cols-2 gap-3">
              {roles.map(
                (
                  {
                    role,
                    label,
                    description,
                    icon: Icon,
                    color,
                    badge,
                    badgeClass,
                  },
                  idx,
                ) => (
                  <motion.button
                    key={role}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleRoleSelect(role)}
                    className={`group relative p-4 rounded-lg border-2 ${color} bg-card/50 transition-all duration-200 hover:scale-[1.02] text-left`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="w-5 h-5" />
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${badgeClass}`}
                      >
                        {badge}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {description}
                    </p>
                  </motion.button>
                ),
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRoles(false)}
              className="w-full mt-3 text-xs text-muted-foreground"
            >
              ← Back
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
