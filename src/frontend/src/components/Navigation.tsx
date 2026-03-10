import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Radio,
  Shield,
  User,
} from "lucide-react";
import type { AppRole } from "../App";
import { Role } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface NavigationProps {
  role: AppRole;
  currentPage: "dashboard" | "profile";
  onNavigate: (page: "dashboard" | "profile") => void;
  onRoleChange: () => void;
}

const roleLabels: Record<string, string> = {
  [Role.admin]: "Admin",
  [Role.campus_police]: "Campus Police",
  [Role.security_guard]: "Security Guard",
  [Role.student]: "Student",
};

const roleColors: Record<string, string> = {
  [Role.admin]: "bg-critical border-critical text-white",
  [Role.campus_police]: "bg-high border-high text-white",
  [Role.security_guard]: "bg-info border-info text-white",
  [Role.student]: "bg-safe border-safe text-white",
};

export default function Navigation({
  role,
  currentPage,
  onNavigate,
  onRoleChange,
}: NavigationProps) {
  const { clear, identity } = useInternetIdentity();

  const handleLogout = () => {
    clear();
    onRoleChange();
  };

  const principalShort = `${identity?.getPrincipal().toString().slice(0, 8)}...`;

  return (
    <header className="sticky top-0 z-50 border-b border-border panel-glass">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/assets/generated/campus-shield-logo-transparent.dim_200x200.png"
              alt="Campus Shield"
              className="w-8 h-8 object-contain"
            />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-safe animate-pulse-dot" />
          </div>
          <div>
            <span className="font-display font-bold text-sm text-foreground tracking-tight">
              SmartCampus
            </span>
            <span className="hidden sm:block font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              Security Ecosystem
            </span>
          </div>
        </div>

        {/* Center nav */}
        <nav className="flex items-center gap-1">
          <Button
            variant={currentPage === "dashboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => onNavigate("dashboard")}
            data-ocid="nav.student_dashboard.link"
            className="gap-2 text-xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <Button
            variant={currentPage === "profile" ? "default" : "ghost"}
            size="sm"
            onClick={() => onNavigate("profile")}
            data-ocid="nav.profile.link"
            className="gap-2 text-xs"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Radio className="w-3 h-3 text-safe animate-pulse-dot" />
            <span className="font-mono">LIVE</span>
          </div>

          {/* Role badge */}
          {role && (
            <Badge
              variant="outline"
              className={`hidden sm:flex text-xs font-mono ${roleColors[role] || ""}`}
            >
              {roleLabels[role] || role}
            </Badge>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs font-mono"
              >
                <span className="hidden md:inline text-muted-foreground truncate max-w-[100px]">
                  {principalShort}
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-popover border-border"
            >
              <DropdownMenuItem
                onClick={() => onNavigate("profile")}
                className="gap-2 text-xs"
                data-ocid="nav.admin_dashboard.link"
              >
                <User className="w-3.5 h-3.5" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onRoleChange}
                className="gap-2 text-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                Switch Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="gap-2 text-xs text-destructive focus:text-destructive"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
