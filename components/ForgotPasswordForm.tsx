"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm({
  initialEmail = "",
  initialMessage = null,
}: {
  initialEmail?: string;
  initialMessage?: string | null;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send a reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div>
        <Image
          className="landing-logo mb-6"
          src="/vioscribe-logo.png"
          alt="[ Vioscribe ]"
          width={194}
          height={60}
          priority
        />
        <h1 className="mt-1 text-2xl font-semibold">Forgot password</h1>
        <p className="mt-2 text-sm text-stone-500">
          Enter the email on your account and we will send a reset link if it exists.
        </p>
      </div>

      {sent ? (
        <p role="status" className="text-sm text-stone-600">
          If an account exists for that email, we sent a reset link. Check your inbox, then return here to set a new password.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      {message && <p role="alert" className="text-sm text-stone-600">{message}</p>}

      <Link href="/login" className="block text-sm text-stone-500 underline">
        Back to log in
      </Link>
    </div>
  );
}
