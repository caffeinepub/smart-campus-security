import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  HeartPulse,
  MapPin,
  Mic,
  Navigation2,
  PersonStanding,
  Timer,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Status, Status__1, Type } from "../backend.d";
import {
  useEndWalkSession,
  useMedicalInfo,
  useOwnIncidents,
  useReportIncident,
  useSetSafeZoneCheckIn,
  useStartWalkSession,
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

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  voice_alert: "Voice Alert",
  safe_zone_missed: "Safe Zone Missed",
  safe_walk_missed: "Safe Walk Missed",
  suspicious_activity: "Suspicious Activity",
  route_deviation: "Route Deviation",
  unusual_stop: "Unusual Stop",
  suspicious_sound: "Suspicious Sound",
};

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString();
}

function getStatusBadge(status: Status) {
  switch (status) {
    case Status.new_:
      return (
        <Badge className="bg-critical/20 text-critical border-critical/40 text-xs">
          New
        </Badge>
      );
    case Status.acknowledged:
      return (
        <Badge className="bg-medium/20 text-medium border-medium/40 text-xs">
          Active
        </Badge>
      );
    case Status.resolved:
      return (
        <Badge className="bg-safe/20 text-safe border-safe/40 text-xs">
          Resolved
        </Badge>
      );
    default:
      return null;
  }
}

interface WalkSession {
  sessionId: bigint;
  zone: string;
  startTime: number;
}

