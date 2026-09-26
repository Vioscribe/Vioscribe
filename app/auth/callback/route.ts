import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google (and email confirm) land here; exchange the code for a session cookie.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") || "/decks";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/decks";
  const forwardedHost = request.headers.get("x-forwarded-host");
  const redirectOrigin = process.env.NODE_ENV === "development" || !forwardedHost
    ? origin
    : `https://${forwardedHost}`;

  function redirectToLogin(message: string) {
    const loginUrl = new URL("/login", redirectOrigin);
    loginUrl.searchParams.set("error", message);
    return NextResponse.redirect(loginUrl);
  }

  const providerError = searchParams.get("error_description") || searchParams.get("error");
  if (providerError) {
    return redirectToLogin(providerError);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, redirectOrigin));
    }

    return redirectToLogin(`Google sign-in failed: ${error.message}`);
  }

  return redirectToLogin("Google sign-in failed because no authorization code was returned.");
}
