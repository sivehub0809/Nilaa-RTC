import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: "Supabase service configuration is missing" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Authenticate user from Bearer token OR session cookies
    let user: any = null;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, "");

    if (bearerToken) {
      try {
        const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(bearerToken);
        if (tokenUser) user = tokenUser;
      } catch {}
    }

    if (!user) {
      try {
        const cookieStore = await cookies();
        const supabaseUserClient = createServerClient(
          supabaseUrl,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll() {},
            },
          }
        );

        const {
          data: { user: cookieUser },
        } = await supabaseUserClient.auth.getUser();
        if (cookieUser) user = cookieUser;
      } catch {}
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to save your profile photo." }, { status: 401 });
    }

    // 2. Read file from FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // 3. Size check (max 3MB for cropped avatar)
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image exceeds size limit" },
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

    // 5. Ensure avatars bucket exists
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === "avatars");
      if (!bucketExists) {
        await supabaseAdmin.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 2 * 1024 * 1024,
        });
      }
    } catch (bucketErr) {
      console.warn("Storage bucket check:", bucketErr);
    }

    // 6. Upload file to storage
    const filePath = `${user.id}/avatar.webp`;
    let finalAvatarUrl: string | null = null;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);
      finalAvatarUrl = `${publicUrl}?v=${Date.now()}`;
    } else {
      console.warn("Storage upload fallback:", uploadError);
      // Fallback: If storage bucket policy rejects, encode compact base64 WebP for database
      const base64Data = buffer.toString("base64");
      finalAvatarUrl = `data:image/webp;base64,${base64Data}`;
    }

    // 7. Update public.profiles table (Primary persistent source of truth)
    const displayName = (formData.get("displayName") as string) || undefined;
    const role = (formData.get("role") as string) || undefined;

    try {
      const profilePayload: Record<string, any> = {
        id: user.id,
        email: user.email || "",
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      };
      if (displayName) profilePayload.display_name = displayName;
      if (role) profilePayload.role = role;

      await supabaseAdmin.from("profiles").upsert(profilePayload);
    } catch (profErr) {
      console.warn("Profiles table update error:", profErr);
    }

    // 8. Update Supabase auth user_metadata if it's a short URL
    if (finalAvatarUrl.startsWith("http")) {
      try {
        const metadataPayload: Record<string, any> = {
          ...user.user_metadata,
          avatar_url: finalAvatarUrl,
        };
        if (displayName) metadataPayload.display_name = displayName;
        if (role) metadataPayload.role = role;

        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: metadataPayload,
        });
      } catch {}
    }

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
