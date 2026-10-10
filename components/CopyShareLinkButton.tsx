"use client";

import { useState } from "react";

export default function CopyShareLinkButton({ path }: { path: string }) {
  const [message, setMessage] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
      setMessage("Link copied.");
    } catch {
      setMessage("Copy was blocked. Open the link and copy it from your address bar.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copyLink}
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-100"
      >
        Copy link
      </button>
      {message && <span aria-live="polite" className="text-sm text-stone-500">{message}</span>}
    </div>
  );
}
