# Nilaa RTC — Current State

## Current Phase: Phase 2 Core (Live Video & Data Channels) Completed ✅

### What is Completed

1. **LiveKit Cloud Multi-Peer Video Streaming**
   - Wired `@livekit/components-react` (`LiveKitRoom`, `RoomAudioRenderer`, `VideoTrack`, `useTracks`, `useParticipants`, `useLocalParticipant`, `useSpeakingParticipants`).
   - Remote camera video streams automatically render for all participants.
   - Remote audio automatically plays through browser speakers.
   - Multi-device real-time video call enabled.

2. **LiveKit Real-Time WebRTC Data Channel**
   - In-call instant chat broadcast over data channel to all connected peers.
   - Spring-animated emoji reactions broadcast to all participants simultaneously.
   - Hand raise status broadcast and synced across peer video tiles.
   - Host mute and remove commands broadcast via data channel.

3. **Supabase Database Persistence APIs**
   - `/api/chat`: Saves in-call chat messages into Supabase table `chat_messages`.
   - `/api/meetings`: Logs meeting creations into Supabase table `meetings`.

4. **Git Repository Initialized**
   - Repository initialized with clean initial commit.
   - `.env.local` strictly excluded via `.gitignore`. Ready for Vercel deployment.

1. **Project Scaffold & Next.js Setup**
   - Next.js 15 (App Router) + TypeScript + Tailwind CSS.
   - Design tokens configured in `tailwind.config.ts` and `src/styles/globals.css`:
     - Dark background: `#0B0D12`
     - Card background: `#141821` (20px border-radius)
     - Surface / Tiles / Inputs: `#1B2130` (12px button/input radius, 16px video tile radius)
     - Borders: `#232938`
     - Text foreground: `#F2F4F8`
     - Soft/muted text: `#9BA3B5`
     - Cyan Accent: `#10FFE7` with dark text `#0B0D12` and soft cyan glow
     - Leave / Danger: `#E5484D`
     - Fonts: **Geist** (Vercel) for UI text, headings, and **Geist Mono** for codes/stats.
     - Active speaker glow: `speaker-active-ring` (`box-shadow: 0 0 24px rgba(16, 255, 231, 0.4)`).

2. **Supabase Authentication & Persistent Session**
   - Browser client (`src/lib/supabase/client.ts`) and Server client (`src/lib/supabase/server.ts`).
   - Cookie-based session auto-refresh middleware (`src/lib/supabase/middleware.ts` & `middleware.ts`).
   - Sign up (`/signup`) with Name, Email, Password, and redirect to `/home`.
   - Log in (`/login`) with persistent cookie session so users stay logged in.
   - Protected routes guard (`/home` redirects to `/login` if unauthenticated).

3. **Guest Join Flow**
   - `/guest`: Fast, frictionless guest entry.
   - Guests enter only their display name and meeting code (e.g. `X7K9M2`).
   - No account or password required.

4. **Home Page & Instant Meeting Code Generator**
   - `/home`: Logged-in dashboard.
   - "Start Instant Meeting": Generates short 6-character room code like `X7K9M2`.
   - Copy button with spring Framer Motion feedback.
   - "Join with Code" input.

5. **Pre-Join Screen (`/[code]`)**
   - Live camera and microphone preview in `rounded-[24px]` frame.
   - Live audio volume meter.
   - Quick mute/unmute and camera toggles before entering.
   - Camera and microphone device selectors.
   - Name input with auto-fill.

6. **Meeting Room (`/[code]/room`)**
   - Responsive video grid for up to 15 participants (1 = full, 2 = 1x2, 3-4 = 2x2, 5-6 = 3x2, etc.; 2-column on mobile).
   - Active speaker cyan ring and glow.
   - In-preview camera, mic, screen-sharing, hand raise, and reaction controls.
   - Floating reactions with spring physics.
   - In-call chat panel with message timestamps and guest badges.
   - People / Participants panel with host mute/kick controls.
   - Mobile Hamburger (☰) top-right menu sliding from right to middle of the screen with all controls.
   - Connection chip ("38 ms HD").
   - Leave call button in `#E5484D`.

7. **LiveKit Token Service**
   - Server-side route `/api/livekit/token` ready for LiveKit Cloud room token generation.

8. **Configuration Templates**
   - `.env.example` and `.env.local` ready for user credentials.
