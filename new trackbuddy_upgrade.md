# TrackBuddy Requirements & Feedback Consolidated

Source: TrackBuddy Comments08052026.pdf

## 1. Organisation & School Settings

### School-Based Access Control
- Ability to add and manage schools.
- Driver testing setup must be scoped to specific schools.
- School settings should display only information relevant to the selected school.

### Organisation Generalisation
- Rename **School Settings** to **Organisation Settings**.
- Support broader transport use cases beyond schools:
  - Factory worker transportation
  - Charter trips
  - Corporate transport operations

### OCR / File Import
- Implement OCR capability to extract information from uploaded files.

---

## 2. Student & Parent Management

### Student Data Capture
Parent or School Admin should be able to input:
- Full name
- Pickup address
- Drop-off address
- Nationality
- Mother tongue
- Child photo upload
- Student active/inactive status toggle

### Student Status Control
- Add an **Active / Not Active** toggle.
- Inactive students should be excluded from operational workflows.

### Parent Management
- Ability to edit parent details.
- Maintain parent contact information.
- Parent email and contact number should be visible to drivers for operational convenience.

---

## 3. Driver Management

### Driver Onboarding
Capture:
- Full name
- Contact details
- Address
- License number
- License image upload
- Assigned bus / vehicle
- Active status

### Driver Testing
- Driver testing workflows should be configurable per school / organisation.

### Driver Dashboard Requirements
Drivers should be able to:
- View assigned routes
- Pickup / drop-off workflow access
- View self-pick list
- View parent contact information
- View parent email addresses

---

## 4. Scheduling & Trip Management

### Student Scheduling
Students should be able to request schedule changes for:
- Extra trips
- Non-regular drop-offs
- Special transport events

Admin approval must be required before confirmation.

### Schedule Details
Capture:
- Start time
- End time
- Trip type
- Assigned students
- Child photo display

### Trip Visibility
- View complete itinerary on a single screen.
- Download trip itinerary.

### Bulk Upload
Support Excel import containing:
- Student names
- Trip schedules
- Pickup / drop details
- Full itinerary information

---

## 5. Logs & Reporting

### Pickup / Drop Logs
Admin should be able to:
- Download pickup logs
- Download drop-off logs
- Filter logs by school / organisation
- Export logs in standard downloadable formats

---

## 6. Integrations & Communications

### Email Configuration
Outgoing emails should be sent from:
`admin@ridesafe.com.my`

### WhatsApp Integration
Integrate WhatsApp communication using:
`mervin@ridesafe.com.my`

AWS services may reuse the same account where applicable.

### GPS Tracking Integration
Support integration with Wialon hosting:
- https://hosting.wialon.com/
- https://hosting.wialon.com/?lang=en

---

## 7. UI / UX Gaps Identified

### Missing Feature Investigation
Observed concern:
> "I can see this feature but I don’t see it on your page?"

Action required:
- Audit current UI against expected workflows.
- Identify missing screens / incomplete components.

### Driver UX Improvements
Required visibility:
- Cleaner route dashboard
- Faster student check-in workflow
- Parent contact visibility
- Self-pick indicators
- Simplified operational flow

---

## 8. Outstanding Questions

- Should all school-specific terminology be abstracted to organisation-level terminology?
- Should permissions be role-based (Admin / Parent / Driver / Organisation Manager)?
- Should OCR support structured import templates?
- Which exact missing UI features need implementation?

---

## 9. Priority Roadmap

### High Priority
- Student extended profile fields
- Parent edit capability
- Driver onboarding enhancements
- Driver contact visibility
- Pickup / drop log exports
- WhatsApp integration
- Email integration
- Wialon GPS integration

### Medium Priority
- OCR file import
- Bulk Excel trip upload
- Student schedule requests
- Self-pick workflows

### Strategic Direction
Generalise platform from a school-only transport system into a broader **organisation transport management platform**.

