import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { code, title } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await (supabase.from("meetings") as any)
      .insert([
        {
          code,
          host_id: user?.id ?? null,
          title: title || `Meeting ${code}`,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn("Could not save meeting record to Supabase:", error.message);
      return NextResponse.json({ success: true, savedToDb: false, code });
    }

    return NextResponse.json({ success: true, meeting: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
