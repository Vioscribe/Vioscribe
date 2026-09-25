type Badge = {
  id: string;
  title: string;
  detail: string;
  mark: string;
  color: string;
  earned: boolean;
  rare?: boolean;
};

function PixelMark({ mark, color }: { mark: string; color: string }) {
  const streakShapes: Record<string, string> = {
    "10": "M14 3h4v6h4v5h4v8h-4v5H10v-4H6v-8h4v-6h4z",
    "25": "M5 21h22v5H5z M8 19v-6h4V8h4v5h3V6h4v8h3v5z",
    "50": "M4 22h5v-7h4v7h3V11h4v11h3v-7h4v7h2v5H4z M15 7h3v4h-3z",
    "100": "M3 8h6v5h5v5h4v-5h5V8h6v10h-4v7H7v-7H3z M12 4h3v4h-3z M19 4h3v4h-3z",
    "250": "M13 2h6v5h5v5h5v7h-5v6h-4v5h-8v-5H8v-6H3v-7h5V7h5z M15 12h3v6h3v4h-9v-4h3z",
    "500": "M4 8h7v5h4v5h2v-5h4V8h7v9h-5v8h-5v4h-8v-4H7v-8H4z M14 3h4v5h-4z",
    "1K": "M12 2h8v5h5v5h4v8h-5v6h-4v4h-9v-4H7v-6H3v-8h5V7h4z M15 11h4v4h3v5h-3v3h-7v-3h-3v-5h4v-3h2z",
  };
  return (
    <span className="profile-badge-mark" style={{ "--badge-color": color } as React.CSSProperties} aria-hidden="true">
      {mark === "check" ? (
        <svg viewBox="0 0 24 24" shapeRendering="crispEdges">
          <path d="M3 12h4v4h4v-4h4V8h4v4h-4v4h-4v4H7v-4H3z" fill="currentColor" />
        </svg>
      ) : mark === "/" ? (
        <span className="dev-badge-slash">/</span>
      ) : mark === "pro-tick" || mark === "classroom-tick" ? (
        <VerifiedTick color={color} pulse={mark === "classroom-tick"} />
      ) : mark === "first100" ? (
        <span className="first-hundred-mark">100</span>
      ) : (
        <span className="streak-badge-mark">
          <svg viewBox="0 0 32 32" shapeRendering="crispEdges">
            <path d={streakShapes[mark] ?? streakShapes["10"]} fill="currentColor" />
            <path d="M15 12h3v4h3v4h-3v3h-6v-3h-3v-4h3v-3h3z" fill="#fff2ba" opacity=".9" />
          </svg>
          <b>{mark}</b>
        </span>
      )}
    </span>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <li
      className={`profile-badge${badge.earned ? " is-earned" : " is-locked"}${badge.rare && badge.earned ? " is-rare" : ""}`}
      style={{ "--badge-color": badge.color } as React.CSSProperties}
      aria-label={`${badge.title}: ${badge.detail}${badge.earned ? ", earned" : ", not yet earned"}`}
    >
      <PixelMark mark={badge.mark} color={badge.color} />
      <span className="profile-badge-copy">
        <strong>{badge.title}</strong>
        <small>{badge.detail}</small>
      </span>
      <span className="profile-badge-state">{badge.earned ? "UNLOCKED" : "LOCKED"}</span>
      {badge.rare && badge.earned && <span className="badge-embers" aria-hidden="true"><i /><i /><i /><i /></span>}
    </li>
  );
}

export function VerifiedTick({ color, pulse = false }: { color: string; pulse?: boolean }) {
  // Each row is a whole-pixel rectangle, forming a staircase circle on a 20px grid.
  const circleRows = [
    [8, 1, 4], [6, 2, 8], [4, 3, 12], [3, 4, 14], [2, 5, 16],
    [1, 6, 18], [0, 7, 20], [0, 8, 20], [0, 9, 20], [0, 10, 20],
    [0, 11, 20], [0, 12, 20], [1, 13, 18], [2, 14, 16], [3, 15, 14],
    [4, 16, 12], [6, 17, 8], [8, 18, 4],
  ];
  // Three-pixel-wide staircase strokes meet at a lower-left-of-center point.
  const checkRows = [
    [13, 6], [12, 7], [11, 8], [10, 9], [9, 10], [8, 11], [7, 12],
    [4, 8], [5, 9], [6, 10], [7, 11], [8, 12],
  ];

  return (
    <span
      className={`verified-tick${pulse ? " is-pulsing" : ""}`}
      style={{ "--tick-color": color } as React.CSSProperties}
      aria-hidden="true"
    >
      <svg viewBox="0 0 20 20" shapeRendering="crispEdges">
        {circleRows.map(([x, y, width]) => (
          <rect key={`badge-${y}`} x={x} y={y} width={width} height="1" fill="currentColor" />
        ))}
        {checkRows.map(([x, y], index) => (
          <rect key={`check-${index}`} x={x} y={y} width="3" height="1" fill="#fff" />
        ))}
      </svg>
    </span>
  );
}

export default function ProfileBadges({
  isDeveloper,
  isFirst100,
  longestStreak,
  classroomBadgeColor,
}: {
  isDeveloper: boolean;
  isFirst100: boolean;
  longestStreak: number;
  classroomBadgeColor: string;
}) {
  const badges: Badge[] = [
    ...(isDeveloper ? [{
      id: "developer", title: "Developer", detail: "Vioscribe developer", mark: "/", color: "#ef3434", earned: true, rare: true,
    }] : []),
    {
      id: "first-100", title: "First 100", detail: "One of the first 100 accounts", mark: "first100", color: "#59d5c9", earned: isFirst100, rare: true,
    },
    {
      id: "pro", title: "Pro", detail: isDeveloper ? "Available in approved developer builds (for now)" : "Locked until Pro is available", mark: "pro-tick", color: "#f97316", earned: isDeveloper,
    },
    {
      id: "classroom-pro", title: "Classroom Pro", detail: isDeveloper ? "Available in approved developer builds (for now)" : "Locked until Classroom Pro is available", mark: "classroom-tick", color: classroomBadgeColor, earned: isDeveloper,
    },
    ...[10, 25, 50, 100, 250, 500, 1000].map((milestone) => ({
      id: `streak-${milestone}`,
      title: `${milestone}${milestone === 1000 ? "+" : ""} day streak`,
      detail: `Reach a ${milestone}-day study streak`,
      mark: String(milestone >= 1000 ? "1K" : milestone),
      color: milestone >= 1000 ? "#ffe477" : milestone >= 500 ? "#ff7f3f" : milestone >= 250 ? "#c07aff" : milestone >= 100 ? "#57b8ff" : milestone >= 50 ? "#66db9a" : milestone >= 25 ? "#ffb84d" : "#f27836",
      earned: longestStreak >= milestone,
      rare: milestone >= 250,
    })),
  ];

  return (
    <ul className="profile-badge-grid">
      {badges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
    </ul>
  );
}
