# Nilaa RTC — Project Specification

## 1. Product Overview
**Nilaa RTC** is a modern, real-time video conferencing web application designed for professionals and friends.
- **Fast**: Sub-second join, zero bloated downloads, instant responsiveness.
- **Clear**: Crisp audio, HD video, adaptive quality even on weak connections.
- **Interactive**: Real-time chat, hand raise, and spring-animated emoji reactions.
- **Calm & Polished**: Dark theme where video is the hero, accented by cyan `#10FFE7`.

## 2. Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + custom tokens + Lucide icons
- **Animations**: Framer Motion (spring animations, prefers-reduced-motion compatible)
- **Media Engine**: LiveKit Cloud (WebRTC SFU architecture)
- **Auth & Database**: Supabase (Auth SSR cookies, meeting history, in-call chat persistence)
- **Deployment**: Vercel

## 3. Design System
- **Theme**: Dark-first
- **Colors**:
  - Background: `#0B0D12`
  - Cards: `#141821`
  - Tiles, secondary buttons, inputs: `#1B2130`
  - Borders: `#232938`
  - Main text: `#F2F4F8`
  - Soft / muted text: `#9BA3B5`
  - Primary Accent: `#10FFE7` (cyan, dark text `#0B0D12` on top)
  - Active speaker glow: `0 0 24px rgba(16, 255, 231, 0.4)`
  - Danger / Leave: `#E5484D`
- **Typography**:
  - Headings: Space Grotesk
  - Body & UI: Inter
- **Border Radii**:
  - Buttons & Inputs: `12px`
  - Video Tiles: `16px`
  - Cards: `20px`
  - Camera Preview: `24px`

## 4. User Journey & Flows
1. **Landing Page (`/`)**: Clean hero, instant meeting creator, join by code, guest link.
2. **Authentication (`/login`, `/signup`)**: Persistent session via cookies (users stay logged in).
3. **Guest Access (`/guest`)**: Join with just a name and meeting code (no account creation).
4. **Dashboard (`/home`)**: Start meeting (creates short code like `X7K9M2` with copy animation) or join with code.
5. **Pre-Join Screen (`/[code]`)**: Camera & mic preview in `rounded-[24px]` frame, audio volume meter, device pickers, display name confirmation.
6. **Meeting Call (`/[code]/room`)**:
   - Up to 15 participants in responsive grid (2 columns on mobile).
   - Desktop bottom control bar & mobile top-right hamburger drawer (slides from right to middle).
   - In-call chat & participants list.
   - Floating reactions and active speaker highlighting.

## 5. Scope Restrictions (Version 1)
Not included in V1: Recording, virtual background blur, calendar scheduling, AI summaries, breakout rooms, billing tiers.
