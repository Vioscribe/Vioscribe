"use client";

import { useEffect, useRef } from "react";

export default function HomeMascot() {
  const mascotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mascot = mascotRef.current;
    if (!mascot || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function trackPointer(event: PointerEvent) {
      const bounds = mascot!.getBoundingClientRect();
      const dx = event.clientX - (bounds.left + bounds.width / 2);
      const dy = event.clientY - (bounds.top + bounds.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1.5, distance * 0.04);

      mascot!.style.setProperty("--look-x", `${((dx / distance) * reach).toFixed(2)}px`);
      mascot!.style.setProperty("--look-y", `${((dy / distance) * reach).toFixed(2)}px`);
    }

    window.addEventListener("pointermove", trackPointer, { passive: true });
    return () => window.removeEventListener("pointermove", trackPointer);
  }, []);

  return (
    <div ref={mascotRef} className="home-mascot" aria-hidden="true">
      <span className="mascot-face">
        <span className="mascot-eye"><i /></span>
        <span className="mascot-eye"><i /></span>
        <span className="mascot-mouth">~</span>
      </span>
      <pre className="mascot-body">{` /|\\
/___\\`}</pre>
    </div>
  );
}
