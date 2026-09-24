"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Person = { user_id: string; display_name: string };

export default function RoomPresence({
  roomId,
  userId,
  displayName,
}: {
  roomId: string;
  userId: string;
  displayName: string;
}) {
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`room:${roomId}`, {
      config: { private: true, presence: { key: userId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const unique = new Map<string, Person>();
      Object.values(channel.presenceState()).flat().forEach((state) => {
        const person = state as unknown as Person;
        if (person.user_id) unique.set(person.user_id, person);
      });
      setPeople([...unique.values()].sort((a, b) => a.display_name.localeCompare(b.display_name)));
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_id: userId, display_name: displayName });
      }
    });

    return () => { void supabase.removeChannel(channel); };
  }, [displayName, roomId, userId]);

  return (
    <section className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="font-medium">Here now <span className="text-sm font-normal text-stone-500">({people.length}/4)</span></h2>
      {people.length === 0 ? <p className="text-sm text-stone-500">Connecting to room presence…</p> : (
        <ul className="flex flex-wrap gap-2">
          {people.map((person) => (
            <li key={person.user_id} className="rounded-full bg-stone-100 px-3 py-1 text-sm">
              {person.display_name}{person.user_id === userId ? " (you)" : ""}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
