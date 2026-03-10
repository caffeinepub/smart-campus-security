import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Profile {
    studentId: string;
    name: string;
    role: Role;
    emergencyContact: EmergencyContact;
    phone: string;
    medicalInfo: MedicalInfo;
}
export type Time = bigint;
export interface MedicalInfo {
    bloodType: string;
    medicalConditions: string;
}
export interface EmergencyContact {
    name: string;
    phone: string;
}
export interface AlertInfo {
    status: Status;
    incidentId: bigint;
    acknowledgedBy?: Principal;
    timestamp: Time;
    severity: Severity;
    recipientRole: RecipientRole;
}
export interface Report {
    status: Status;
    description: string;
    timestamp: Time;
    locationZone: string;
    reporter: Principal;
    incidentType: Type;
}
export enum RecipientRole {
    all = "all",
    admin = "admin",
    campus_police = "campus_police",
    security_guard = "security_guard"
}
export enum Role {
    admin = "admin",
    campus_police = "campus_police",
    security_guard = "security_guard",
    student = "student"
}
export enum Severity {
    low = "low",
    high = "high",
    critical = "critical",
    medium = "medium"
}
export enum Status {
    new_ = "new",
    resolved = "resolved",
    acknowledged = "acknowledged"
}
export enum Status__1 {
    pending = "pending",
    arrived = "arrived",
    missed = "missed"
}
export enum Type {
    unusual_stop = "unusual_stop",
    safe_zone_missed = "safe_zone_missed",
    suspicious_activity = "suspicious_activity",
    safe_walk_missed = "safe_walk_missed",
    route_deviation = "route_deviation",
    voice_alert = "voice_alert",
    suspicious_sound = "suspicious_sound"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acknowledgeAlert(alertId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrUpdateProfile(profile: Profile): Promise<void>;
    endWalkSession(sessionId: bigint): Promise<void>;
    getAllAlerts(): Promise<Array<AlertInfo>>;
    getAllIncidents(): Promise<Array<Report>>;
    getAllSecurityAlerts(): Promise<Array<AlertInfo>>;
    getAllUsers(): Promise<Array<Profile>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getIncidentDetails(incidentId: bigint): Promise<Report | null>;
    getMedicalInfo(): Promise<MedicalInfo | null>;
    getOwnIncidents(): Promise<Array<Report>>;
    getOwnProfile(): Promise<Profile | null>;
    getRiskHeatmapData(): Promise<Array<[string, bigint]>>;
    getStudentMedicalInfo(student: Principal): Promise<MedicalInfo | null>;
    getStudentMedicalInfoForIncident(student: Principal): Promise<MedicalInfo | null>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    isCallerAdmin(): Promise<boolean>;
    reportIncident(incidentType: Type, locationZone: string, description: string): Promise<bigint>;
    resolveAlert(alertId: bigint): Promise<void>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    setSafeZoneCheckIn(zoneName: string, expectedArrivalTime: Time, status: Status__1): Promise<void>;
    startWalkSession(zoneName: string, expectedArrivalTime: Time): Promise<bigint>;
    updateAlertStatus(alertId: bigint, status: Status): Promise<void>;
}
