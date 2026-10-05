"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AccountDataControls() {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== "DELETE") {
      setError("Type DELETE exactly to confirm account removal.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your account could not be deleted.");

      await createClient().auth.signOut({ scope: "local" });
      window.location.assign("/login?accountDeleted=1");
    } catch (caught) {
      setPending(false);
      setError(caught instanceof Error ? caught.message : "Your account could not be deleted.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Download your data</h2>
        <p className="text-sm text-stone-500">Get a JSON copy of your profile, notes, decks, cards, and study activity.</p>
        <a
          href="/api/account/export"
          className="inline-flex rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-100"
        >
          Download account data
        </a>
      </section>

      <section className="space-y-2 border-t border-stone-700 pt-5">
        <h2 className="text-lg font-medium text-red-300">Delete your account</h2>
        <p className="text-sm leading-6 text-stone-400">
          This permanently removes your profile, notes, decks, cards, friend requests, and study history. Rooms you created will also be removed. Download your data first if you want to keep a copy.
        </p>
        <form onSubmit={deleteAccount} className="space-y-2">
          <label htmlFor="delete-account-confirmation" className="block text-sm text-stone-300">
            Type <strong>DELETE</strong> to confirm
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="delete-account-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={pending || confirmation !== "DELETE"}
              className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Permanently delete account"}
            </button>
          </div>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        </form>
      </section>
    </div>
  );
}
