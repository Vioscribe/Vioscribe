"use client";

import { useFormStatus } from "react-dom";
import { createDeck } from "@/app/actions";

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Creating…" : "Create"}
    </button>
  );
}

export default function CreateDeckForm() {
  return (
    <form action={createDeck} className="flex gap-2">
      <input
        name="title"
        required
        placeholder="New deck title"
        className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
      />
      <CreateButton />
    </form>
  );
}
