"use client";

import { useState } from "react";
import { createFile } from "@/app/actions";

export default function CreateFileForm() {
  const [error, setError] = useState("");

  return (
    <form
      action={createFile}
      className="space-y-2"
      onSubmit={(event) => {
        const title = String(new FormData(event.currentTarget).get("title") || "").trim();
        if (title.length < 1 || title.length > 32) {
          event.preventDefault();
          setError("Enter a title from 1 to 32 characters.");
          return;
        }
        setError("");
      }}
    >
      <label htmlFor="new-file-title" className="sr-only">File title</label>
      <div className="flex flex-wrap gap-2">
        <input
          id="new-file-title"
          name="title"
          type="text"
          required
          minLength={1}
          maxLength={32}
          pattern=".*\\S.*"
          placeholder="e.g. Biology revision"
          aria-describedby={error ? "file-title-error" : "file-title-hint"}
          className="min-w-0 flex-1 rounded border border-stone-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded bg-teal-800 px-4 py-2 text-sm font-semibold text-white">
          Add file
        </button>
      </div>
      {error ? (
        <p id="file-title-error" role="alert" className="text-xs text-red-300">{error}</p>
      ) : (
        <p id="file-title-hint" className="text-xs text-stone-500">1–32 characters</p>
      )}
    </form>
  );
}
