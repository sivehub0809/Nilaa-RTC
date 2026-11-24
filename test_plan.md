# Nilaa RTC - Quality Assurance & Verification Test Plan

This document outlines the step-by-step verification procedures for the latest release, covering the dashboard layout adjustments, anti-random room validation, real-time duration timer, mobile screen sharing, and host meeting termination flows.

---

## 1. Test Environment Setup
- **Desktop**: Google Chrome, Microsoft Edge, or Safari on macOS/Windows.
- **Mobile**: Safari on iOS (iPhone) or Chrome on Android.
- **Application URL**: Local environment (`http://localhost:3000`) or production deployment on Vercel.

---

## 2. Test Suites & Verification Cases

### Suite A: Dashboard Layout & Vertical Alignment
| Step | Action | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- |
| **A.1** | Sign in and land on `/home` (desktop viewport ≥ 1024px). | Main greeting (*"Welcome, Bro sivY"*), unified action bar, and capacity pill sit comfortably at eye level in the upper portion of the viewport (`justify-start pt-10 sm:pt-16`) instead of dead center. | [ ] |
| **A.2** | Inspect typography on the greeting. | Welcome text uses medium-sized Geist Vercel font (`font-sans text-2xl sm:text-3xl font-medium tracking-tight text-white`). | [ ] |
| **A.3** | Check mobile viewport (e.g. 375px - 414px width). | Elements scale naturally without vertical or horizontal overflow. Background covers the viewport smoothly. | [ ] |

---

### Suite B: Room Validation & Anti-Random Code Protection (#system)
> [!IMPORTANT]
> Unregistered or ended room codes must strictly be rejected from all access paths (landing input, dashboard input, direct URL entry, and token API).

| Step | Action | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- |
| **B.1** | On `/home`, enter a fake code (e.g., `RANDOM` or `999999`) into "Join with a Code" and click Join. | Toast notification appears: *"Meeting code not found. Please check the code and try again."* Navigation is prevented. | [ ] |
| **B.2** | On public landing page (`/`), enter a fake code in the unified bar and submit. | Toast notification appears with rejection message. Navigation is prevented. | [ ] |
| **B.3** | Type a non-existent room URL directly in the browser bar: `http://localhost:3000/FAKECD`. | Pre-join lobby loads, detects room does not exist, and displays a modal dialog: **"Meeting Unavailable — This meeting room does not exist or has already ended"**. | [ ] |
| **B.4** | On the "Meeting Unavailable" modal, test the input: type another code or click "Return to Home". | User can re-try another code or click "Return to Home" to navigate back to dashboard. | [ ] |
| **B.5** | Call `/api/livekit/token?room=FAKE99&username=Hacker` via browser or curl. | API returns HTTP 404 with JSON: `{ error: "This meeting code does not exist or has not been created yet.", roomUnavailable: true }`. LiveKit does not spawn a room. | [ ] |

---

### Suite C: Live Meeting Duration Timer (#ui)
| Step | Action | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- |
| **C.1** | Start an instant meeting and enter the room (`/[code]/room`). | The top-right header no longer displays the ping badge (`38 ms`). | [ ] |
| **C.2** | Inspect the new timer element. | A frosted glass pill is displayed with an emerald pulsing dot (`bg-emerald-400 animate-pulse`) and elapsed time formatted as `00:00`, `00:01`, etc. | [ ] |
| **C.3** | Verify font style and alignment. | Timer uses Geist Vercel font (`font-sans font-medium text-white tabular-nums`), preventing number jitter as seconds change. | [ ] |
| **C.4** | Wait for 60 seconds. | Format seamlessly transitions from `00:59` to `01:00`. (If tested for > 1 hour, transitions to `01:00:00`). | [ ] |

---

### Suite D: Mobile Device Screen Sharing (#system & #ui)
| Step | Action | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- |
| **D.1** | Join a room from a smartphone (iOS Safari or Android Chrome). | In the bottom controls bar, the **Screen Share** button is fully visible (no longer hidden on mobile screens). | [ ] |
| **D.2** | Verify touch button layout. | All 6 buttons (Mic, Camera, Screen Share, Hand, Reactions, Leave) fit smoothly on small phone screens (`h-11 w-11 sm:h-12 sm:w-12`) without horizontal clipping. | [ ] |
| **D.3** | Tap the Screen Share button on mobile. | Triggers browser screen-capture permission prompt (iOS broadcast picker / Android screen capture dialog). | [ ] |
| **D.4** | Cancel or dismiss the OS screen prompt. | Handled gracefully without crash; active meeting state remains completely stable. | [ ] |
| **D.5** | Open mobile hamburger drawer (top right). | "Share Screen" button is present and functions with the same safe error handling. | [ ] |

---

### Suite E: Host "End Meeting for All" vs. "Leave Meeting" Flow (#system & #ui)
> [!NOTE]
> Test this suite using two browser tabs (or 1 desktop tab as Host + 1 mobile device as Guest).

#### Scenario 1: Host Chooses "Leave Meeting (Others stay)"
| Step | Action | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- |
| **E.1** | User A starts instant meeting (Host). User B joins room with code (Guest). | Both participants are connected in the video grid. | [ ] |
| **E.2** | User A (Host) clicks red **Leave** button. | A Zoom-style modal dialog opens: **"End Meeting"** with options: *"End Meeting for All"*, *"Leave Meeting (Others stay)"*, and *"Cancel"*. | [ ] |
| **E.3** | Host clicks **"Leave Meeting (Others stay)"**. | Host leaves and redirects to `/home`. **User B (Guest) remains in the meeting room uninterrupted.** | [ ] |

#### Scenario 2: Host Chooses "End Meeting for All"
| Step | Action | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- |
| **E.4** | User A (Host) rejoins or creates a new meeting. User B (Guest) joins. | Both are in the room. | [ ] |
| **E.5** | Host clicks red **Leave** button and selects **"End Meeting for All"**. | 1. Host disconnects and redirects to `/home` with success toast.<br>2. Supabase database marks room `is_active: false` and sets `ended_at`.<br>3. LiveKit data channel broadcasts termination event to all participants. | [ ] |
| **E.6** | Observe Guest (User B) screen. | User B is automatically disconnected and shown a modal: **"Meeting Ended by Host — The host has ended this meeting for all participants. The room code is no longer active."** with a *"Return to Home"* button. | [ ] |
| **E.7** | Attempt to re-enter the ended meeting code. | Code is permanently inactive. System rejects entry with: *"This meeting has already ended."* | [ ] |

#### Scenario 3: Regular Guest Exits
| Step | Action | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- |
| **E.8** | Guest (User B) clicks red **Leave** button. | Guest immediately exits to `/home` without seeing the host modal. The room remains active for others. | [ ] |
