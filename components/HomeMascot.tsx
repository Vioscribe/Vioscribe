"use client";

import { useEffect, useRef, useState } from "react";

export default function HomeMascot() {
  const mascotRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blinking, setBlinking] = useState(false);
  const [pleased, setPleased] = useState(false);
  const [spark, setSpark] = useState(false);

  useEffect(() => {
    const mascot = mascotRef.current;
    if (!mascot) return;

    function trackPointer(event: PointerEvent) {
      const bounds = mascot!.getBoundingClientRect();
      const dx = event.clientX - (bounds.left + bounds.width / 2);
      const dy = event.clientY - (bounds.top + bounds.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1.25, distance * 0.035);

      mascot!.style.setProperty("--look-x", `${((dx / distance) * reach).toFixed(2)}px`);
      mascot!.style.setProperty("--look-y", `${((dy / distance) * reach).toFixed(2)}px`);
    }

    window.addEventListener("pointermove", trackPointer, { passive: true });

    // Random delays keep the blink occasional rather than metronomic.
    let active = true;
    let blinkTimer: ReturnType<typeof setTimeout> | undefined;
    let blinkEnd: ReturnType<typeof setTimeout> | undefined;
    function scheduleBlink() {
      blinkTimer = setTimeout(() => {
        if (!active) return;
        setBlinking(true);
        blinkEnd = setTimeout(() => {
          setBlinking(false);
          scheduleBlink();
        }, 140);
      }, 2600 + Math.random() * 4400);
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) scheduleBlink();

    return () => {
      active = false;
      window.removeEventListener("pointermove", trackPointer);
      if (blinkTimer) clearTimeout(blinkTimer);
      if (blinkEnd) clearTimeout(blinkEnd);
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
    };
  }, []);

  function react() {
    setSpark(true);
    setPleased(true);
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    reactionTimer.current = setTimeout(() => {
      setSpark(false);
      setPleased(false);
    }, 850);
  }

  return (
    <button
      ref={mascotRef}
      type="button"
      className={`home-mascot${pleased ? " is-pleased" : ""}${spark ? " is-sparking" : ""}`}
      aria-label="Wave to the little ember"
      onPointerEnter={() => {
        hoverTimer.current = setTimeout(() => setPleased(true), 450);
      }}
      onPointerLeave={() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setPleased(false);
      }}
      onClick={react}
    >
      <span className={`mascot-flame${blinking ? " is-blinking" : ""}`}>
        <span className="mascot-ear mascot-ear-left" />
        <span className="mascot-ear mascot-ear-right" />
        <span className="mascot-face">
          <span className="mascot-eye"><i /></span>
          <span className="mascot-eye"><i /></span>
          <span className="mascot-mouth">~</span>
        </span>
      </span>
      <span className="mascot-logs"><i /><i /><i /></span>
      {spark && <span className="mascot-sparks" aria-hidden="true"><i /><i /><i /><i /></span>}
    </button>
  );
}
