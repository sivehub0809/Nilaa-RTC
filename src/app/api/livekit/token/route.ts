import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const rawUsername = req.nextUrl.searchParams.get("username") || "Participant";
  const username = rawUsername.trim() || "Participant";
  const isHost = req.nextUrl.searchParams.get("isHost") === "1";

  if (!room) {
    return NextResponse.json(
      { error: 'Missing "room" query parameter' },
      { status: 400 }
    );
  }

  const cleanRoom = room.trim().toUpperCase();

  // Validate room existence in Supabase database
  try {
    const supabase = createAdminClient();
    const { data: meeting, error: dbErr } = await (supabase.from("meetings") as any)
      .select("id, code, is_active")
      .eq("code", cleanRoom)
      .maybeSingle();

    if (!dbErr) {
      if (!meeting) {
        if (isHost) {
          // If host is connecting first, ensure the room is registered as active
          await (supabase.from("meetings") as any).upsert([
            {
              code: cleanRoom,
              title: `Meeting ${cleanRoom}`,
              is_active: true,
              ended_at: null,
            },
          ]);
        } else {
          // Random or non-existent code entered by guest - strictly reject!
          return NextResponse.json(
            {
              error: "This meeting code does not exist or has not been created yet.",
              roomUnavailable: true,
            },
            { status: 404 }
          );
        }
      } else if (meeting.is_active === false) {
        // Meeting has ended
        return NextResponse.json(
          {
            error: "This meeting has already ended by the host.",
            roomUnavailable: true,
          },
          { status: 410 }
        );
      }
    }
  } catch (err) {
    console.warn("Room validation check error:", err);
    // Proceed if Supabase check threw unexpected connection issue so we don't block in offline dev
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  let wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      {
        error:
          "LiveKit credentials are not configured in Vercel environment variables (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL).",
        needsConfig: true,
      },
      { status: 503 }
    );
  }

  // Ensure wsUrl starts with wss:// (or ws:// for local dev) and has no trailing slash
  wsUrl = wsUrl.trim();
  if (wsUrl.startsWith("https://")) {
    wsUrl = wsUrl.replace("https://", "wss://");
  } else if (wsUrl.startsWith("http://")) {
    wsUrl = wsUrl.replace("http://", "ws://");
  } else if (!wsUrl.startsWith("wss://") && !wsUrl.startsWith("ws://")) {
    wsUrl = `wss://${wsUrl}`;
  }
  wsUrl = wsUrl.replace(/\/$/, "");

  try {
    // Generate a unique identity per connection to prevent LiveKit duplicate login ejects
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanPrefix = username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "user";
    const uniqueIdentity = `${cleanPrefix}_${randomSuffix}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: uniqueIdentity,
      name: username,
      ttl: "4h",
      metadata: JSON.stringify({ isHost }),
    });

    at.addGrant({
      room: cleanRoom,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      wsUrl,
      identity: uniqueIdentity,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
