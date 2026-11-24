import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") === "/auth/reset" ? "/auth/reset" : "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const metadata = user?.user_metadata ?? {};
      const createdAt = Date.parse(user?.created_at ?? "");
      const signedInAt = Date.parse(user?.last_sign_in_at ?? "");
      const accountJustCreated = Number.isFinite(createdAt) &&
        Number.isFinite(signedInAt) &&
        Math.abs(signedInAt - createdAt) < 10 * 60 * 1000;

      if (
        user && accountJustCreated &&
        metadata.patirehber_full_tour_seen !== true &&
        metadata.patirehber_full_tour_pending !== true
      ) {
        await supabase.auth.updateUser({
          data: { ...metadata, patirehber_full_tour_pending: true },
        });
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }
  return NextResponse.redirect(`${origin}/auth?error=callback`);
}
