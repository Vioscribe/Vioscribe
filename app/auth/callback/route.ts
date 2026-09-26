import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth, email confirm, and password recovery land here; exchange the code for a session cookie.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") || "/decks";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/decks";
  const isPasswordRecovery = next === "/reset-password";
  const forwardedHost = request.headers.get("x-forwarded-host");
  const redirectOrigin = process.env.NODE_ENV === "development" || !forwardedHost
    ? origin
    : `https://${forwardedHost}`;

  function redirectWithError(message: string) {
    const failPath = isPasswordRecovery ? "/forgot-password" : "/login";
    const failUrl = new URL(failPath, redirectOrigin);
    failUrl.searchParams.set("error", message);
    return NextResponse.redirect(failUrl);
  }

  const providerError = searchParams.get("error_description") || searchParams.get("error");
  if (providerError) {
    return redirectWithError(providerError);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, redirectOrigin));
    }

    if (isPasswordRecovery) {
      return redirectWithError("This password reset link is invalid or has expired.");
    }

    return redirectWithError(`Google sign-in failed: ${error.message}`);
  }

  if (isPasswordRecovery) {
    return redirectWithError("This password reset link is invalid or has expired.");
  }

  return redirectWithError("Google sign-in failed because no authorization code was returned.");
}
