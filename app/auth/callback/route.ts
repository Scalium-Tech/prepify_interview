import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/interview-setup";

    if (code) {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development';
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        } else {
            console.error("Auth callback error:", error);
            // If the code exchange fails (e.g., OTP expired), redirect to the next page (update-password)
            // with the error details so we can show a "Link Expired" message there.
            // Do NOT redirect to login, as that confuses the user context.
            return NextResponse.redirect(`${origin}${next}?error=access_denied&error_code=${error.code || 'otp_expired'}&error_description=${encodeURIComponent(error.message)}`);
        }
    }

    // If no code is present, check for error parameters
    const error = searchParams.get("error");
    const errorCode = searchParams.get("error_code");
    const errorDescription = searchParams.get("error_description");

    if (error || errorCode) {
        return NextResponse.redirect(
            `${origin}${next}?error=${error || 'access_denied'}&error_code=${errorCode || ''}&error_description=${encodeURIComponent(errorDescription || '')}`
        );
    }

    // Check if we have a hash-based error implies by the client (not visible here, but browser preserves hash on redirect)
    // Or just a direct visit. We redirect to `next` so the client page can handle the hash or show a default state.
    // If we redirected to login, we would lose the context of "Reset Password".
    return NextResponse.redirect(`${origin}${next}`);
}
