"use client";

export default function SloganHighlight({ text }: { text: string }) {
  return (
    <span
      aria-hidden="true"
      className="landing-slogan-highlight"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) return;
        const x = ((event.clientX - bounds.left) / bounds.width) * 100;
        const y = ((event.clientY - bounds.top) / bounds.height) * 100;
        event.currentTarget.style.setProperty("--shimmer-x", `${x}%`);
        event.currentTarget.style.setProperty("--shimmer-y", `${y}%`);
      }}
    >
      {text}
    </span>
  );
}