export default function StudentDashboard() {
  const [voiceAlertOpen, setVoiceAlertOpen] = useState(false);
  const [voiceAlertZone, setVoiceAlertZone] = useState("");
  const [safeZoneOpen, setSafeZoneOpen] = useState(false);
  const [safeZone, setSafeZone] = useState("");
  const [safeZoneTime, setSafeZoneTime] = useState("");
  const [safeWalkOpen, setSafeWalkOpen] = useState(false);
  const [walkZone, setWalkZone] = useState("");
  const [walkTime, setWalkTime] = useState("");
  const [activeWalk, setActiveWalk] = useState<WalkSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [medicalInfoOpen, setMedicalInfoOpen] = useState(false);

  const { data: incidents, isLoading: incidentsLoading } = useOwnIncidents();
  const { data: medicalInfo } = useMedicalInfo();
  const reportIncident = useReportIncident();
  const startWalk = useStartWalkSession();
  const endWalk = useEndWalkSession();
  const setSafeZoneCheckIn = useSetSafeZoneCheckIn();

  // Elapsed timer for walk session
  useEffect(() => {
    if (!activeWalk) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeWalk.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWalk]);

  const handleVoiceAlert = useCallback(async () => {
    if (!voiceAlertZone) {
      toast.error("Please select a zone first");
      return;
    }
    try {
      await reportIncident.mutateAsync({
        incidentType: Type.voice_alert,
        locationZone: voiceAlertZone,
        description: "Emergency voice alert triggered",
      });
      toast.success("Emergency alert sent! Help is on the way.", {
        duration: 5000,
        icon: "🚨",
      });
      setVoiceAlertOpen(false);
      setVoiceAlertZone("");
    } catch {
      toast.error("Failed to send alert. Please try again.");
    }
  }, [voiceAlertZone, reportIncident]);

  const handleStartWalk = useCallback(async () => {
    if (!walkZone) {
      toast.error("Please select a destination zone");
      return;
    }
    const arrivalTime = walkTime
      ? BigInt(new Date(walkTime).getTime() * 1_000_000)
      : BigInt(Date.now() + 30 * 60 * 1000) * BigInt(1_000_000);
    try {
      const sessionId = await startWalk.mutateAsync({
        zoneName: walkZone,
        expectedArrivalTime: arrivalTime,
      });
      setActiveWalk({ sessionId, zone: walkZone, startTime: Date.now() });
      setSafeWalkOpen(false);
      toast.success(`Safe Walk started to ${walkZone}`, { icon: "🚶" });
    } catch {
      toast.error("Failed to start walk session");
    }
  }, [walkZone, walkTime, startWalk]);

  const handleEndWalk = useCallback(async () => {
    if (!activeWalk) return;
    try {
      await endWalk.mutateAsync(activeWalk.sessionId);
      setActiveWalk(null);
      setElapsed(0);
      toast.success("Safe Walk ended. Stay safe!", { icon: "✅" });
    } catch {
      toast.error("Failed to end walk session");
    }
  }, [activeWalk, endWalk]);

  const handleSafeZone = useCallback(async () => {
    if (!safeZone) {
      toast.error("Please select a zone");
      return;
    }
    const arrivalTime = safeZoneTime
      ? BigInt(new Date(safeZoneTime).getTime() * 1_000_000)
      : BigInt(Date.now() + 20 * 60 * 1000) * BigInt(1_000_000);
    try {
      await setSafeZoneCheckIn.mutateAsync({
        zoneName: safeZone,
        expectedArrivalTime: arrivalTime,
        status: Status__1.pending,
      });
      toast.success(`Check-in set for ${safeZone}`, { icon: "📍" });
      setSafeZoneOpen(false);
      setSafeZone("");
      setSafeZoneTime("");
    } catch {
      toast.error("Failed to set safe zone check-in");
    }
  }, [safeZone, safeZoneTime, setSafeZoneCheckIn]);

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const actionCards = [
    {
      id: "voice-alert",
      title: "Secret Voice Alert",
      subtitle: "Code Word Activated",
      description: "Trigger an emergency alert instantly",
      icon: Mic,
      color: "from-critical/20 to-critical/5",
      borderColor: "border-critical/40 hover:border-critical",
      iconBg: "bg-critical/20 text-critical",
      glowClass: "hover:glow-critical",
      action: () => setVoiceAlertOpen(true),
      ocid: "student.voice_alert.button",
      urgent: true,
    },
    {
      id: "safe-walk",
      title: "Safe Walk Mode",
      subtitle: activeWalk ? `Walking to ${activeWalk.zone}` : "Walking Alone",
      description: activeWalk
        ? `Elapsed: ${formatElapsed(elapsed)}`
        : "Track your walk session",
      icon: PersonStanding,
      color: activeWalk
        ? "from-safe/20 to-safe/5"
        : "from-primary/20 to-primary/5",
      borderColor: activeWalk
        ? "border-safe/60 hover:border-safe"
        : "border-primary/40 hover:border-primary",
      iconBg: activeWalk
        ? "bg-safe/20 text-safe"
        : "bg-primary/20 text-primary",
      glowClass: activeWalk ? "hover:glow-safe" : "hover:glow-primary",
      action: activeWalk ? handleEndWalk : () => setSafeWalkOpen(true),
      ocid: "student.safe_walk.toggle",
      active: !!activeWalk,
    },
    {
      id: "safe-zone",
      title: "Smart Safe Zone",
      subtitle: "Expected Time Missed",
      description: "Set a safe zone check-in time",
      icon: MapPin,
      color: "from-safe/20 to-safe/5",
      borderColor: "border-safe/40 hover:border-safe",
      iconBg: "bg-safe/20 text-safe",
      glowClass: "hover:glow-safe",
      action: () => setSafeZoneOpen(true),
      ocid: "student.safe_zone.button",
    },
    {
      id: "medical-info",
      title: "Emergency Info",
      subtitle: "Show Medical Details",
      description: "View your emergency medical profile",
      icon: HeartPulse,
      color: "from-info/20 to-info/5",
      borderColor: "border-info/40 hover:border-info",
      iconBg: "bg-info/20 text-info",
      glowClass: "hover:glow-info",
      action: () => setMedicalInfoOpen(true),
      ocid: "student.medical_info.button",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Active Walk Banner */}
      <AnimatePresence>
        {activeWalk && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-lg border border-safe/50 bg-safe/10 p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-safe animate-pulse-dot" />
                <div className="absolute inset-0 rounded-full bg-safe animate-pulse-ring" />
              </div>
              <div>
                <p className="text-sm font-semibold text-safe">
                  Safe Walk Active
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Navigation2 className="w-3 h-3" />
                  {activeWalk.zone} • <Timer className="w-3 h-3" />
                  <span className="font-mono">{formatElapsed(elapsed)}</span>
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEndWalk}
              data-ocid="walk.end.button"
              className="border-safe/40 text-safe hover:bg-safe/10 text-xs"
            >
              End Walk
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Student Safety Hub
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your personal campus safety tools
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {actionCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <button
                type="button"
                onClick={card.action}
                data-ocid={card.ocid}
                className={`
                  w-full relative rounded-xl border-2 p-4 text-left
                  bg-gradient-to-br ${card.color}
                  ${card.borderColor}
                  ${card.glowClass}
                  transition-all duration-200 hover:scale-[1.02]
                  ${card.urgent ? "hover:animate-pulse" : ""}
                `}
              >
                {card.active && (
                  <div className="absolute top-3 right-3">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-safe animate-pulse-dot" />
                      <div className="absolute inset-0 rounded-full bg-safe animate-pulse-ring" />
                    </div>
                  </div>
                )}
                {card.urgent && (
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-bold text-critical font-mono animate-blink">
                      SOS
                    </span>
                  </div>
                )}
                <div
                  className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center mb-3`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-foreground leading-tight">
                  {card.title}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  {card.subtitle}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                  {card.description}
                </p>
                <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-muted-foreground/50" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Incidents */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {incidentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-14 w-full bg-muted/20 rounded-lg"
                  />
                ))}
              </div>
            ) : !incidents || incidents.length === 0 ? (
              <div
                data-ocid="incident.list.empty_state"
                className="flex flex-col items-center justify-center h-40 text-center"
              >
                <CheckCircle className="w-10 h-10 text-safe/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No incidents reported
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Your campus activity looks safe
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {incidents.map((incident, idx) => (
                  <motion.div
                    key={`${incident.timestamp.toString()}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                    data-ocid={`incident.list.item.${idx + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {INCIDENT_TYPE_LABELS[incident.incidentType] ||
                          incident.incidentType}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {incident.locationZone} •{" "}
                        {formatTimestamp(incident.timestamp)}
                      </p>
                    </div>
                    <div className="ml-2">
                      {getStatusBadge(incident.status)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ─── Voice Alert Dialog ─────────────────────────────────────────────── */}
      <Dialog open={voiceAlertOpen} onOpenChange={setVoiceAlertOpen}>
        <DialogContent
          className="bg-popover border-critical/40 max-w-sm"
          data-ocid="voice_alert.confirm.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-critical font-display">
              <AlertTriangle className="w-5 h-5 animate-pulse-dot" />
              Emergency Voice Alert
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              This will immediately notify campus security. Confirm only in a
              real emergency.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Current Location Zone
            </Label>
            <Select onValueChange={setVoiceAlertZone} value={voiceAlertZone}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select your current zone" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {CAMPUS_ZONES.map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setVoiceAlertOpen(false)}
              data-ocid="voice_alert.confirm.cancel_button"
              className="border-border"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleVoiceAlert}
              disabled={reportIncident.isPending || !voiceAlertZone}
              data-ocid="voice_alert.confirm.confirm_button"
              className="bg-critical hover:bg-critical/80 text-white glow-critical"
            >
              {reportIncident.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Mic className="w-4 h-4 mr-2" />
              )}
              Send Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Safe Walk Dialog ───────────────────────────────────────────────── */}
      <Dialog open={safeWalkOpen} onOpenChange={setSafeWalkOpen}>
        <DialogContent className="bg-popover border-primary/40 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-primary">
              <PersonStanding className="w-5 h-5" />
              Start Safe Walk
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Campus security will monitor your walk. You'll be alerted if you
              don't arrive on time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Destination Zone
              </Label>
              <Select onValueChange={setWalkZone} value={walkZone}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {CAMPUS_ZONES.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Expected Arrival (optional)
              </Label>
              <Input
                type="datetime-local"
                value={walkTime}
                onChange={(e) => setWalkTime(e.target.value)}
                className="bg-input border-border text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSafeWalkOpen(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartWalk}
              disabled={startWalk.isPending || !walkZone}
              data-ocid="walk.start.button"
              className="bg-primary"
            >
              {startWalk.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <PersonStanding className="w-4 h-4 mr-2" />
              )}
              Start Walk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Safe Zone Dialog ───────────────────────────────────────────────── */}
      <Dialog open={safeZoneOpen} onOpenChange={setSafeZoneOpen}>
        <DialogContent className="bg-popover border-safe/40 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-safe">
              <MapPin className="w-5 h-5" />
              Safe Zone Check-In
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Set your expected arrival time. Security will be alerted if you
              don't check in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Destination Zone
              </Label>
              <Select onValueChange={setSafeZone} value={safeZone}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {CAMPUS_ZONES.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Expected Arrival Time
              </Label>
              <Input
                type="datetime-local"
                value={safeZoneTime}
                onChange={(e) => setSafeZoneTime(e.target.value)}
                className="bg-input border-border text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSafeZoneOpen(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSafeZone}
              disabled={setSafeZoneCheckIn.isPending || !safeZone}
              className="bg-safe hover:bg-safe/80 text-white"
              style={{ background: "oklch(0.58 0.18 145)" }}
            >
              {setSafeZoneCheckIn.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              Set Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Medical Info Dialog ──────────────────────────────────────────────── */}
      <Dialog open={medicalInfoOpen} onOpenChange={setMedicalInfoOpen}>
        <DialogContent className="bg-popover border-info/40 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-info">
              <HeartPulse className="w-5 h-5" />
              Emergency Medical Info
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Your medical details visible to first responders
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {medicalInfo ? (
              <>
                <div className="rounded-lg bg-muted/20 p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">
                      Blood Type
                    </span>
                    <span className="text-sm font-bold text-info font-mono">
                      {medicalInfo.bloodType || "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">
                      Medical Conditions
                    </span>
                    <p className="text-sm text-foreground">
                      {medicalInfo.medicalConditions || "None recorded"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Update your info in Profile settings
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <HeartPulse className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No medical info on file
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Go to Profile to add your details
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMedicalInfoOpen(false)}
              className="w-full border-border"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
