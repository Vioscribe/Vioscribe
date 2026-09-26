"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import HomeMascot from "@/components/HomeMascot";

export default function AuthForm({ initialMessage = null }: { initialMessage?: string | null }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setBusy(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Check your email to confirm, then come back and log in.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/decks");
    router.refresh();
  }

  async function onGoogle() {
    setBusy(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error("Google sign-in could not be started. Please try again.");

      window.location.assign(data.url);
    } catch (error) {
      setBusy(false);
      setMessage(error instanceof Error ? error.message : "Google sign-in failed. Please try again.");
    }
  }

  return (
    <>
    {mode === "signup" && <HomeMascot greeting />}
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
        <h1 className="mt-1 text-2xl font-semibold">
          {mode === "login" ? "Log in" : "Create an account"}
        </h1>
      </div>

      <button
        type="button"
        onClick={onGoogle}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-60"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="relative text-center text-xs text-stone-400">
        <span className="bg-stone-50 px-2">or email</span>
        <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-stone-200" />
      </div>

      <form onSubmit={onEmailSubmit} className="space-y-3">
        {mode === "signup" && (
          <p className="text-sm text-stone-500">
            Your username will be generated automatically.
          </p>
        )}
        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
        >
          {mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      {message && <p role="alert" className="text-sm text-stone-600">{message}</p>}

      <button
        type="button"
        className="text-sm text-stone-500 underline"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setMessage(null);
        }}
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
    </>
  );
}
