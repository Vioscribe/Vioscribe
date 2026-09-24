import Link from "next/link";

export default function LeaderboardTabs({
  active,
  roomId,
}: {
  active: "friends" | "room" | "global";
  roomId?: string;
}) {
  const tabs = [
    ...(roomId ? [{ href: `/rooms/${roomId}`, label: "Room", key: "room" }] : []),
    { href: "/friends", label: "Friends", key: "friends" },
    { href: "/leaderboards/global", label: "Global", key: "global" },
  ];

  return (
    <nav aria-label="Leaderboards" className="flex gap-2 border-b border-stone-200">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={`border-b-2 px-3 py-2 text-sm ${tab.key === active ? "border-amber-500 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
