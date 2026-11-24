import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/meetings?code=X7K9M2
 * Validates whether a meeting code exists and is currently active.
 */
export async function GET(req: NextRequest) {
  try {
    const rawCode = req.nextUrl.searchParams.get("code");
    if (!rawCode) {
      return NextResponse.json({ error: "Missing meeting code" }, { status: 400 });
    }

    const code = rawCode.trim().toUpperCase();
    const supabase = createAdminClient();

    const { data, error } = await (supabase.from("meetings") as any)
      .select("id, code, is_active, host_id, title, created_at, ended_at")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.warn("Database lookup error for meeting code:", error.message);
      return NextResponse.json(
        { valid: false, error: "Error checking meeting status" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          valid: false,
          error: "Meeting code not found. Please check the code and try again.",
        },
        { status: 404 }
      );
    }

    if (data.is_active === false) {
      return NextResponse.json(
        {
          valid: false,
          error: "This meeting has already ended.",
        },
        { status: 410 }
      );
    }

    return NextResponse.json({ valid: true, meeting: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/meetings
 * Registers a new active meeting room in Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = body.code;
    const title = body.title;

    if (!rawCode) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const code = rawCode.trim().toUpperCase();
    const supabase = createAdminClient();

    // Try to get authenticated user if available
    let userId: string | null = null;
    try {
      const authClient = await createServerClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();
      userId = user?.id ?? null;
    } catch {}

    // Upsert active meeting record
    const { data, error } = await (supabase.from("meetings") as any)
      .upsert(
        [
          {
            code,
            host_id: userId,
            title: title || `Meeting ${code}`,
            is_active: true,
            ended_at: null,
          },
        ],
        { onConflict: "code" }
      )
      .select()
      .single();

    if (error) {
      console.warn("Could not save meeting record to Supabase:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, meeting: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/meetings
 * Ends a meeting room permanently (sets is_active = false, ended_at = now).
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = body.code;

    if (!rawCode) {
      return NextResponse.json({ error: "Missing meeting code" }, { status: 400 });
    }

    const code = rawCode.trim().toUpperCase();
    const supabase = createAdminClient();

    const { data, error } = await (supabase.from("meetings") as any)
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq("code", code)
      .select();

    if (error) {
      console.warn("Could not mark meeting inactive in database:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ended: true, meeting: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
