// Service Worker for Nilaa RTC Installable PWA
const CACHE_NAME = "nilaa-rtc-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Let WebRTC and dynamic API / auth requests go directly through the network
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("supabase.co") ||
    event.request.url.includes("livekit.cloud")
  ) {
    return;
  }

  // Handle standard page requests with network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
