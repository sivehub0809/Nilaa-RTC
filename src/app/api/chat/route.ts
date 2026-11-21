import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { meetingCode, senderName, message, isGuest } = await req.json();

    if (!meetingCode || !senderName || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Insert into chat_messages if Supabase table is available
    const { error } = await (supabase.from("chat_messages") as any).insert([
      {
        meeting_id: meetingCode,
        sender_name: senderName,
        sender_id: user?.id ?? null,
        is_guest: !!isGuest,
        message,
      },
    ]);

    if (error) {
      console.warn("Could not save chat message to Supabase:", error.message);
      return NextResponse.json({ success: true, savedToDb: false });
    }

    return NextResponse.json({ success: true, savedToDb: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const meetingCode = req.nextUrl.searchParams.get("meetingCode");
  if (!meetingCode) {
    return NextResponse.json({ error: "Missing meetingCode" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("chat_messages") as any)
      .select("*")
      .eq("meeting_id", meetingCode)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: data ?? [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
