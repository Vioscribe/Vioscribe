"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/decks");
      router.refresh();
    } catch (error) {
      setBusy(false);
      setMessage(error instanceof Error ? error.message : "Could not update your password. Please try again.");
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
        <h1 className="mt-1 text-2xl font-semibold">Set a new password</h1>
        {!hasSession && (
          <p className="mt-2 text-sm text-stone-500">
            This reset link is invalid or has expired. Request a new one and open it from the same browser.
          </p>
        )}
      </div>

      {hasSession ? (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            New password
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Confirm password
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      ) : (
        <Link
          href="/forgot-password"
          className="block w-full rounded-lg bg-teal-800 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-teal-900"
        >
          Request a new reset link
        </Link>
      )}

      {message && <p role="alert" className="text-sm text-stone-600">{message}</p>}

      <Link href="/login" className="block text-sm text-stone-500 underline">
        Back to log in
      </Link>
    </div>
  );
}
