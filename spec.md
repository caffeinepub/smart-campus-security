# Smart Campus Security Ecosystem

## Current State
New project. No existing backend or frontend implementation.

## Requested Changes (Diff)

### Add

**User Actions (Student/User Panel):**
- Secret Voice Alert trigger ("Code Word Activated") - emergency panic button
- Safe Walk Mode toggle ("Walking Alone") - activates walk monitoring session
- Smart Safe Zone Alert ("Expected Time Missed") - set expected arrival time/location
- Emergency Info Display ("Show Medical Details") - view/store personal medical info

**AI Monitoring (Simulated):**
- Route Deviation Detection - flag when user deviates from expected route
- Unusual Stop Detection - flag when user stops unexpectedly for too long
- Suspicious Sound Alert - report suspicious sounds in area

**Admin Dashboard (Campus Security Hub):**
- Instant Alerts panel - real-time list of incoming alerts
- Live Location Tracking - view active user locations on a grid/map
- Suspicious Activity Clips - log of flagged activity events
- Student Medical Info - access student emergency medical records
- Incident Logs - full history of all incidents
- Risk Heatmap - visual representation of high-risk zones by frequency

**Alert Management:**
- Alerts dispatch to Campus Police and Security Guards (role-based view)
- Alert status tracking (new, acknowledged, resolved)

**Data Models:**
- Users (students/staff) with profile and medical info
- Incidents with type, location, timestamp, status
- Alerts with severity, recipient role, and status
- Walk sessions with start time, route, and status
- Safe zones with expected arrival times

### Modify
- None (new project)

### Remove
- None (new project)

## Implementation Plan

**Backend (Motoko):**
1. User profile management (name, student ID, medical info, emergency contacts)
2. Incident reporting and storage (type: voice_alert, safe_walk, safe_zone_missed, suspicious_sound, route_deviation, unusual_stop)
3. Alert management CRUD (create, list, update status)
4. Walk session management (start, end, status)
5. Safe zone check-in management
6. Admin queries: list all incidents, list all alerts, get student medical info
7. Risk heatmap data (location-based incident frequency)

**Frontend:**
1. Role-based navigation: Student view and Admin/Security view
2. Student dashboard: 4 action buttons (panic, safe walk, safe zone, medical info)
3. Admin dashboard: 4 hub panels (alerts, location tracking, activity clips, medical info)
4. Incident log table with filters
5. Risk heatmap grid (campus zones with color-coded risk levels)
6. Alert notification feed with status controls
7. Medical info form for students
8. Walk session active state UI
