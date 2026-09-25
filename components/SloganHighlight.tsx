"use client";

export default function SloganHighlight() {
  return (
    <span
      className="landing-slogan-highlight"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width) * 100;
        const y = ((event.clientY - bounds.top) / bounds.height) * 100;
        event.currentTarget.style.setProperty("--shimmer-x", `${x}%`);
        event.currentTarget.style.setProperty("--shimmer-y", `${y}%`);
      }}
    >
      Don’t burn out.
    </span>
  );
}
