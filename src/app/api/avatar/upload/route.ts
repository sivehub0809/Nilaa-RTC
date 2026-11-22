import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user from session cookies
    const cookieStore = await cookies();
    const supabaseUserClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser();

    if (!user || userError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Read file from FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // 3. Strict size limit check (max 500 KB for cropped avatar)
    if (file.size > 500 * 1024) {
      return NextResponse.json(
        { error: "Image exceeds 500KB size limit" },
        { status: 400 }
      );
    }

    // 4. Validate MIME type
    const allowedMimes = ["image/webp", "image/jpeg", "image/png", "image/gif"];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid image format. Must be WebP, PNG, or JPEG." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Use Supabase admin client to upload to 'avatars' bucket
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: "Supabase storage is not configured" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const filePath = `${user.id}/avatar.webp`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload to storage" },
        { status: 500 }
      );
    }

    // 6. Get clean public HTTPS URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);

    // Append a timestamp cache-buster so browsers fetch the updated photo immediately
    const finalAvatarUrl = `${publicUrl}?v=${Date.now()}`;

    // 7. Update Supabase auth user_metadata with the short public URL
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        avatar_url: finalAvatarUrl,
      },
    });

    // 8. Update profiles table if it exists
    try {
      await supabaseAdmin.from("profiles").upsert({
        id: user.id,
        email: user.email || "",
        avatar_url: finalAvatarUrl,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      avatarUrl: finalAvatarUrl,
    });
  } catch (err: any) {
    console.error("Avatar upload API error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
