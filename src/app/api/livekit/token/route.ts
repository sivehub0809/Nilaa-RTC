import { NextRequest, NextResponse } from "next/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    // 1. Authenticate user: identify account to disallow multiple concurrent logins on the same account
    let authUser: { id: string; email?: string } | null = null;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, "");

    const supabaseAdmin = createAdminClient();

    if (bearerToken) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(bearerToken);
        if (user) authUser = user;
      } catch {}
    }

    if (!authUser) {
      try {
        const cookieStore = await cookies();
        const supabaseUserClient = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          {
            cookies: {
              getAll() { return cookieStore.getAll(); },
              setAll() {},
            },
          }
        );
        const { data: { user } } = await supabaseUserClient.auth.getUser();
        if (user) authUser = user;
      } catch {}
    }

    // 2. Determine unique identity
    let uniqueIdentity: string;
    if (authUser) {
      // Bound directly to the authenticated user ID so two people cannot share one account in the same call
      uniqueIdentity = `usr_${authUser.id}`;
    } else {
      // Guest: assign unique session suffix
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const cleanPrefix = username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "guest";
      uniqueIdentity = `gst_${cleanPrefix}_${randomSuffix}`;
    }

    // 3. Prevent duplicate logins for authenticated accounts
    if (authUser) {
      try {
        const httpUrl = wsUrl.replace(/^wss:\/\//i, "https://").replace(/^ws:\/\//i, "http://");
        const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);
        const activeParticipants = await roomService.listParticipants(cleanRoom);
        const alreadyInRoom = activeParticipants.some((p) => p.identity === uniqueIdentity);
        if (alreadyInRoom) {
          return NextResponse.json(
            {
              error: "This account is already active in this meeting. Two participants cannot join using the same account.",
              duplicateLogin: true,
            },
            { status: 409 }
          );
        }
      } catch (checkErr) {
        // Room not yet created on LiveKit server is normal (throws 404/empty)
      }
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: uniqueIdentity,
      name: username,
      ttl: "4h",
      metadata: JSON.stringify({ isHost, userId: authUser?.id || null }),
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
