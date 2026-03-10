import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AlertInfo,
  MedicalInfo,
  Profile,
  Report,
  Status,
  Status__1,
  Type,
  UserRole,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Profile ────────────────────────────────────────────────────────────────

export function useOwnProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<Profile | null>({
    queryKey: ["ownProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOwnProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<Profile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole | null>({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Profile) => {
      if (!actor) throw new Error("No actor");
      return actor.createOrUpdateProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownProfile"] });
    },
  });
}

// ─── Incidents ───────────────────────────────────────────────────────────────

export function useOwnIncidents() {
  const { actor, isFetching } = useActor();
  return useQuery<Report[]>({
    queryKey: ["ownIncidents"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOwnIncidents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllIncidents() {
  const { actor, isFetching } = useActor();
  return useQuery<Report[]>({
    queryKey: ["allIncidents"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllIncidents();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useReportIncident() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      incidentType,
      locationZone,
      description,
    }: {
      incidentType: Type;
      locationZone: string;
      description: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.reportIncident(incidentType, locationZone, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownIncidents"] });
      queryClient.invalidateQueries({ queryKey: ["allIncidents"] });
      queryClient.invalidateQueries({ queryKey: ["allAlerts"] });
    },
  });
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export function useAllAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery<AlertInfo[]>({
    queryKey: ["allAlerts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAlerts();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useAcknowledgeAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.acknowledgeAlert(alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAlerts"] });
    },
  });
}

export function useResolveAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.resolveAlert(alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAlerts"] });
    },
  });
}

export function useUpdateAlertStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      alertId,
      status,
    }: { alertId: bigint; status: Status }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateAlertStatus(alertId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAlerts"] });
    },
  });
}

// ─── Walk Sessions ───────────────────────────────────────────────────────────

export function useStartWalkSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      zoneName,
      expectedArrivalTime,
    }: {
      zoneName: string;
      expectedArrivalTime: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.startWalkSession(zoneName, expectedArrivalTime);
    },
  });
}

export function useEndWalkSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (sessionId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.endWalkSession(sessionId);
    },
  });
}

// ─── Safe Zones ──────────────────────────────────────────────────────────────

export function useSetSafeZoneCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      zoneName,
      expectedArrivalTime,
      status,
    }: {
      zoneName: string;
      expectedArrivalTime: bigint;
      status: Status__1;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.setSafeZoneCheckIn(zoneName, expectedArrivalTime, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownIncidents"] });
    },
  });
}

// ─── Medical Info ─────────────────────────────────────────────────────────────

export function useMedicalInfo() {
  const { actor, isFetching } = useActor();
  return useQuery<MedicalInfo | null>({
    queryKey: ["medicalInfo"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMedicalInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

export function useRiskHeatmapData() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["riskHeatmap"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRiskHeatmapData();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}
