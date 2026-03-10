import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  HeartPulse,
  MapPin,
  Mic,
  Navigation2,
  PersonStanding,
  RefreshCw,
  Search,
  Thermometer,
  VolumeX,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Severity, Status, Type } from "../backend.d";
import {
  useAcknowledgeAlert,
  useAllAlerts,
  useAllIncidents,
  useAllUsers,
  useResolveAlert,
  useRiskHeatmapData,
} from "../hooks/useQueries";

const CAMPUS_ZONES = [
  "Main Gate",
  "Library",
  "Science Block",
  "Engineering Block",
  "Cafeteria",
  "Dormitory A",
  "Dormitory B",
  "Sports Complex",
  "Admin Building",
  "Parking Lot",
];

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

function getSeverityBadge(severity: Severity) {
  const cfg = {
    [Severity.critical]: {
      label: "CRITICAL",
      cls: "bg-critical/20 text-critical border-critical/40",
    },
    [Severity.high]: {
      label: "HIGH",
      cls: "bg-high/20 text-high border-high/40",
    },
    [Severity.medium]: {
      label: "MEDIUM",
      cls: "bg-medium/20 text-medium border-medium/40",
    },
    [Severity.low]: {
      label: "LOW",
      cls: "bg-low-safe/20 text-low-safe border-low-safe/40",
    },
  };
  const c = cfg[severity] || cfg[Severity.medium];
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-mono font-bold ${c.cls}`}
    >
      {c.label}
    </Badge>
  );
}

function getStatusBadge(status: Status) {
  switch (status) {
    case Status.new_:
      return (
        <Badge className="bg-critical/20 text-critical border-critical/40 text-[10px]">
          New
        </Badge>
      );
    case Status.acknowledged:
      return (
        <Badge className="bg-medium/20 text-medium border-medium/40 text-[10px]">
          Active
        </Badge>
      );
    case Status.resolved:
      return (
        <Badge className="bg-safe/20 text-safe border-safe/40 text-[10px]">
          Resolved
        </Badge>
      );
    default:
      return null;
  }
}

function getIncidentIcon(type: Type) {
  switch (type) {
    case Type.voice_alert:
      return <Mic className="w-3.5 h-3.5 text-critical" />;
    case Type.safe_walk_missed:
      return <PersonStanding className="w-3.5 h-3.5 text-high" />;
    case Type.route_deviation:
      return <Navigation2 className="w-3.5 h-3.5 text-medium" />;
    case Type.unusual_stop:
      return <Clock className="w-3.5 h-3.5 text-medium" />;
    case Type.suspicious_sound:
      return <VolumeX className="w-3.5 h-3.5 text-high" />;
    case Type.suspicious_activity:
      return <Eye className="w-3.5 h-3.5 text-critical" />;
    case Type.safe_zone_missed:
      return <MapPin className="w-3.5 h-3.5 text-high" />;
    default:
      return <AlertTriangle className="w-3.5 h-3.5 text-medium" />;
  }
}

const INCIDENT_LABELS: Record<string, string> = {
  voice_alert: "Voice Alert",
  safe_zone_missed: "Safe Zone Missed",
  safe_walk_missed: "Safe Walk Missed",
  suspicious_activity: "Suspicious Activity",
  route_deviation: "Route Deviation",
  unusual_stop: "Unusual Stop",
  suspicious_sound: "Suspicious Sound",
};

// ─── Heatmap Component ─────────────────────────────────────────────────────

function RiskHeatmap() {
  const { data: heatmapData, isLoading } = useRiskHeatmapData();

  const zoneData = useMemo(() => {
    const map = new Map<string, number>();
    if (heatmapData && heatmapData.length > 0) {
      for (const [zone, count] of heatmapData) map.set(zone, Number(count));
    } else {
      // Sample data
      const sampleData: [string, number][] = [
        ["Main Gate", 8],
        ["Library", 2],
        ["Science Block", 5],
        ["Engineering Block", 3],
        ["Cafeteria", 6],
        ["Dormitory A", 9],
        ["Dormitory B", 7],
        ["Sports Complex", 4],
        ["Admin Building", 1],
        ["Parking Lot", 11],
      ];
      for (const [z, c] of sampleData) map.set(z, c);
    }
    return map;
  }, [heatmapData]);

  const maxVal = Math.max(...Array.from(zoneData.values()), 1);

  function getHeatColor(count: number): {
    bg: string;
    text: string;
    label: string;
  } {
    const ratio = count / maxVal;
    if (ratio > 0.7)
      return {
        bg: "bg-critical/30 border-critical/50",
        text: "text-critical",
        label: "HIGH",
      };
    if (ratio > 0.4)
      return {
        bg: "bg-medium/30 border-medium/50",
        text: "text-medium",
        label: "MED",
      };
    return { bg: "bg-safe/20 border-safe/40", text: "text-safe", label: "LOW" };
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Risk Heatmap
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-safe/50 inline-block" />
            LOW
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-medium/50 inline-block" />
            MED
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-critical/50 inline-block" />
            HIGH
          </span>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-5 gap-2">
          {CAMPUS_ZONES.map((zone) => (
            <Skeleton key={zone} className="h-14 rounded-lg bg-muted/20" />
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-5 gap-2"
          data-ocid="admin.location.panel"
        >
          {CAMPUS_ZONES.map((zone) => {
            const count = zoneData.get(zone) ?? 0;
            const { bg, text, label } = getHeatColor(count);
            return (
              <div
                key={zone}
                className={`relative rounded-lg border p-2 ${bg} transition-all hover:scale-105 cursor-default`}
                data-ocid="admin.location.panel"
              >
                <p className={`text-[9px] font-bold ${text} font-mono`}>
                  {label}
                </p>
                <p className="text-[10px] text-foreground font-semibold leading-tight mt-0.5 line-clamp-2">
                  {zone}
                </p>
                <p className={`text-lg font-bold font-mono ${text} mt-1`}>
                  {count}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Location Tracker Component ───────────────────────────────────────────────

function LocationTracker() {
  const mockWalks = [
    { name: "Sarah M.", zone: "Library", elapsed: "12:34", status: "active" },
    {
      name: "James K.",
      zone: "Dormitory A",
      elapsed: "05:22",
      status: "active",
    },
    {
      name: "Priya S.",
      zone: "Science Block",
      elapsed: "08:45",
      status: "late",
    },
    { name: "Tom B.", zone: "Cafeteria", elapsed: "02:10", status: "active" },
  ];

  return (
    <div className="space-y-2">
      {mockWalks.map((walk) => (
        <div
          key={walk.name}
          className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div
                className={`w-2.5 h-2.5 rounded-full ${walk.status === "late" ? "bg-high" : "bg-safe"} animate-pulse-dot`}
              />
              {walk.status !== "late" && (
                <div className="absolute inset-0 rounded-full bg-safe animate-pulse-ring" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                {walk.name}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {walk.zone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-muted-foreground">
              {walk.elapsed}
            </p>
            {walk.status === "late" && (
              <p className="text-[10px] text-high font-bold">LATE</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>("all");
  const [incidentStatusFilter, setIncidentStatusFilter] =
    useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: alerts,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useAllAlerts();
  const { data: incidents, isLoading: incidentsLoading } = useAllIncidents();
  const { data: users } = useAllUsers();
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  const filteredIncidents = useMemo(() => {
    if (!incidents) return [];
    return incidents.filter((inc) => {
      const typeMatch =
        incidentTypeFilter === "all" || inc.incidentType === incidentTypeFilter;
      const statusMatch =
        incidentStatusFilter === "all" || inc.status === incidentStatusFilter;
      const searchMatch =
        !searchQuery ||
        inc.locationZone.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && statusMatch && searchMatch;
    });
  }, [incidents, incidentTypeFilter, incidentStatusFilter, searchQuery]);

  const handleAcknowledge = async (alertId: bigint, _idx: number) => {
    try {
      await acknowledgeAlert.mutateAsync(alertId);
      toast.success("Alert acknowledged");
    } catch {
      toast.error("Failed to acknowledge alert");
    }
  };

  const handleResolve = async (alertId: bigint) => {
    try {
      await resolveAlert.mutateAsync(alertId);
      toast.success("Alert resolved");
    } catch {
      toast.error("Failed to resolve alert");
    }
  };

  // Summary stats
  const stats = useMemo(() => {
    const total = alerts?.length ?? 0;
    const critical =
      alerts?.filter((a) => a.severity === Severity.critical).length ?? 0;
    const pending = alerts?.filter((a) => a.status === Status.new_).length ?? 0;
    const resolved =
      alerts?.filter((a) => a.status === Status.resolved).length ?? 0;
    return { total, critical, pending, resolved };
  }, [alerts]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Security Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time campus security monitoring
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchAlerts()}
          className="gap-2 border-border text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Total Alerts",
            value: stats.total,
            color: "text-info",
            icon: Bell,
          },
          {
            label: "Critical",
            value: stats.critical,
            color: "text-critical",
            icon: AlertTriangle,
          },
          {
            label: "Pending",
            value: stats.pending,
            color: "text-high",
            icon: Clock,
          },
          {
            label: "Resolved",
            value: stats.resolved,
            color: "text-safe",
            icon: CheckCircle,
          },
        ].map(({ label, value, color, icon: Icon }, idx) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    {label}
                  </p>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <p className={`text-2xl font-bold font-mono ${color}`}>
                  {value}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main 2x2 Hub Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Instant Alerts ─────────────────────────────────────────── */}
        <Card
          className="bg-card border-border lg:row-span-1"
          data-ocid="admin.alerts.panel"
        >
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Bell className="w-4 h-4 text-critical" />
              Instant Alerts
              {stats.pending > 0 && (
                <span className="w-5 h-5 rounded-full bg-critical text-white text-[10px] font-bold flex items-center justify-center animate-pulse-dot">
                  {stats.pending}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-64">
              {alertsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-lg bg-muted/20" />
                  ))}
                </div>
              ) : !alerts || alerts.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-40 text-center"
                  data-ocid="alert.list.empty_state"
                >
                  <CheckCircle className="w-8 h-8 text-safe/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No active alerts
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert, idx) => (
                    <motion.div
                      key={`${alert.incidentId.toString()}-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`p-3 rounded-lg border ${
                        alert.severity === Severity.critical
                          ? "border-critical/30 bg-critical/5"
                          : alert.severity === Severity.high
                            ? "border-high/30 bg-high/5"
                            : "border-border bg-muted/10"
                      }`}
                      data-ocid={`alert.list.item.${idx + 1}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getSeverityBadge(alert.severity)}
                          <span className="text-[11px] text-muted-foreground font-mono truncate">
                            #{alert.incidentId.toString().slice(-6)}
                          </span>
                        </div>
                        {getStatusBadge(alert.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                      {alert.status !== Status.resolved && (
                        <div className="flex gap-1.5">
                          {alert.status === Status.new_ && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleAcknowledge(alert.incidentId, idx)
                              }
                              disabled={acknowledgeAlert.isPending}
                              data-ocid={`alert.acknowledge.button.${idx + 1}`}
                              className="h-6 text-[10px] border-medium/40 text-medium hover:bg-medium/10"
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolve(alert.incidentId)}
                            disabled={resolveAlert.isPending}
                            data-ocid={`alert.resolve.button.${idx + 1}`}
                            className="h-6 text-[10px] border-safe/40 text-safe hover:bg-safe/10"
                          >
                            Resolve
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ── Live Location Tracking ──────────────────────────────────── */}
        <Card
          className="bg-card border-border"
          data-ocid="admin.location.panel"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-safe" />
              Live Location Tracking
              <span className="ml-auto flex items-center gap-1 text-[10px] text-safe font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse-dot" />
                LIVE
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <LocationTracker />
          </CardContent>
        </Card>

        {/* ── Suspicious Activity Clips ───────────────────────────────── */}
        <Card
          className="bg-card border-border"
          data-ocid="admin.activity.panel"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Eye className="w-4 h-4 text-high" />
              Suspicious Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-52">
              {incidentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 rounded bg-muted/20" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {(incidents ?? [])
                    .filter((i) =>
                      [
                        Type.route_deviation,
                        Type.unusual_stop,
                        Type.suspicious_sound,
                        Type.suspicious_activity,
                      ].includes(i.incidentType),
                    )
                    .slice(0, 8)
                    .concat(
                      // Seed data if empty
                      incidents &&
                        incidents.filter((i) =>
                          [
                            Type.route_deviation,
                            Type.unusual_stop,
                            Type.suspicious_sound,
                            Type.suspicious_activity,
                          ].includes(i.incidentType),
                        ).length === 0
                        ? [
                            {
                              incidentType: Type.suspicious_activity,
                              locationZone: "Parking Lot",
                              timestamp:
                                BigInt(Date.now() - 300000) * BigInt(1000000),
                              status: Status.new_,
                              description: "",
                              reporter: {} as any,
                            },
                            {
                              incidentType: Type.route_deviation,
                              locationZone: "Dormitory B",
                              timestamp:
                                BigInt(Date.now() - 900000) * BigInt(1000000),
                              status: Status.acknowledged,
                              description: "",
                              reporter: {} as any,
                            },
                            {
                              incidentType: Type.unusual_stop,
                              locationZone: "Sports Complex",
                              timestamp:
                                BigInt(Date.now() - 1800000) * BigInt(1000000),
                              status: Status.resolved,
                              description: "",
                              reporter: {} as any,
                            },
                            {
                              incidentType: Type.suspicious_sound,
                              locationZone: "Engineering Block",
                              timestamp:
                                BigInt(Date.now() - 3600000) * BigInt(1000000),
                              status: Status.resolved,
                              description: "",
                              reporter: {} as any,
                            },
                          ]
                        : [],
                    )
                    .map((inc, idx) => (
                      <div
                        key={`${inc.incidentType}-${inc.timestamp.toString()}-${idx}`}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                        data-ocid={`activity.list.item.${idx + 1}`}
                      >
                        <div className="w-6 h-6 rounded flex items-center justify-center bg-muted/20 shrink-0">
                          {getIncidentIcon(inc.incidentType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {INCIDENT_LABELS[inc.incidentType] ||
                              inc.incidentType}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {inc.locationZone} •{" "}
                            {formatTimestamp(inc.timestamp)}
                          </p>
                        </div>
                        {getStatusBadge(inc.status)}
                      </div>
                    ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ── Student Medical Info ─────────────────────────────────────── */}
        <Card className="bg-card border-border" data-ocid="admin.medical.panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-info" />
              Student Medical Records
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="mb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-8 h-8 text-xs bg-input border-border"
                  data-ocid="admin.medical.search_input"
                />
              </div>
            </div>
            <ScrollArea className="h-44">
              {(users ?? []).length === 0 ? (
                <div className="space-y-2">
                  {[
                    {
                      name: "Sarah Mitchell",
                      id: "STU-2024-001",
                      blood: "O+",
                      conditions: "Asthma",
                    },
                    {
                      name: "James Kowalski",
                      id: "STU-2024-047",
                      blood: "A-",
                      conditions: "None",
                    },
                    {
                      name: "Priya Sharma",
                      id: "STU-2024-112",
                      blood: "B+",
                      conditions: "Diabetes Type 1",
                    },
                    {
                      name: "Thomas Brown",
                      id: "STU-2024-089",
                      blood: "AB+",
                      conditions: "Penicillin allergy",
                    },
                  ].map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                      data-ocid={`medical.list.item.${idx + 1}`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {s.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {s.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono text-info border-info/40 bg-info/10"
                        >
                          {s.blood}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {s.conditions}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {users!.map((user, idx) => (
                    <div
                      key={`${user.studentId}-${idx}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/10"
                      data-ocid={`medical.list.item.${idx + 1}`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {user.name || "Unknown"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {user.studentId}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono text-info border-info/40"
                      >
                        {user.medicalInfo?.bloodType || "N/A"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* ─── Bottom Section: Tabs (Incidents + Heatmap) ──────────────────────── */}
      <Tabs defaultValue="incidents">
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger
            value="incidents"
            className="text-xs data-[state=active]:bg-primary"
            data-ocid="incident.filter.tab"
          >
            Incident Logs
          </TabsTrigger>
          <TabsTrigger
            value="heatmap"
            className="text-xs data-[state=active]:bg-primary"
          >
            Risk Heatmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidents">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <Select
                    value={incidentTypeFilter}
                    onValueChange={setIncidentTypeFilter}
                  >
                    <SelectTrigger
                      className="h-8 text-xs bg-input border-border w-44"
                      data-ocid="incident.filter.select"
                    >
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(INCIDENT_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={incidentStatusFilter}
                    onValueChange={setIncidentStatusFilter}
                  >
                    <SelectTrigger className="h-8 text-xs bg-input border-border w-36">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search zone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-input border-border w-40"
                    data-ocid="incident.list.search_input"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-72">
                {incidentsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-10 rounded bg-muted/20" />
                    ))}
                  </div>
                ) : filteredIncidents.length === 0 ? (
                  <div
                    className="flex items-center justify-center h-40 text-center"
                    data-ocid="incident.list.empty_state"
                  >
                    <div>
                      <CheckCircle className="w-8 h-8 text-safe/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No incidents found
                      </p>
                    </div>
                  </div>
                ) : (
                  <Table data-ocid="incident.list.table">
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-[11px] text-muted-foreground">
                          Type
                        </TableHead>
                        <TableHead className="text-[11px] text-muted-foreground">
                          Zone
                        </TableHead>
                        <TableHead className="text-[11px] text-muted-foreground">
                          Time
                        </TableHead>
                        <TableHead className="text-[11px] text-muted-foreground">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncidents.map((inc, idx) => (
                        <TableRow
                          key={`${inc.incidentType}-${inc.timestamp.toString()}-${idx}`}
                          className="border-border/50 hover:bg-muted/10"
                          data-ocid={`incident.list.row.${idx + 1}`}
                        >
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1.5">
                              {getIncidentIcon(inc.incidentType)}
                              <span className="text-xs text-foreground">
                                {INCIDENT_LABELS[inc.incidentType] ||
                                  inc.incidentType}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-xs text-muted-foreground">
                              {inc.locationZone}
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {formatTimestamp(inc.timestamp)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            {getStatusBadge(inc.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap">
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <RiskHeatmap />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
