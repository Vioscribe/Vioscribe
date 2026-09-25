"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type EmberPixel = { x: number; y: number; dx: number; dy: number; midX: string; arc: string; color: string };

export default function HomeMascot() {
  const mascotRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const explosionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCount = useRef(0);
  const [blinking, setBlinking] = useState(false);
  const [pleased, setPleased] = useState(false);
  const [annoyed, setAnnoyed] = useState(false);
  const [spark, setSpark] = useState(false);
  const [tapSequence, setTapSequence] = useState(0);
  const [mood, setMood] = useState(0);
  const [exploding, setExploding] = useState(false);
  const [pixels, setPixels] = useState<EmberPixel[]>([]);

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
      if (explosionTimer.current) clearTimeout(explosionTimer.current);
    };
  }, []);

  function react() {
    if (exploding) return;
    clickCount.current += 1;
    setTapSequence((sequence) => sequence + 1);

    if (clickCount.current >= 20) {
      const bounds = mascotRef.current?.getBoundingClientRect();
      if (!bounds) return;

      // Scatter little square bits from a compact flame-and-logs pixel shape.
      const colors = ["#ffdf68", "#f9a825", "#f97316", "#d9480f", "#7c310e"];
      const shape = [
        "...##...",
        "..####..",
        ".######.",
        ".######.",
        "########",
        "########",
        "########",
        ".######.",
        "########",
        "########",
      ];
      const cellWidth = bounds.width / 8;
      const cellHeight = bounds.height / shape.length;
      const nextPixels: EmberPixel[] = [];

      shape.forEach((row, rowIndex) => {
        [...row].forEach((cell, columnIndex) => {
          if (cell !== "#") return;
          const targetX = Math.random() * window.innerWidth;
          // Let every pixel land close to the bottom edge before it reforms.
          const targetY = Math.max(0, window.innerHeight - 7);
          const x = bounds.left + columnIndex * cellWidth;
          const y = bounds.top + rowIndex * cellHeight;
          const dx = targetX - x;
          const dy = targetY - y;
          nextPixels.push({
            x,
            y,
            dx,
            dy,
            midX: `${dx * 0.48}px`,
            arc: `${Math.min(-24, dy * 0.22 - 44)}px`,
            color: colors[Math.min(colors.length - 1, Math.floor(rowIndex / 2))],
          });
        });
      });

      clickCount.current = 0;
      setPixels(nextPixels);
      setExploding(true);
      setPleased(false);
      setAnnoyed(false);
      setMood(0);
      explosionTimer.current = setTimeout(() => {
        setPixels([]);
        setExploding(false);
      }, 3450);
      return;
    }

    const nextMood = Math.floor(clickCount.current / 5);
    setMood(nextMood);
    setAnnoyed(nextMood >= 3);
    setSpark(true);
    setPleased(true);
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    reactionTimer.current = setTimeout(() => {
      setSpark(false);
      setPleased(false);
    }, 850);
  }

  return (
    <>
      {exploding && (
        <span className="mascot-pixel-field" aria-hidden="true">
          {pixels.map((pixel, index) => {
            const style = {
              left: pixel.x,
              top: pixel.y,
              backgroundColor: pixel.color,
              "--pixel-dx": `${pixel.dx}px`,
              "--pixel-dy": `${pixel.dy}px`,
              "--pixel-mid-x": pixel.midX,
              "--pixel-arc": pixel.arc,
            } as CSSProperties;
            return <i key={index} className="mascot-pixel" style={style} />;
          })}
        </span>
      )}
      <button
        ref={mascotRef}
        type="button"
        disabled={exploding}
        className={`home-mascot mood-${mood}${pleased ? " is-pleased" : ""}${annoyed ? " is-annoyed" : ""}${spark ? " is-sparking" : ""}${exploding ? " is-exploding" : ""}`}
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
          <span className="mascot-face">
            <span className="mascot-eye"><i /></span>
            <span className="mascot-eye"><i /></span>
            <span className="mascot-mouth">~</span>
          </span>
        </span>
        <span className="mascot-logs"><i /><i /><i /></span>
        {spark && <span key={tapSequence} className="mascot-sparks" aria-hidden="true"><i /><i /><i /><i /></span>}
      </button>
    </>
  );
}
