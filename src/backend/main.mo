import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  module UserProfile {
    public type Role = {
      #student;
      #security_guard;
      #admin;
      #campus_police;
    };

    public type MedicalInfo = {
      bloodType : Text;
      medicalConditions : Text;
    };

    public type EmergencyContact = {
      name : Text;
      phone : Text;
    };

    public type Profile = {
      name : Text;
      studentId : Text;
      phone : Text;
      medicalInfo : MedicalInfo;
      emergencyContact : EmergencyContact;
      role : Role;
    };

    public func compare(profile1 : Profile, profile2 : Profile) : Order.Order {
      Text.compare(profile1.name, profile2.name);
    };
  };

  module WalkSession {
    public type Status = {
      #active;
      #completed;
      #missed;
    };

    public type Session = {
      user : Principal;
      zoneName : Text;
      expectedArrivalTime : Time.Time;
      status : Status;
      startTime : Time.Time;
    };
  };

  module Incident {
    public type Type = {
      #voice_alert;
      #safe_walk_missed;
      #safe_zone_missed;
      #route_deviation;
      #unusual_stop;
      #suspicious_sound;
      #suspicious_activity;
    };

    public type Status = {
      #new;
      #acknowledged;
      #resolved;
    };

    public type Report = {
      incidentType : Type;
      locationZone : Text;
      description : Text;
      reporter : Principal;
      timestamp : Time.Time;
      status : Status;
    };
  };

  module Alert {
    public type Severity = {
      #low;
      #medium;
      #high;
      #critical;
    };

    public type RecipientRole = {
      #all;
      #security_guard;
      #campus_police;
      #admin;
    };

    public type Status = {
      #new;
      #acknowledged;
      #resolved;
    };

    public type AlertInfo = {
      severity : Severity;
      recipientRole : RecipientRole;
      incidentId : Nat;
      status : Status;
      acknowledgedBy : ?Principal;
      timestamp : Time.Time;
    };
  };

  module SafeZone {
    public type Status = {
      #pending;
      #arrived;
      #missed;
    };

    public type Zone = {
      name : Text;
      expectedArrivalTime : Time.Time;
      status : Status;
    };
  };

  // Storage
  let userProfiles = Map.empty<Principal, UserProfile.Profile>();
  let walkSessions = Map.empty<Nat, WalkSession.Session>();
  let incidents = Map.empty<Nat, Incident.Report>();
  let alerts = Map.empty<Nat, Alert.AlertInfo>();
  let safeZones = Map.empty<Principal, List.List<SafeZone.Zone>>();
  let riskHeatmap = Map.empty<Text, Nat>();

  var nextWalkSessionId = 0;
  var nextIncidentId = 0;
  var nextAlertId = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper function to check if caller is security personnel
  func isSecurityPersonnel(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (#security_guard) { true };
          case (#campus_police) { true };
          case (#admin) { true };
          case (#student) { false };
        };
      };
    };
  };

  // Helper function to check if caller has admin role in profile
  func isProfileAdmin(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (#admin) { true };
          case (_) { false };
        };
      };
    };
  };

  // Admin functions
  public query ({ caller }) func getAllUsers() : async [UserProfile.Profile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    userProfiles.values().toArray().sort();
  };

  public query ({ caller }) func getAllIncidents() : async [Incident.Report] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    incidents.values().toArray();
  };

  public query ({ caller }) func getAllAlerts() : async [Alert.AlertInfo] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    alerts.values().toArray();
  };

  public shared ({ caller }) func updateAlertStatus(alertId : Nat, status : Alert.Status) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (alerts.get(alertId)) {
      case (null) { Runtime.trap("Alert not found") };
      case (?alert) {
        let updatedAlert = {
          alert with
          status
        };
        alerts.add(alertId, updatedAlert);
      };
    };
  };

  public query ({ caller }) func getStudentMedicalInfo(student : Principal) : async ?UserProfile.MedicalInfo {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (userProfiles.get(student)) {
      case (null) { null };
      case (?profile) { ?profile.medicalInfo };
    };
  };

  public query ({ caller }) func getRiskHeatmapData() : async [(Text, Nat)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    riskHeatmap.toArray();
  };

  // Student functions
  public shared ({ caller }) func createOrUpdateProfile(profile : UserProfile.Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create or update profiles");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        if (profile.role != #student) {
          Runtime.trap("Cannot create non-student profile");
        };
      };
      case (?existingProfile) {
        if (existingProfile.role != #student) {
          Runtime.trap("Cannot update non-student profile");
        };
      };
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getOwnProfile() : async ?UserProfile.Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func startWalkSession(zoneName : Text, expectedArrivalTime : Time.Time) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start walk sessions");
    };

    let sessionId = nextWalkSessionId;
    nextWalkSessionId += 1;

    let session = {
      user = caller;
      zoneName;
      expectedArrivalTime;
      status = #active;
      startTime = Time.now();
    };

    walkSessions.add(sessionId, session);
    sessionId;
  };

  public shared ({ caller }) func endWalkSession(sessionId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can end walk sessions");
    };

    switch (walkSessions.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?session) {
        if (session.user != caller) {
          Runtime.trap("Unauthorized: Can only end your own session");
        };
        let updatedSession = {
          session with
          status = #completed
        };
        walkSessions.add(sessionId, updatedSession);
      };
    };
  };

  public shared ({ caller }) func reportIncident(incidentType : Incident.Type, locationZone : Text, description : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can report incidents");
    };

    let incidentId = nextIncidentId;
    nextIncidentId += 1;

    let incident = {
      incidentType;
      locationZone;
      description;
      reporter = caller;
      timestamp = Time.now();
      status = #new;
    };

    incidents.add(incidentId, incident);
    incidentId;
  };

  public query ({ caller }) func getOwnIncidents() : async [Incident.Report] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view incidents");
    };

    incidents.values().toArray().filter(
      func(incident) {
        incident.reporter == caller;
      }
    );
  };

  public shared ({ caller }) func setSafeZoneCheckIn(zoneName : Text, expectedArrivalTime : Time.Time, status : SafeZone.Status) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set safe zone check-ins");
    };

    let newZone = {
      name = zoneName;
      expectedArrivalTime;
      status;
    };

    let existingZones = switch (safeZones.get(caller)) {
      case (null) { List.empty<SafeZone.Zone>() };
      case (?zones) { zones };
    };

    existingZones.add(newZone);
    safeZones.add(caller, existingZones);
  };

  public query ({ caller }) func getMedicalInfo() : async ?UserProfile.MedicalInfo {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view medical info");
    };

    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) { ?profile.medicalInfo };
    };
  };

  // Security/Police functions
  public query ({ caller }) func getAllSecurityAlerts() : async [Alert.AlertInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view alerts");
    };

    if (not (isSecurityPersonnel(caller))) {
      Runtime.trap("Unauthorized: Only security personnel can view alerts");
    };

    let matchingAlerts = List.empty<Alert.AlertInfo>();

    for ((id, alert) in alerts.entries()) {
      switch (alert.recipientRole) {
        case (#all) { matchingAlerts.add(alert) };
        case (#security_guard) {
          matchingAlerts.add(alert);
        };
        case (#campus_police) {
          matchingAlerts.add(alert);
        };
        case (#admin) {
          if (isProfileAdmin(caller)) {
            matchingAlerts.add(alert);
          };
        };
      };
    };

    matchingAlerts.toArray();
  };

  public shared ({ caller }) func acknowledgeAlert(alertId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can acknowledge alerts");
    };

    if (not (isSecurityPersonnel(caller))) {
      Runtime.trap("Unauthorized: Only security personnel can acknowledge alerts");
    };

    switch (alerts.get(alertId)) {
      case (null) { Runtime.trap("Alert not found") };
      case (?alert) {
        let updatedAlert = {
          alert with
          status = #acknowledged;
          acknowledgedBy = ?caller;
        };
        alerts.add(alertId, updatedAlert);
      };
    };
  };

  public shared ({ caller }) func resolveAlert(alertId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can resolve alerts");
    };

    if (not (isSecurityPersonnel(caller))) {
      Runtime.trap("Unauthorized: Only security personnel can resolve alerts");
    };

    switch (alerts.get(alertId)) {
      case (null) { Runtime.trap("Alert not found") };
      case (?alert) {
        let updatedAlert = {
          alert with
          status = #resolved;
          acknowledgedBy = ?caller;
        };
        alerts.add(alertId, updatedAlert);
      };
    };
  };

  public query ({ caller }) func getIncidentDetails(incidentId : Nat) : async ?Incident.Report {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view incident details");
    };

    if (not (isSecurityPersonnel(caller))) {
      Runtime.trap("Unauthorized: Only security personnel can view incident details");
    };

    switch (incidents.get(incidentId)) {
      case (null) { null };
      case (?incident) { ?incident };
    };
  };

  public query ({ caller }) func getStudentMedicalInfoForIncident(student : Principal) : async ?UserProfile.MedicalInfo {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view medical info");
    };

    if (not (isSecurityPersonnel(caller))) {
      Runtime.trap("Unauthorized: Only security personnel can view student medical info");
    };

    switch (userProfiles.get(student)) {
      case (null) { null };
      case (?profile) { ?profile.medicalInfo };
    };
  };

  // Required frontend interface functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile.Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile.Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile.Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };
};
