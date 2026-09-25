"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import HomeMascot from "@/components/HomeMascot";

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
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
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setBusy(false);
      setMessage(error.message);
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
        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-60"
      >
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

      {message && <p className="text-sm text-stone-600">{message}</p>}

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
