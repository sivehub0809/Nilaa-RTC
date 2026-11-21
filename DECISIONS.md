# Nilaa RTC — Decisions Log

This file records every design decision and assumption made during development.
Decisions made by the developer (without asking) are marked **[auto]**.
Decisions confirmed by the product owner are marked **[confirmed]**.

---

## Phase 0 — Planning

### D-001: Product name [auto]
**Decision:** The product is called **Nilaa RTC** everywhere — code, UI, docs, and meta tags. The old working name "Pulse" is fully retired.

### D-002: State management [auto]
**Decision:** Use **Zustand** for client-side meeting state (participants, UI panels open/closed, reactions). It's lightweight, simple, and works great with React. No Redux.

### D-003: Meeting code format [confirmed]
**Decision:** Short alphanumeric codes like `X7K9M2` (6 uppercase letters/digits). A **copy button** sits next to the code with a satisfying Framer Motion animation (e.g., the button briefly changes to a checkmark with a spring bounce). URL format: `nilaartc.com/X7K9M2`.

### D-004: Package manager [auto]
**Decision:** Use **pnpm** as the package manager for faster installs and disk efficiency.

### D-005: CSS approach [auto]
**Decision:** Tailwind CSS utility classes as the primary styling method. No CSS modules or styled-components. Custom CSS only in `globals.css` for things Tailwind can't do (e.g., glow effects).

### D-006: Animation library [auto]
**Decision:** **Framer Motion** for all UI animations (reactions floating, panel slides, hover effects). All animations will check `prefers-reduced-motion` and disable/simplify when the user has that setting on.

### D-007: shadcn/ui installation [auto]
**Decision:** Install shadcn/ui components individually as needed (not the full library). This keeps the bundle small and lets us customize each component to match Nilaa RTC's design tokens.

### D-008: Supabase auth strategy [auto]
**Decision:** Use **Supabase Auth with SSR** (`@supabase/ssr`) for session management via cookies. This gives us persistent sessions (stay logged in) and works with Next.js middleware for route protection.

### D-009: LiveKit integration approach [auto]
**Decision:** Use **@livekit/components-react** as the primary integration layer, with direct `livekit-client` access when we need fine-grained control (e.g., custom data channels for reactions). Token generation happens server-side via `livekit-server-sdk` in a Next.js API route.

### D-010: Database types [auto]
**Decision:** Auto-generate TypeScript types from the Supabase schema using `supabase gen types` and store them in `src/types/database.ts`. Regenerate whenever the schema changes.

### D-011: Responsive breakpoints [auto]
**Decision:** Follow Tailwind defaults: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). Mobile-first approach. The video grid switches to 2-column layout below `md`.

### D-012: Error handling pattern [auto]
**Decision:** Use a consistent pattern: API routes return `{ error: string }` with appropriate HTTP status codes. Client-side uses toast notifications (via shadcn/ui Sonner) for user-facing errors. No silent failures.


### D-013: Landing page scope [confirmed]
**Decision:** A simple, beautiful landing page for now — hero section, brief feature highlights, and a "Get Started" / "Join Meeting" call-to-action. We will design the full UI together later.

### D-014: Guest join flow [confirmed]
**Decision:** Guest enters only their **display name** — no email, no account created. They are a temporary participant. Guests can **only join** meetings via code (cannot start meetings).

### D-015: Room lifecycle [confirmed]
**Decision:** A meeting room closes **5 minutes** after the last person leaves. The meeting code is **not reusable** — every new meeting gets a fresh code.

### D-016: Host transfer [confirmed]
**Decision:** When the host leaves, the **host role automatically passes** to the participant who joined earliest. The meeting continues.

### D-017: Mobile meeting UI [confirmed]
**Decision:** 2-column video grid on mobile. A **hamburger icon (☰)** sits in the top-right corner. Tapping it opens a **slide-in panel from the right edge to the middle of the screen** (Framer Motion slide animation). This panel contains all controls: mic toggle, camera toggle, screen share, chat, reactions, raise hand, participants list, and leave. When closed it slides back off-screen to the right.

### D-018: Chat persistence [confirmed]
**Decision:** Chat messages are **saved to the database**. Logged-in users can view past meeting chat history from their dashboard. Guest messages are saved during the meeting but guests cannot access history later (since they have no account).


### D-019: Typography & Font Family [confirmed]
**Decision:** Use **Geist** (Vercel's official font family) via `geist/font/sans` and `geist/font/mono` for all headings, body text, and monospaced elements across Nilaa RTC.
